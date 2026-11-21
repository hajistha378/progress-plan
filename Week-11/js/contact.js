/* ============================================================
   COCO LANE CAFE — Visit & Contact page
   Marks today in the opening-hours list and validates the
   contact form, saving messages to LocalStorage for the
   admin dashboard.
   ============================================================ */

(function () {
  'use strict';

  var lane = window.CocoLane;

  /* ---------------- Opening hours ---------------- */
  function markToday() {
    var rows = document.querySelectorAll('.hours-list li[data-day]');
    if (!rows.length) return;

    var today = new Date().getDay();
    rows.forEach(function (row) {
      var isToday = Number(row.getAttribute('data-day')) === today;
      row.classList.toggle('is-today', isToday);
      if (!isToday) {
        row.removeAttribute('aria-current');
        return;
      }

      row.setAttribute('aria-current', 'date');
      var label = row.querySelector('span');
      if (label && label.textContent.indexOf('today') === -1) {
        label.textContent = label.textContent.replace(/\s*$/, '') + ' · today';
      }
    });
  }

  /* ---------------- Contact form ---------------- */
  function createMessageId() {
    return 'MSG-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
  }

  function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    var alertBox = document.getElementById('contactAlert');
    var nameInput = document.getElementById('contactName');
    var emailInput = document.getElementById('contactEmail');
    var phoneInput = document.getElementById('contactPhone');
    var subjectInput = document.getElementById('contactSubject');
    var messageInput = document.getElementById('contactMessage');
    var consentInput = document.getElementById('contactConsent');
    var consentError = document.getElementById('contactConsentError');
    var submitButton = document.getElementById('contactSubmit');

    /* Prefill for signed-in customers. */
    var user = lane.getCurrentUser();
    if (user) {
      if (nameInput && !nameInput.value) nameInput.value = user.name || '';
      if (emailInput && !emailInput.value) emailInput.value = user.email || '';
      if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      lane.clearFieldErrors(form);
      if (alertBox) alertBox.innerHTML = '';
      if (consentError) consentError.textContent = '';

      var valid = true;
      var nameValue = nameInput.value.trim();
      var emailValue = emailInput.value.trim();
      var phoneValue = phoneInput.value.trim();
      var messageValue = messageInput.value.trim();

      if (nameValue.length < 2) {
        lane.fieldError(nameInput, 'Please tell us your name.');
        valid = false;
      }

      if (!emailValue) {
        lane.fieldError(emailInput, 'Please enter your email address.');
        valid = false;
      } else if (!lane.isEmail(emailValue)) {
        lane.fieldError(emailInput, 'That does not look like a valid email address.');
        valid = false;
      }

      if (phoneValue && !lane.isPhone(phoneValue)) {
        lane.fieldError(phoneInput, 'Enter a Sri Lankan mobile number, e.g. 077 123 4567.');
        valid = false;
      }

      if (messageValue.length < 10) {
        lane.fieldError(messageInput, 'Please add a little more detail (at least 10 characters).');
        valid = false;
      }

      if (!consentInput.checked) {
        if (consentError) {
          consentError.textContent = 'Please tick the box so we know you are happy for your message to be saved.';
          consentError.style.display = 'block';
        }
        valid = false;
      } else if (consentError) {
        consentError.style.display = 'none';
      }

      if (!valid) {
        lane.showFormAlert(alertBox, 'Please check the highlighted fields and try again.', 'error');
        var firstError = form.querySelector('.field.has-error input, .field.has-error textarea');
        if (firstError) firstError.focus();
        return;
      }

      lane.setLoading(submitButton, true, 'Sending…');

      var messages = lane.getMessages();
      messages.push({
        id: createMessageId(),
        createdAt: new Date().toISOString(),
        name: nameValue,
        email: emailValue,
        phone: lane.normalizePhone(phoneValue),
        subject: subjectInput.value || 'General question',
        message: messageValue,
        read: false
      });

      var saved = lane.saveMessages(messages);
      lane.setLoading(submitButton, false);

      if (!saved) {
        lane.showFormAlert(
          alertBox,
          'Your browser could not save the message. Storage may be blocked or full.',
          'error'
        );
        return;
      }

      lane.showFormAlert(
        alertBox,
        'Thanks, ' + nameValue.split(/\s+/)[0] + '. Your message has been saved and will appear on the cafe’s admin dashboard on this device. For a reply today, please message us on WhatsApp.',
        'success'
      );
      lane.toast('Your message has been saved.', 'success', 'Message saved');

      form.reset();
      if (consentError) consentError.style.display = 'none';

      /* Re-prefill after reset so the form is convenient for a repeat message. */
      if (user) {
        if (nameInput) nameInput.value = user.name || '';
        if (emailInput) emailInput.value = user.email || '';
        if (phoneInput) phoneInput.value = user.phone || '';
      }

      if (alertBox) {
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    /* Clear inline errors while typing. */
    form.addEventListener('input', function (event) {
      var field = event.target.closest('.field');
      if (field && field.classList.contains('has-error')) lane.fieldError(event.target, '');
      if (event.target === consentInput && consentError) consentError.textContent = '';
    });
  }

  function init() {
    markToday();
    initContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
