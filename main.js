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

// Plans that are charged ONCE (not a subscription).
const ONE_TIME_PLANS = new Set(["First Time Cleanup"]);

function openPaymentModal(planName, price) {
    if (!paymentModal) return;
    modalTitle.textContent = 'Complete Your Order';
    if (ONE_TIME_PLANS.has(planName)) {
        modalDesc.textContent = `${planName} — $${price} (one-time)`;
    } else {
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

function showPaymentSuccess(planName, firstName) {
    modalTitle.textContent = 'Payment Successful!';
    modalDesc.textContent = 'Redirecting you to provide your service details...';
    const greeting = firstName ? `Thank you, ${firstName}!` : 'Thank you!';
    paypalContainer.innerHTML = `
        <div style="padding: 2rem; color: var(--secondary); text-align: center;">
            <i class="fas fa-check-circle" style="font-size: 4rem; color: var(--primary); margin-bottom: 1.5rem;"></i>
            <p style="font-size: 1.2rem; font-weight: 600;">${greeting}</p>
            <p style="margin-top: 0.5rem; opacity: 0.8;">One moment while we redirect you...</p>
        </div>
    `;
    setTimeout(() => {
        const params = new URLSearchParams({ payment: 'success', plan: planName });
        if (firstName) params.set('name', firstName);
        window.location.href = `/contact.html?${params.toString()}`;
    }, 2500);
}

function showPaypalMessage(message) {
    if (paypalContainer) {
        paypalContainer.innerHTML = `<p style="color: #b00020; text-align: center; padding: 1rem;">${message}</p>`;
    }
}

function renderPayPalButton(price, planName) {
    if (paypalContainer) paypalContainer.innerHTML = '';

    const isOneTime = ONE_TIME_PLANS.has(planName);

    // Recurring monthly plans use PayPal hosted Subscribe buttons
    // (the monthly price and billing cycle are set inside PayPal).
    if (!isOneTime) {
        renderSubscribeButton(planName);
        return;
    }

    // One-time payments use the PayPal JS SDK, loaded on the page
    // with data-namespace="paypalOrder" (intent=capture).
    const sdk = window.paypalOrder;
    if (!sdk) {
        console.error('PayPal SDK not loaded for one-time orders');
        showPaypalMessage('Payment is temporarily unavailable. Please refresh, or contact us and we\'ll get you set up.');
        return;
    }

    // One-time payment (e.g. First Time Cleanup)
    if (isOneTime) {
        sdk.Buttons({
            createOrder: function (data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        description: planName,
                        amount: { currency_code: "USD", value: String(price) }
                    }]
                });
            },
            onApprove: function (data, actions) {
                return actions.order.capture().then(function (details) {
                    const firstName = details && details.payer && details.payer.name
                        ? details.payer.name.given_name : '';
                    showPaymentSuccess(planName, firstName);
                });
            },
            onError: function (err) {
                console.error('PayPal Error:', err);
                alert('Something went wrong with the payment. Please try again.');
            }
        }).render('#paypal-button-container');
        return;
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
