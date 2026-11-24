import AOS from 'aos';
import 'aos/dist/aos.css';

// Initialize AOS
AOS.init({
    duration: 1000,
    once: true,
    offset: 100
});

// Mobile Menu Toggle
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });
}

// Quote Form Handler
const quoteForm = document.getElementById('quote-form');
const formSuccess = document.getElementById('form-success');

if (quoteForm && formSuccess) {
    quoteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = quoteForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        const formData = new FormData(quoteForm);
        // FormSubmit delivers the submission straight to the inbox below.
        // No API key or server needed. The very first submission triggers a
        // one-time "Activate Form" email that must be clicked once.
        formData.append('_subject', 'New lead from cleanfeetpetcleanup.com');
        formData.append('_template', 'table');
        // Reply-to the customer so the owner can reply from Gmail in one click.
        const customerEmail = formData.get('email');
        if (customerEmail) formData.append('_replyto', customerEmail);

        try {
            const response = await fetch('https://formsubmit.co/ajax/cleanfeetpetcleanup@gmail.com', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            const data = await response.json().catch(() => ({}));
            // FormSubmit returns success === "true" (string) ONLY once the form
            // has been activated. Before activation it returns "false" with an
            // HTTP 200, so checking response.ok alone would falsely report
            // success and silently drop the lead. This means the success message
            // now doubles as a live activation check.
            const delivered = response.ok && (data.success === 'true' || data.success === true);

            if (delivered) {
                // Hide form and show success message
                quoteForm.style.display = 'none';
                formSuccess.style.display = 'block';
                console.log('Form submitted successfully');
            } else {
                alert("Oops! There was a problem submitting your form. Please try again or email us directly.");
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            alert("Oops! There was a problem submitting your form. Please try again or email us directly.");
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });

            // Close mobile menu if open
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        }
    });
});

// PayPal Integration
const paymentModal = document.getElementById('payment-modal');
const closeModal = document.querySelector('.close-modal');
const paypalContainer = document.getElementById('paypal-button-container');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.querySelector('#modal-description span');

/*
 * Recurring (MONTHLY) plans use PayPal hosted "Subscribe" buttons created in
 * the Clean Feet PayPal account (hosted_button_id values).
 * Each KEY must exactly match a checkout button's data-plan attribute.
 * IMPORTANT: the amount actually charged and the billing cycle are stored
 * INSIDE PayPal on each button. The price in the comment is only a note --
 * to change what a customer pays, edit the button in PayPal (and the price
 * shown on the site's cards), not this comment.
 * A plan missing from this map shows a "contact us" message instead of a
 * broken button.
 */
const PAYPAL_SUBSCRIBE_BUTTONS = {
    "1 Dog - Weekly Service":  "NCWLRYKPPTD9Y", // $45 / month
    "2 Dogs - Weekly Service": "LMRCNKCF2S7NJ", // $55 / month
    "3 Dogs - Weekly Service": "846AKPWLHKNHC", // $65 / month
    "4 Dogs - Weekly Service": "JWZERPR7EGL84", // $75 / month
    "1 Dog - Twice Weekly":    "8RJ8UETQFFZKL", // $85 / month
    "2 Dogs - Twice Weekly":   "8NXX9W5P8HQN8", // $95 / month
    "3 Dogs - Twice Weekly":   "YJ6D8GTHV9RSE", // $105 / month
    "4 Dogs - Twice Weekly":   "8J82UDBB6AHA2", // $115 / month
    "1 Cat Litter Service":    "TVMG96H5YPX64", // $65 / month
    "2 Cats Litter Service":   "3T2658M2K2PEA", // $85 / month
};

/*
 * Plans booked by requesting an invoice instead of paying online.
 * The request is emailed to the business; the owner creates and sends a
 * PayPal invoice manually for the right amount.
 */
const INVOICE_PLANS = new Set(["First Time Cleanup"]);

// First Time Cleanup: base price comes from the card's data-price ($65);
// each additional dog adds this much. Shown to the customer as an ESTIMATE
// only -- the owner sets the real amount on the invoice.
const CLEANUP_EXTRA_DOG_PRICE = 10;
const DOG_COUNT_OPTIONS = ['1', '2', '3', '4', '5+'];
const BUSINESS_PHONE = '(402) 320-3824';
const LEADS_EMAIL_ENDPOINT = 'https://formsubmit.co/ajax/cleanfeetpetcleanup@gmail.com';

