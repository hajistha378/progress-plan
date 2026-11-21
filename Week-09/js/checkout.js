/* ============================================================
   COCO LANE CAFE — Checkout
   Validates the form, saves a local order copy and opens a
   pre-filled WhatsApp message. No payment is processed.
   ============================================================ */

(function () {
  'use strict';

  var lane = window.CocoLane;
  var form;
  var content;
  var emptyState;
  var alertBox;
  var submitButton;
  var addressFields;
  var summary = {
    items: null,
    subtotal: null,
    delivery: null,
    total: null
  };

  function currentFulfilment() {
    var checked = form.querySelector('input[name="fulfilment"]:checked');
    return checked ? checked.value : 'delivery';
  }

  function totals() {
    var details = lane.getCartDetails();
    var fulfilment = currentFulfilment();
    var delivery = fulfilment === 'pickup' ? 0 : details.delivery;
    return {
      details: details,
      delivery: delivery,
      total: details.subtotal + delivery,
      fulfilment: fulfilment
    };
  }

  function renderItems() {
    if (!summary.items) return;
    var details = lane.getCartDetails();
    var items = details.items;

    summary.items.innerHTML = items
      .map(function (item) {
        return (
          '<div class="checkout-item">' +
          '<div class="checkout-item__img">' +
          '<img src="' + lane.escapeHTML(item.image) + '" alt="' + lane.escapeHTML(item.name) + '" loading="lazy">' +
          '<span class="checkout-item__qty">' + item.qty + '</span>' +
          '</div>' +
          '<div class="checkout-item__info">' +
          '<strong>' + lane.escapeHTML(item.name) + '</strong>' +
          '<span>' + lane.formatLKR(item.price) + ' each</span>' +
          '</div>' +
          '<span class="checkout-item__price">' + lane.formatLKR(item.lineTotal) + '</span>' +
          '</div>'
        );
      })
      .join('');
  }

  function updateTotals() {
    var state = totals();
    if (summary.subtotal) summary.subtotal.textContent = lane.formatLKR(state.details.subtotal);
    if (summary.total) summary.total.textContent = lane.formatLKR(state.total);

    var deliveryRow = document.getElementById('checkoutDeliveryRow');
    var freeRow = document.getElementById('checkoutFreeRow');
    var deliveryValue = summary.delivery;

    if (deliveryValue) {
      deliveryValue.textContent = lane.formatLKR(state.delivery);
    }

    if (deliveryRow) deliveryRow.hidden = state.delivery === 0;
    if (freeRow) freeRow.hidden = state.delivery !== 0;
  }

  function setFulfilmentUI() {
    var isPickup = currentFulfilment() === 'pickup';
    if (addressFields) addressFields.hidden = isPickup;

    var address = document.getElementById('checkoutAddress');
    var city = document.getElementById('checkoutCity');
    if (address) address.required = !isPickup;
    if (city) city.required = !isPickup;

    updateTotals();
  }

  function fillAccountDetails() {
    var user = lane.getCurrentUser();
    var note = document.getElementById('checkoutAccountNote');
    var emailInput = document.getElementById('checkoutEmail');
    var nameInput = document.getElementById('checkoutName');
    var phoneInput = document.getElementById('checkoutPhone');

    if (!user) {
      if (note) {
        note.innerHTML =
          'You are checking out as a guest. <a class="link-inline" href="login.html?next=checkout.html">Sign in</a> to keep this order in your history.';
      }
      return;
    }

    if (nameInput && !nameInput.value) nameInput.value = user.name || '';
    if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
    if (emailInput && !emailInput.value) emailInput.value = user.email || '';

    if (note) {
      note.innerHTML =
        'Signed in as <strong>' +
        lane.escapeHTML(user.email) +
        '</strong>. This order will appear in your history.';
    }
  }

  function validate() {
    lane.clearFieldErrors(form);

    var nameInput = document.getElementById('checkoutName');
    var phoneInput = document.getElementById('checkoutPhone');
    var emailInput = document.getElementById('checkoutEmail');
    var addressInput = document.getElementById('checkoutAddress');
    var cityInput = document.getElementById('checkoutCity');
    var valid = true;
    var isPickup = currentFulfilment() === 'pickup';

    if (nameInput.value.trim().length < 2) {
      lane.fieldError(nameInput, 'Please enter the name for this order.');
      valid = false;
    }

    if (!phoneInput.value.trim()) {
      lane.fieldError(phoneInput, 'We need a mobile number to confirm your order.');
      valid = false;
    } else if (!lane.isPhone(phoneInput.value)) {
      lane.fieldError(phoneInput, 'Enter a Sri Lankan mobile number, e.g. 077 123 4567.');
      valid = false;
    }

    if (emailInput.value.trim() && !lane.isEmail(emailInput.value)) {
      lane.fieldError(emailInput, 'That email address does not look right.');
      valid = false;
    }

    if (!isPickup) {
      if (addressInput.value.trim().length < 5) {
        lane.fieldError(addressInput, 'Please enter your delivery address.');
        valid = false;
      }
      if (cityInput.value.trim().length < 2) {
        lane.fieldError(cityInput, 'Please enter your city or town.');
        valid = false;
      }
    }

    if (!valid) {
      lane.showFormAlert(alertBox, 'Please check the highlighted fields before placing your order.', 'error');
      var firstError = form.querySelector('.field.has-error input, .field.has-error select, .field.has-error textarea');
      if (firstError) firstError.focus();
      return null;
    }

    return {
      name: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim(),
      fulfilment: currentFulfilment(),
      address: isPickup ? '' : addressInput.value.trim(),
      city: isPickup ? '' : cityInput.value.trim(),
      landmark: isPickup ? '' : (document.getElementById('checkoutLandmark').value.trim() || ''),
      notes: document.getElementById('checkoutNotes').value.trim(),
      payment: (form.querySelector('input[name="payment"]:checked') || {}).value || 'Cash on delivery / pickup'
    };
  }

  function buildMessage(order) {
    var lines = [];
    lines.push('*NEW ORDER — Coco Lane Cafe*');
    lines.push('Order: ' + order.id);
    lines.push('');
    lines.push('*Customer*');
    lines.push('Name: ' + order.name);
    lines.push('Phone: ' + order.phone);
    if (order.email) lines.push('Email: ' + order.email);
    lines.push('');
    lines.push('*Items*');

    order.items.forEach(function (item) {
      lines.push('• ' + item.name + ' × ' + item.qty + ' — ' + lane.formatLKR(item.price * item.qty));
    });

    lines.push('');
    lines.push('Subtotal: ' + lane.formatLKR(order.subtotal));
    lines.push('Delivery: ' + (order.delivery === 0 ? 'Free' : lane.formatLKR(order.delivery)));
    lines.push('*Total: ' + lane.formatLKR(order.total) + '*');
    lines.push('');
    lines.push('*Fulfilment*');
    if (order.fulfilment === 'pickup') {
      lines.push('Pickup from the cafe');
    } else {
      lines.push('Delivery to:');
      lines.push(order.address + (order.city ? ', ' + order.city : ''));
      if (order.landmark) lines.push('Landmark: ' + order.landmark);
    }
    lines.push('Payment: ' + order.payment);
    if (order.notes) {
      lines.push('');
      lines.push('*Notes*');
      lines.push(order.notes);
    }
    lines.push('');
    lines.push('Please confirm availability and timing. Thank you!');

    return lines.join('\n');
  }

  function successHTML(order) {
    return (
      '<div class="order-success">' +
      '<span class="success-check" aria-hidden="true">' +
      lane.icon('check') +
      '</span>' +
      '<h1>Your order is ready to send.</h1>' +
      '<p>We have saved a copy of your order in this browser and opened a pre-filled WhatsApp message. <strong>Your order only reaches the cafe once you press send in WhatsApp.</strong></p>' +
      '<div class="order-number"><span>Order</span>' + lane.escapeHTML(order.id) + '</div>' +
      '<div class="summary-rows" style="max-width:420px;margin:24px auto 0;text-align:left">' +
      '<div class="summary-row"><span>Items</span><strong>' + order.items.reduce(function (sum, item) { return sum + item.qty; }, 0) + '</strong></div>' +
      '<div class="summary-row"><span>Subtotal</span><strong>' + lane.formatLKR(order.subtotal) + '</strong></div>' +
      '<div class="summary-row' + (Number(order.delivery) === 0 ? ' summary-row--free' : '') + '"><span>Delivery</span><strong>' + (Number(order.delivery) === 0 ? 'Free' : lane.formatLKR(order.delivery)) + '</strong></div>' +
      '<div class="summary-row"><span>Total</span><strong>' + lane.formatLKR(order.total) + '</strong></div>' +
      '</div>' +
      '<div class="order-success__actions">' +
      '<a class="btn btn--lg" href="' + lane.escapeHTML(order.whatsappLink) + '" target="_blank" rel="noopener noreferrer">Open WhatsApp again</a>' +
      '<a class="btn btn--outline btn--lg" href="orders.html">View my orders</a>' +
      '<a class="btn btn--ghost btn--lg" href="menu.html">Back to menu</a>' +
      '</div>' +
      '<p class="order-success__note">' +
      'No payment has been taken. If you were signed in when ordering, this order now appears in your order history in this browser.' +
      '</p>' +
      '</div>'
    );
  }

  function placeOrder() {
    var data = validate();
    if (!data) return null;

    if (!lane.getCartDetails().items.length) {
      lane.toast('Your cart is empty.', 'error');
      showEmpty();
      return null;
    }

    var state = totals();
    var details = state.details;
    var user = lane.getCurrentUser();
    var email = data.email || (user ? user.email : '');

    var order = {
      id: lane.createOrderId(),
      createdAt: new Date().toISOString(),
      status: 'Pending',
      name: data.name,
      phone: lane.normalizePhone(data.phone),
      email: email,
      userEmail: user ? user.email : '',
      fulfilment: data.fulfilment,
      address: data.address,
      city: data.city,
      landmark: data.landmark,
      notes: data.notes,
      payment: data.payment,
      items: details.items.map(function (item) {
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          image: item.image
        };
      }),
      subtotal: details.subtotal,
      delivery: state.delivery,
      total: state.total,
      source: 'website'
    };

    var message = buildMessage(order);
    order.whatsappMessage = message;
    order.whatsappLink = lane.buildWhatsAppLink(message);

    if (!lane.addOrder(order)) {
      lane.showFormAlert(alertBox, 'We could not save this order in your browser. Storage may be blocked or full.', 'error');
      return null;
    }

    /* Open WhatsApp inside the user gesture so it is not blocked. */
    var popup = window.open(order.whatsappLink, '_blank', 'noopener');
    if (!popup) {
      lane.toast('Your browser blocked the WhatsApp window. Use the button on the next screen.', 'info', 'One more tap');
    }

    lane.clearCart();
    showSuccess(order);
    return order;
  }

  function showSuccess(order) {
    if (content) content.hidden = true;
    if (emptyState) emptyState.hidden = true;
    var success = document.getElementById('orderSuccess');
    if (!success) return;
    success.hidden = false;
    success.innerHTML = successHTML(order);
    success.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.title = 'Order ' + order.id + ' — Coco Lane Cafe';
  }

  function showEmpty() {
    if (content) content.hidden = true;
    if (emptyState) emptyState.hidden = false;
  }

  function init() {
    form = document.getElementById('checkoutForm');
    content = document.getElementById('checkoutContent');
    emptyState = document.getElementById('checkoutEmpty');
    alertBox = document.getElementById('checkoutAlert');
    submitButton = document.getElementById('placeOrderBtn');
    addressFields = document.getElementById('addressFields');

    if (!form) return;

    summary.items = document.getElementById('checkoutItems');
    summary.subtotal = document.getElementById('checkoutSubtotal');
    summary.delivery = document.getElementById('checkoutDelivery');
    summary.total = document.getElementById('checkoutTotal');

    var details = lane.getCartDetails();
    if (!details.items.length) {
      showEmpty();
      return;
    }

    if (content) content.hidden = false;

    renderItems();
    fillAccountDetails();
    setFulfilmentUI();

    form.querySelectorAll('input[name="fulfilment"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        setFulfilmentUI();
        lane.clearFieldErrors(form);
        if (alertBox) alertBox.innerHTML = '';
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (alertBox) alertBox.innerHTML = '';
      lane.setLoading(submitButton, true, 'Preparing order…');
      try {
        placeOrder();
      } finally {
        lane.setLoading(submitButton, false);
      }
    });

    /* Clear stale inline errors as the customer types */
    form.addEventListener('input', function (event) {
      var field = event.target.closest('.field');
      if (field && field.classList.contains('has-error')) lane.fieldError(event.target, '');
    });

    document.addEventListener('coco:cart-updated', function () {
      var latest = lane.getCartDetails();
      if (!latest.items.length) {
        showEmpty();
        return;
      }
      renderItems();
      updateTotals();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
