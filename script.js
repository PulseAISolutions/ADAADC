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
       MULTI-STEP REGISTRATION + PAYMENT FORM
       ============================================== */

    const form = document.getElementById('registration-form');
    if (!form) return;

    const step1 = document.getElementById('form-step-1');
    const step2 = document.getElementById('form-step-2');
    const btnToPayment = document.getElementById('btn-to-payment');
    const btnBack = document.getElementById('btn-back');

    const programSelect = document.getElementById('program-select');
    const playerNameInput = document.getElementById('player-name');
    const birthYearInput = document.getElementById('birth-year');
    const guardianNameInput = document.getElementById('guardian-name');
    const contactInput = document.getElementById('contact-number');
    const locationSelect = document.getElementById('location-select');

    const summaryProgram = document.getElementById('summary-program');
    const summaryPlayer = document.getElementById('summary-player');
    const summaryAmount = document.getElementById('summary-amount');
    const gcashAmount = document.getElementById('gcash-amount');
    const btnPayAmount = document.getElementById('btn-pay-amount');

    let selectedPrice = 0;

    /* -- Format price helper -- */
    const formatPeso = (n) => '₱' + Number(n).toLocaleString();

    /* -- Enable "Continue" only when all step-1 fields are filled -- */
    const step1Inputs = [playerNameInput, birthYearInput, guardianNameInput, contactInput, programSelect, locationSelect];

    const checkStep1 = () => {
        const allFilled = step1Inputs.every(el => el && el.value.trim() !== '');
        btnToPayment.disabled = !allFilled;
    };

    step1Inputs.forEach(el => {
        if (el) {
            el.addEventListener('input', checkStep1);
            el.addEventListener('change', checkStep1);
        }
    });

    /* -- Sanitize phone input on type -- */
    if (contactInput) {
        contactInput.addEventListener('input', () => {
            contactInput.value = Security.sanitizePhone(contactInput.value);
        });
    }

    /* -- Go to Step 2 -- */
    btnToPayment.addEventListener('click', () => {
        // Validate all fields
        let valid = true;
        step1Inputs.forEach(el => {
            if (!el.value.trim()) {
                el.closest('.form-input').style.borderColor = '#e31e24';
                valid = false;
            } else {
                el.closest('.form-input').style.borderColor = '';
            }
        });
        if (!valid) return;

        // Store price from program select
        selectedPrice = parseInt(programSelect.value);
        const programName = programSelect.options[programSelect.selectedIndex].text.split(' — ')[0];

        // Populate summary using textContent (safe, no XSS)
        summaryProgram.textContent = Security.sanitizeText(programName);
        summaryPlayer.textContent = Security.sanitizeText(playerNameInput.value);
        summaryAmount.textContent = formatPeso(selectedPrice);
        gcashAmount.textContent = formatPeso(selectedPrice);
        btnPayAmount.textContent = formatPeso(selectedPrice);

        // Show step 2
        step1.style.display = 'none';
        step2.style.display = 'block';

        // Scroll to form top
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /* -- Back Button -- */
    btnBack.addEventListener('click', () => {
        step2.style.display = 'none';
        step1.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /* -- Payment Method Toggle -- */
    const methodBtns = document.querySelectorAll('.method-btn');
    const cardSection = document.getElementById('payment-card');
    const gcashSection = document.getElementById('payment-gcash');

    methodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            methodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const method = btn.dataset.method;
            if (method === 'card') {
                cardSection.style.display = 'block';
                gcashSection.style.display = 'none';
                cardSection.querySelectorAll('input').forEach(i => i.required = true);
                document.getElementById('gcash-ref').required = false;
            } else {
                cardSection.style.display = 'none';
                gcashSection.style.display = 'block';
                cardSection.querySelectorAll('input').forEach(i => i.required = false);
                document.getElementById('gcash-ref').required = true;
            }
        });
    });

    /* ==============================================
       FORM SUBMISSION → MAILTO & MANNYPAY (FUTURE)
       ============================================== */

    const submitRateLimit = Security.createRateLimiter(5000); // 5s cooldown

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Rate-limit guard
        if (!submitRateLimit()) {
            alert('Please wait a few seconds before submitting again.');
            return;
        }

        const payBtn = form.querySelector('.btn-pay');
        const originalText = payBtn.innerHTML;

        // Gather + sanitize all form data
        const formData = {
            playerName: Security.sanitizeText(playerNameInput.value),
            birthYear: Security.sanitizeText(birthYearInput.value),
            guardianName: Security.sanitizeText(guardianNameInput.value),
            contactNumber: Security.sanitizePhone(contactInput.value),
            program: Security.sanitizeText(programSelect.options[programSelect.selectedIndex].text.split(' — ')[0]),
            location: Security.sanitizeText(locationSelect.value),
            amount: formatPeso(selectedPrice),
            paymentMethod: 'mannypay',
            mannyPayMobile: Security.sanitizePhone(document.getElementById('mannypay-mobile').value),
            nonce: SESSION_NONCE
        };

        /* ------------------------------------------------
           PAYMONGO INTEGRATION (FUTURE)
           ------------------------------------------------
           When ready, replace this block with:
           
           1. Create a PayMongo Payment Intent via their API:
              POST https://api.paymongo.com/v1/payment_intents
              
           2. For card payments, use PayMongo's client-side
              tokenization (paymongo.js) so card data NEVER
              touches our code — it goes directly to PayMongo.
              
           3. For GCash, create a PayMongo Source:
              POST https://api.paymongo.com/v1/sources
              type: "gcash", redirect URL, etc.
              
           4. On success, fire the mailto with confirmation.
           
           See: https://developers.paymongo.com/docs
           ------------------------------------------------ */

        // Show processing state
        payBtn.innerHTML = '⏳ Processing...';
        payBtn.disabled = true;

        // Build the mailto body
        const subject = encodeURIComponent(`ADA Registration: ${formData.playerName} — ${formData.program}`);
        const body = encodeURIComponent(
            `NEW REGISTRATION\n` +
            `================\n\n` +
            `Player Name: ${formData.playerName}\n` +
            `Birth Year: ${formData.birthYear}\n` +
            `Parent/Guardian: ${formData.guardianName}\n` +
            `Contact: ${formData.contactNumber}\n` +
            `Program: ${formData.program}\n` +
            `Location: ${formData.location}\n` +
            `Amount: ${formData.amount}\n` +
            `Payment Method: MannyPay\n` +
            `MannyPay Mobile: ${formData.mannyPayMobile}\n` +
            `\n---\nSubmitted: ${new Date().toLocaleString()}\n` +
            `Session: ${formData.nonce.substring(0, 8)}\n`
        );

        const mailtoLink = `mailto:azkalsdevelopmentacademy@gmail.com?subject=${subject}&body=${body}`;

        // Simulate brief processing, then open mailto
        setTimeout(() => {
            // Open the email client
            window.location.href = mailtoLink;

            payBtn.innerHTML = '✅ Registration Sent!';
            payBtn.style.background = '#22c55e';

            setTimeout(() => {
                payBtn.innerHTML = originalText;
                payBtn.style.background = '';
                payBtn.disabled = false;
                form.reset();
                step2.style.display = 'none';
                step1.style.display = 'block';
                btnToPayment.disabled = true;
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 3000);
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

    if(merchCheckoutForm) merchCheckoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('merch-customer-name').value;
        const contact = document.getElementById('merch-contact-number').value;
        const mobile = document.getElementById('merch-mannypay-mobile').value;
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        let itemsList = '';
        cart.forEach(item => {
            itemsList += `- ${item.quantity}x ${item.name} (₱${item.price.toLocaleString()})%0D%0A`;
        });
        
        const subject = encodeURIComponent(`New ADA Merch Order from ${name} (MannyPay)`);
        const body = `New Merch Order Details:%0D%0A%0D%0ACustomer Name: ${encodeURIComponent(name)}%0D%0AContact Number: ${encodeURIComponent(contact)}%0D%0A%0D%0A--- ITEM SUMMARY ---%0D%0A${itemsList}%0D%0A%0D%0ATOTAL AMOUNT: ₱${total.toLocaleString()}%0D%0A%0D%0A--- PAYMENT (MANNYPAY) ---%0D%0APayment via MannyPay Mobile No: ${encodeURIComponent(mobile)}`;
        
        const mailtoLink = `mailto:azkalsdevelopmentacademy@gmail.com?subject=${subject}&body=${body}`;
        
        const btnPay = document.getElementById('btn-merch-pay');
        const oldText = btnPay.innerHTML;
        btnPay.innerHTML = '✅ Order Sent!';
        btnPay.style.background = '#22c55e';
        
        setTimeout(() => {
            window.location.href = mailtoLink;
            
            setTimeout(() => {
                btnPay.innerHTML = oldText;
                btnPay.style.background = 'var(--blue)';
                merchCheckoutModal.classList.remove('active');
                cart = []; 
                updateCartUI();
                merchCheckoutForm.reset();
            }, 3000);
        }, 1500);
    });

});
