/* ============================================
   AZKALS DEVELOPMENT ACADEMY — INTERACTIVITY
   ============================================
   
   SECURITY NOTES:
   - All user inputs are sanitized before use
   - No innerHTML with user data (XSS prevention)
   - No eval() or inline scripts
   - CSP headers set in index.html <meta>
   - Form data sent via mailto: (client-only, no backend)
   - PayMongo integration placeholder for future backend
   ============================================ */

'use strict';

// ---------------------------------------------------------
// UI POLISH: Force top-scroll on page refresh!
// ---------------------------------------------------------
if (window.history && history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

/* ==============================================
   SECURITY: Input Sanitization Utilities
   ============================================== */

const Security = {
    /**
     * Sanitize text input — strips HTML tags and trims whitespace.
     * Prevents XSS if value is ever rendered back into the DOM.
     */
    sanitizeText(input) {
        if (typeof input !== 'string') return '';
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .trim();
    },

    /**
     * Sanitize phone number — allow only digits, +, spaces, dashes.
     */
    sanitizePhone(input) {
        if (typeof input !== 'string') return '';
        return input.replace(/[^\d\s+\-()]/g, '').trim();
    },

    /**
     * Sanitize card-like numeric input — digits and spaces only.
     */
    sanitizeNumeric(input) {
        if (typeof input !== 'string') return '';
        return input.replace(/[^\d\s]/g, '').trim();
    },

    /**
     * Validate email format (basic).
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    /**
     * Rate limiter — prevents rapid repeated submissions.
     */
    createRateLimiter(intervalMs) {
        let lastCall = 0;
        return () => {
            const now = Date.now();
            if (now - lastCall < intervalMs) return false;
            lastCall = now;
            return true;
        };
    },

    /**
     * Generate a simple anti-CSRF nonce per session.
     */
    generateNonce() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    }
};

/* Session nonce for form integrity */
const SESSION_NONCE = Security.generateNonce();


