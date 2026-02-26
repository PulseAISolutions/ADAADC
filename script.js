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

    /* -- Card Number Formatting (digits only, grouped by 4) -- */
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            let val = Security.sanitizeNumeric(e.target.value);
            val = val.replace(/\s/g, '').substring(0, 16);
            val = val.replace(/(.{4})/g, '$1 ').trim();
            e.target.value = val;
        });
    }

    /* -- Expiry Formatting -- */
    const cardExpiryInput = document.getElementById('card-expiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length >= 2) {
                val = val.substring(0, 2) + ' / ' + val.substring(2, 4);
            }
            e.target.value = val;
        });
    }

    /* -- CVV: digits only -- */
    const cardCvvInput = document.getElementById('card-cvv');
    if (cardCvvInput) {
        cardCvvInput.addEventListener('input', (e) => {
            e.target.value = Security.sanitizeNumeric(e.target.value).replace(/\s/g, '').substring(0, 4);
        });
    }

    /* ==============================================
       FORM SUBMISSION → MAILTO + PAYMONGO (FUTURE)
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
            paymentMethod: document.querySelector('.method-btn.active')?.dataset.method || 'card',
            nonce: SESSION_NONCE
        };

        // Add payment-specific data
        if (formData.paymentMethod === 'gcash') {
            formData.gcashRef = Security.sanitizeText(document.getElementById('gcash-ref').value);
        }
        // NOTE: Card data is NOT included in the mailto.
        // Card payments will be processed securely via PayMongo's client-side SDK
        // (to be integrated). Card numbers never touch our servers or email.

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
            `Payment Method: ${formData.paymentMethod === 'card' ? 'Credit/Debit Card' : 'GCash'}\n` +
            (formData.gcashRef ? `GCash Ref #: ${formData.gcashRef}\n` : '') +
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

});