function openPaymentModal(planName, price) {
    if (!paymentModal) return;
    if (INVOICE_PLANS.has(planName)) {
        modalTitle.textContent = 'Book Your Initial Clean';
        modalDesc.textContent = `${planName} — $${price} + $${CLEANUP_EXTRA_DOG_PRICE} per additional dog. We'll email you an invoice.`;
    } else {
        modalTitle.textContent = 'Complete Your Order';
        modalDesc.textContent = `${planName} — $${price}/month · billed monthly, cancel anytime`;
    }
    paymentModal.classList.add('active');
    renderPayPalButton(price, planName);
}

function closePaymentModal() {
    if (paymentModal) {
        paymentModal.classList.remove('active');
        if (paypalContainer) paypalContainer.innerHTML = ''; // Clear for next time
    }
}

if (closeModal) {
    closeModal.addEventListener('click', closePaymentModal);
}

window.addEventListener('click', (e) => {
    if (e.target === paymentModal) closePaymentModal();
});

function showPaypalMessage(message) {
    if (paypalContainer) {
        paypalContainer.innerHTML = `<p style="color: #b00020; text-align: center; padding: 1rem;">${message}</p>`;
    }
}

function renderPayPalButton(price, planName) {
    if (paypalContainer) paypalContainer.innerHTML = '';

    // One-time clean: customer requests an invoice; the owner bills them.
    if (INVOICE_PLANS.has(planName)) {
        renderInvoiceRequestForm(planName, Number(price));
        return;
    }

    // Recurring monthly plans use PayPal hosted Subscribe buttons
    // (the monthly price and billing cycle are set inside PayPal).
    renderSubscribeButton(planName);
}

// null means "5+ dogs": the owner confirms the price on the invoice.
function estimateCleanupTotal(basePrice, dogCount) {
    if (!/^[1-4]$/.test(dogCount)) return null;
    return basePrice + (Number(dogCount) - 1) * CLEANUP_EXTRA_DOG_PRICE;
}

const dogLabel = (dogCount) => `${dogCount} ${dogCount === '1' ? 'Dog' : 'Dogs'}`;

function renderInvoiceRequestForm(planName, basePrice) {
    const dogOptions = DOG_COUNT_OPTIONS
        .map((n) => `<option value="${n}">${dogLabel(n)}</option>`)
        .join('');

    paypalContainer.innerHTML = `
        <form class="invoice-request-form" style="text-align: left;">
            <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true">
            <input type="text" name="name" class="form-input" placeholder="Full Name" autocomplete="name" required>
            <input type="email" name="email" class="form-input" placeholder="Email (your invoice is sent here)" autocomplete="email" required>
            <input type="tel" name="phone" class="form-input" placeholder="Phone Number" autocomplete="tel" required>
            <input type="text" name="address" class="form-input" placeholder="Service Address" autocomplete="street-address" required>
            <select name="dogs" class="form-input" aria-label="Number of dogs" required>${dogOptions}</select>
            <textarea name="notes" class="form-input" rows="2" placeholder="Gate code, yard notes, preferred day (optional)"></textarea>
            <p class="invoice-estimate" style="text-align: center; font-weight: 600; margin: 0.25rem 0 1rem;"></p>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Request Invoice</button>
        </form>
    `;

    const form = paypalContainer.querySelector('form');
    const estimate = form.querySelector('.invoice-estimate');
    const updateEstimate = () => {
        const total = estimateCleanupTotal(basePrice, form.elements.dogs.value);
        estimate.textContent = total === null
            ? 'For 5+ dogs, we\'ll confirm your price on the invoice.'
            : `Estimated total: $${total} (one-time)`;
    };
    form.elements.dogs.addEventListener('change', updateEstimate);
    updateEstimate();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitInvoiceRequest(form, planName, basePrice);
    });
}