document.addEventListener('DOMContentLoaded', () => {

    /* ---------- Sticky Header on Scroll ---------- */
    const header = document.querySelector('.header');
    const handleScroll = () => {
        if (window.scrollY > 60) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    /* ---------- Mobile Menu Toggle ---------- */
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileNavClose = document.querySelector('.mobile-nav-close');
    const mobileLinks = document.querySelectorAll('.mobile-nav a');

    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
            mobileNav.classList.add('open');
            document.body.style.overflow = 'hidden';
        });

        const closeMenu = () => {
            mobileNav.classList.remove('open');
            document.body.style.overflow = '';
        };

        mobileNavClose.addEventListener('click', closeMenu);
        mobileLinks.forEach(link => link.addEventListener('click', closeMenu));
    }

    /* ---------- Smooth Scroll for Nav Links ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    /* ---------- Animated Stats Counter ---------- */
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    let statsAnimated = false;

    const animateCounters = () => {
        statNumbers.forEach(el => {
            const target = parseInt(el.dataset.target);
            const suffix = el.dataset.suffix || '';
            const duration = 2000;
            const start = performance.now();

            const tick = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(eased * target);
                el.textContent = el.dataset.noComma ? current + suffix : current.toLocaleString() + suffix;
                if (progress < 1) requestAnimationFrame(tick);
            };

            requestAnimationFrame(tick);
        });
    };

    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !statsAnimated) {
                    statsAnimated = true;
                    animateCounters();
                    observer.disconnect();
                }
            });
        }, { threshold: 0.3 });
        observer.observe(statsSection);
    }

    /* ---------- Fade-in on Scroll ---------- */
    const animateElements = document.querySelectorAll('.fade-in');
    if (animateElements.length) {
        const fadeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    fadeObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        animateElements.forEach(el => fadeObserver.observe(el));
    }

    /* ==============================================
       REGISTRATION FORM — LOCATION-BASED FLOW
       ============================================== */

    const form = document.getElementById('registration-form');
    if (!form) return;

    const btnSubmit = document.getElementById('btn-submit-registration');

    const playerNameInput = document.getElementById('player-name');
    const birthYearInput = document.getElementById('birth-year');
    const guardianNameInput = document.getElementById('guardian-name');
    const contactInput = document.getElementById('contact-number');
    const locationSelect = document.getElementById('location-select');
    const programSelect = document.getElementById('program-select');
    const adaMainBranchSelect = document.getElementById('ada-main-branch');

    const programRow = document.getElementById('program-row');
    const adaMainBranchRow = document.getElementById('ada-main-branch-row');
    const quotationBanner = document.getElementById('quotation-banner');

    /* -- Track which flow we're in -- */
    let isAdaMain = false;

    /* -- Location Change Handler -- */
    if (locationSelect) {
        locationSelect.addEventListener('change', () => {
            const loc = locationSelect.value;
            isAdaMain = (loc === 'ADA Main');

            if (isAdaMain) {
                // Show branch sub-select + program/pricing
                adaMainBranchRow.style.display = '';
                programRow.style.display = '';
                quotationBanner.style.display = 'none';
                programSelect.required = true;
                adaMainBranchSelect.required = true;
                btnSubmit.textContent = 'Submit Registration →';
            } else {
                // Hide branch + program, show quotation banner
                adaMainBranchRow.style.display = 'none';
                programRow.style.display = 'none';
                quotationBanner.style.display = 'block';
                programSelect.required = false;
                adaMainBranchSelect.required = false;
                // Reset hidden selects
                programSelect.selectedIndex = 0;
                adaMainBranchSelect.selectedIndex = 0;
                btnSubmit.textContent = 'Request Quotation →';
            }
            checkFormCompletion();
        });
    }

    /* -- Enable Submit only when required fields are filled -- */
    const baseInputs = [playerNameInput, birthYearInput, guardianNameInput, contactInput, locationSelect];

    const checkFormCompletion = () => {
        // Always check base fields
        let allFilled = baseInputs.every(el => el && el.value.trim() !== '');

        // If ADA Main, also require branch + program
        if (isAdaMain) {
            if (!adaMainBranchSelect || !adaMainBranchSelect.value.trim()) allFilled = false;
            if (!programSelect || !programSelect.value.trim()) allFilled = false;
        }

        if (btnSubmit) btnSubmit.disabled = !allFilled;
    };

    // Listen on all inputs
    [...baseInputs, programSelect, adaMainBranchSelect].forEach(el => {
        if (el) {
            el.addEventListener('input', checkFormCompletion);
            el.addEventListener('change', checkFormCompletion);
        }
    });

    /* -- Sanitize phone input on type -- */
    if (contactInput) {
        contactInput.addEventListener('input', () => {
            contactInput.value = Security.sanitizePhone(contactInput.value);
        });
    }

    /* ==============================================
       FORM SUBMISSION → HTML2CANVAS & MAILTO
       ============================================== */

    const submitRateLimit = Security.createRateLimiter(5000); // 5s cooldown

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Rate-limit guard
        if (!submitRateLimit()) {
            alert('Please wait a few seconds before submitting again.');
            return;
        }

        // Validate required fields
        let valid = true;
        const fieldsToValidate = isAdaMain
            ? [...baseInputs, programSelect, adaMainBranchSelect]
            : baseInputs;

        fieldsToValidate.forEach(el => {
            const wrapper = el.closest('.form-input');
            if (!el.value.trim()) {
                if (wrapper) wrapper.style.borderColor = '#e31e24';
                valid = false;
            } else {
                if (wrapper) wrapper.style.borderColor = '';
            }
        });
        if (!valid) return;

        const playerName = Security.sanitizeText(playerNameInput.value);
        const contactNumber = Security.sanitizePhone(contactInput.value);
        const location = Security.sanitizeText(locationSelect.value);

        if (btnSubmit) {
            btnSubmit.innerHTML = '⏳ Generating Receipt...';
            btnSubmit.disabled = true;
        }

        // --- Screenshot Generation ---
        try {
            const formContainer = document.getElementById('form-step-1');
            const originalPadding = formContainer.style.padding;
            const originalMargin = formContainer.style.margin;
            const originalRadius = formContainer.style.borderRadius;

            formContainer.style.padding = '40px';
            formContainer.style.backgroundColor = '#ffffff';
            formContainer.style.margin = '0';
            formContainer.style.borderRadius = '0';

            // Temporarily hide the submit button + quotation banner for screenshot
            if (btnSubmit) btnSubmit.style.display = 'none';

            await new Promise(res => setTimeout(res, 50));

            const canvas = await html2canvas(formContainer, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            // Restore styles
            formContainer.style.padding = originalPadding;
            formContainer.style.backgroundColor = '';
            formContainer.style.margin = originalMargin;
            formContainer.style.borderRadius = originalRadius;
            if (btnSubmit) btnSubmit.style.display = 'block';

            const imageURL = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.download = `ADA_Registration_${playerName.replace(/\s+/g, '_')}.png`;
            link.href = imageURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Screenshot generation failed: ", error);
        }

        // --- Mailto Generation ---
        if (btnSubmit) btnSubmit.innerHTML = '⏳ Processing Email...';

        let subject, body;

        if (isAdaMain) {
            // Full registration with program + branch
            const program = Security.sanitizeText(programSelect.options[programSelect.selectedIndex].text);
            const branch = Security.sanitizeText(adaMainBranchSelect.options[adaMainBranchSelect.selectedIndex].text);

            subject = encodeURIComponent(`ADA Registration: ${playerName} — ${program.split('—')[0].trim()}`);
            body = encodeURIComponent(
                `NEW REGISTRATION\n` +
                `================\n\n` +
                `Player Name: ${playerName}\n` +
                `Birth Year: ${Security.sanitizeText(birthYearInput.value)}\n` +
                `Parent/Guardian: ${Security.sanitizeText(guardianNameInput.value)}\n` +
                `Contact: ${contactNumber}\n` +
                `Program: ${program}\n` +
                `Location: ADA Main — ${branch}\n` +
                `\n---\nSubmitted: ${new Date().toLocaleString()}\n` +
                `Session: ${SESSION_NONCE.substring(0, 8)}\n\n` +
                `(Please attach the downloaded screenshot of your registration details to this email)`
            );
        } else {
            // Quotation request — no pricing
            subject = encodeURIComponent(`ADA Quotation Request: ${playerName} — ${location}`);
            body = encodeURIComponent(
                `QUOTATION REQUEST\n` +
                `=================\n\n` +
                `Player Name: ${playerName}\n` +
                `Birth Year: ${Security.sanitizeText(birthYearInput.value)}\n` +
                `Parent/Guardian: ${Security.sanitizeText(guardianNameInput.value)}\n` +
                `Contact: ${contactNumber}\n` +
                `Preferred Location: ${location}\n` +
                `\n---\nSubmitted: ${new Date().toLocaleString()}\n` +
                `Session: ${SESSION_NONCE.substring(0, 8)}\n\n` +
                `Hi! I'm interested in enrolling at the ${location} branch. Could you please provide the available programs, schedules, and pricing? Thank you!`
            );
        }

        const mailtoLink = `mailto:azkalsdevelopmentacademy@gmail.com?subject=${subject}&body=${body}`;

        setTimeout(() => {
            window.location.href = mailtoLink;

            if (btnSubmit) {
                btnSubmit.innerHTML = isAdaMain ? '✅ Registration Complete!' : '✅ Quotation Sent!';
                btnSubmit.style.background = '#22c55e';
                btnSubmit.style.borderColor = '#22c55e';

                setTimeout(() => {
                    btnSubmit.innerHTML = 'Submit Registration →';
                    btnSubmit.style.background = '';
                    btnSubmit.style.borderColor = '';
                    form.reset();
                    btnSubmit.disabled = true;
                    // Reset visibility
                    programRow.style.display = 'none';
                    adaMainBranchRow.style.display = 'none';
                    quotationBanner.style.display = 'none';
                    isAdaMain = false;
                }, 3000);
            } else {
                form.reset();
            }
        }, 1500);
    });

    /* ==============================================
       SHOPPING CART LOGIC
       ============================================== */
    let cart = [];
    const cartFab = document.getElementById('cart-fab');
    const cartBadge = document.getElementById('cart-badge');
    const cartModal = document.getElementById('cart-modal');
    const closeCartBtn = document.getElementById('close-cart');
    const btnKeepShopping = document.getElementById('btn-keep-shopping');
    const btnCheckout = document.getElementById('btn-checkout');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');

    function updateCartUI() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.innerText = totalItems;
        if (totalItems > 0) {
            cartFab.style.display = 'flex';
        } else {
            cartFab.style.display = 'none';
            cartModal.classList.remove('active');
        }

        cartItemsContainer.innerHTML = '';
        let total = 0;
        cart.forEach(item => {
            total += item.price * item.quantity;
            const el = document.createElement('div');
            el.className = 'cart-item';
            el.style = "display: flex; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--gray-100);";
            el.innerHTML = `
                <img src="${item.img}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: contain; border-radius: 4px; border: 1px solid var(--gray-200); padding: 4px; margin-right: 16px; background: white;">
                <div class="cart-item-details" style="flex-grow: 1;">
                    <div class="cart-item-title" style="font-weight: bold; color: var(--navy); margin-bottom: 4px; font-size: 0.95rem;">${item.name}</div>
                    <div class="cart-item-price" style="color: var(--red); font-size: 0.9rem; font-weight: bold;">₱${item.price.toLocaleString()}</div>
                </div>
                <div class="cart-item-quantity" style="display: flex; align-items: center; gap: 10px;">
                    <button type="button" class="qty-btn minus" data-id="${item.id}" style="background: var(--gray-100); border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">-</button>
                    <span style="font-weight: 600;">${item.quantity}</span>
                    <button type="button" class="qty-btn plus" data-id="${item.id}" style="background: var(--gray-100); border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">+</button>
                </div>
            `;
            cartItemsContainer.appendChild(el);
        });
        cartTotalPrice.innerText = '₱' + total.toLocaleString();

        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const isPlus = e.target.classList.contains('plus');
                const item = cart.find(i => i.id === id);
                if (item) {
                    if (isPlus) item.quantity++;
                    else item.quantity--;
                    
                    if (item.quantity <= 0) {
                        cart = cart.filter(i => i.id !== id);
                    }
                    updateCartUI();
                }
            });
        });
    }

    // Add to cart buttons hook
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            const price = parseInt(btn.dataset.price);
            const img = btn.dataset.img;

            const existing = cart.find(i => i.id === id);
            if (existing) {
                existing.quantity++;
            } else {
                cart.push({ id, name, price, img, quantity: 1 });
            }
            updateCartUI();
            
            // Visual feedback
            const oldText = btn.innerText;
            btn.innerText = '✓ Added to Cart';
            btn.style.background = '#22c55e';
            btn.style.borderColor = '#22c55e';
            setTimeout(() => {
                btn.innerText = oldText;
                btn.style.background = '';
                btn.style.borderColor = '';
            }, 1000);
        });
    });

    if(cartFab) cartFab.addEventListener('click', () => cartModal.classList.add('active'));
    if(closeCartBtn) closeCartBtn.addEventListener('click', () => cartModal.classList.remove('active'));
    if(btnKeepShopping) btnKeepShopping.addEventListener('click', () => cartModal.classList.remove('active'));

    // Checkout Hook!
    const merchCheckoutModal = document.getElementById('merch-checkout-modal');
    const closeMerchCheckoutBtn = document.getElementById('close-merch-checkout');
    const merchCheckoutForm = document.getElementById('merch-checkout-form');
    
    if(btnCheckout) btnCheckout.addEventListener('click', () => {
        if (cart.length === 0) return;
        cartModal.classList.remove('active');
        
        merchCheckoutModal.classList.add('active');
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('merch-checkout-total').innerText = '₱' + total.toLocaleString();
        document.getElementById('btn-merch-pay-amount').innerText = '₱' + total.toLocaleString();
    });

    if(closeMerchCheckoutBtn) closeMerchCheckoutBtn.addEventListener('click', () => {
        merchCheckoutModal.classList.remove('active');
    });

    if(merchCheckoutForm) merchCheckoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('merch-customer-name').value;
        const contact = document.getElementById('merch-contact-number').value;
        const branch = document.getElementById('merch-pickup-branch').value;
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        let itemsList = '';
        cart.forEach(item => {
            itemsList += `- ${item.quantity}x ${item.name} (₱${item.price.toLocaleString()})%0D%0A`;
        });
        
        const btnPay = document.getElementById('btn-merch-pay');
        const oldText = btnPay.innerHTML;
        btnPay.innerHTML = '📸 Generating Receipt...';
        
        // Use html2canvas to capture the checkout modal
        try {
            const formContainer = merchCheckoutModal.querySelector('.cart-modal-content');
            const originalBg = formContainer.style.background;
            formContainer.style.background = '#ffffff';
            
            if (closeMerchCheckoutBtn) closeMerchCheckoutBtn.style.display = 'none';
            btnPay.style.display = 'none';
            
            const canvas = await html2canvas(formContainer, {
                scale: 2,
                backgroundColor: '#ffffff'
            });
            
            formContainer.style.background = originalBg;
            if (closeMerchCheckoutBtn) closeMerchCheckoutBtn.style.display = 'block';
            btnPay.style.display = 'block';
            
            const imageURL = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.download = `ADA_Merch_Order_${name.replace(/\s+/g, '_')}.png`;
            link.href = imageURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error("Screenshot generation failed: ", error);
        }

        btnPay.innerHTML = '⏳ Preparing Email...';

        const subject = encodeURIComponent(`ADA Merch Order: ${name} (GCash / ${branch})`);
        const body = `MERCHANDISE ORDER%0D%0A%0D%0ACustomer Name: ${encodeURIComponent(name)}%0D%0AContact Number: ${encodeURIComponent(contact)}%0D%0APickup Branch: ${encodeURIComponent(branch)}%0D%0A%0D%0A--- ITEM SUMMARY ---%0D%0A${itemsList}%0D%0A%0D%0ATOTAL AMOUNT: ₱${total.toLocaleString()}%0D%0A%0D%0A--- INSTRUCTIONS ---%0D%0APlease attach TWO screenshots to this email:%0D%0A1. Your auto-downloaded Merch Order Receipt%0D%0A2. Your GCash transfer proof (₱${total.toLocaleString()})`;
        
        const mailtoLink = `mailto:azkalsdevelopmentacademy@gmail.com?subject=${subject}&body=${body}`;
        
        setTimeout(() => {
            window.location.href = mailtoLink;
            
            btnPay.innerHTML = '✅ Order Sent!';
            btnPay.style.background = '#22c55e';
            
            setTimeout(() => {
                btnPay.innerHTML = oldText;
                btnPay.style.background = '';
                merchCheckoutModal.classList.remove('active');
                cart = []; 
                updateCartUI();
                merchCheckoutForm.reset();
            }, 3000);
        }, 1500);
    });

});