async function submitInvoiceRequest(form, planName, basePrice) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    const formData = new FormData(form);
    const dogs = formData.get('dogs');
    const total = estimateCleanupTotal(basePrice, dogs);
    formData.append('service', planName);
    formData.append('estimated_total', total === null ? 'Confirm price (5+ dogs)' : `$${total}`);
    formData.append('_subject', `Invoice request: ${planName}, ${dogLabel(dogs)} - cleanfeetpetcleanup.com`);
    formData.append('_template', 'table');
    const customerEmail = formData.get('email');
    if (customerEmail) formData.append('_replyto', customerEmail);

    try {
        const response = await fetch(LEADS_EMAIL_ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' },
        });
        const data = await response.json().catch(() => ({}));
        // Same check as the contact form: FormSubmit only reports
        // success === "true" once the inbox has activated the form.
        const delivered = response.ok && (data.success === 'true' || data.success === true);
        if (!delivered) throw new Error('Invoice request was not delivered');

        modalTitle.textContent = 'Request Sent!';
        modalDesc.textContent = `${planName}, ${dogLabel(dogs)}. We'll email your invoice shortly.`;
        paypalContainer.innerHTML = `
            <div style="padding: 1.5rem; text-align: center;">
                <i class="fas fa-check-circle" style="font-size: 3.5rem; color: var(--primary); margin-bottom: 1rem;"></i>
                <p style="font-weight: 600;">Thanks! Watch your inbox for your invoice.</p>
                <p style="margin-top: 0.5rem; opacity: 0.8;">Questions? Call or text ${BUSINESS_PHONE}.</p>
            </div>
        `;
    } catch (err) {
        console.error('Invoice request error:', err);
        alert(`Sorry, we couldn't send your request. Please try again, or call or text ${BUSINESS_PHONE}.`);
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
}

// Renders a form that sends the customer to PayPal's secure hosted checkout
// for the plan's Subscribe button. After subscribing, PayPal returns them to
// the return URL configured on that button in PayPal.
function renderSubscribeButton(planName) {
    const buttonId = PAYPAL_SUBSCRIBE_BUTTONS[planName];
    if (!buttonId || !/^[A-Z0-9]+$/.test(buttonId)) {
        console.error('No PayPal Subscribe button configured for plan:', planName);
        showPaypalMessage('This plan isn\'t available for online checkout yet. Please contact us and we\'ll start your service.');
        return;
    }

    paypalContainer.innerHTML = `
        <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top" class="paypal-subscribe-form">
            <input type="hidden" name="cmd" value="_s-xclick">
            <input type="hidden" name="hosted_button_id" value="${buttonId}">
            <input type="hidden" name="currency_code" value="USD">
            <button type="submit" class="btn btn-primary" style="width: 100%;">
                <i class="fab fa-paypal" style="margin-right: 0.5rem;"></i>Subscribe with PayPal
            </button>
        </form>
        <p style="margin-top: 0.75rem; font-size: 0.85rem; opacity: 0.75; text-align: center;">
            You'll finish on PayPal's secure checkout, then return here to enter your service address.
        </p>
    `;
}

// Handle Payment Success Message on Contact Page
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('payment') === 'success') {
    // contact.html's hero is <section class="page-hero"><div class="container"><h1>…</h1><p>…</p>
    const contactHeader = document.querySelector('.page-hero h1') || document.querySelector('.contact-hero h1') || document.querySelector('.section-title h2');
    const contactSub = document.querySelector('.page-hero h1 ~ p') || document.querySelector('.contact-hero p') || document.querySelector('.section-title p');

    if (contactHeader) contactHeader.innerHTML = 'Payment <span>Received!</span>';
    if (contactSub) {
        contactSub.innerHTML = `<strong style="color: var(--primary); display: block; margin-bottom: 1rem; font-size: 1.2rem;">Thank you for your purchase!</strong> Please fill out the form below with your address and service details to complete your setup.`;
    }

    // Scroll to form
    const form = document.getElementById('quote-form');
    if (form) {
        setTimeout(() => {
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the form
            form.style.boxShadow = '0 0 30px rgba(106, 153, 78, 0.3)';
        }, 500);
    }
}

// Attach listeners to checkout buttons
document.querySelectorAll('.checkout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const price = btn.getAttribute('data-price');
        const plan = btn.getAttribute('data-plan');
        openPaymentModal(plan, price);
    });
});
