/* ============================================================
   COCO LANE CAFE — Cart page
   ============================================================ */

(function () {
  'use strict';

  var lane = window.CocoLane;
  var root;
  var suggestionsWrap;
  var suggestionsGrid;

  function emptyCartHTML() {
    return (
      '<div class="empty-state">' +
      '<span class="empty-state__icon" aria-hidden="true">' +
      lane.icon('cart') +
      '</span>' +
      '<h2>Your cart is feeling a little light.</h2>' +
      '<p>No coffee, no cake, no problem. The counter is full of good things — go and pick something lovely.</p>' +
      '<a class="btn btn--lg" href="menu.html">Browse the menu</a>' +
      '</div>'
    );
  }

  function itemHTML(item) {
    return (
      '<article class="cart-item" data-cart-item="' +
      lane.escapeHTML(item.id) +
      '">' +
      '<a class="cart-item__img" href="product.html?id=' +
      encodeURIComponent(item.id) +
      '" aria-label="View ' +
      lane.escapeHTML(item.name) +
      '">' +
      '<img src="' +
      lane.escapeHTML(item.image) +
      '" alt="' +
      lane.escapeHTML(item.name) +
      '" loading="lazy">' +
      '</a>' +
      '<div class="cart-item__info">' +
      '<span class="cart-item__cat">' +
      lane.escapeHTML(item.categoryLabel) +
      '</span>' +
      '<a class="cart-item__name" href="product.html?id=' +
      encodeURIComponent(item.id) +
      '">' +
      lane.escapeHTML(item.name) +
      '</a>' +
      '<p class="cart-item__unit">' +
      lane.formatLKR(item.price) +
      ' each</p>' +
      '</div>' +
      '<div class="cart-item__controls">' +
      '<div class="qty-stepper qty-stepper--sm">' +
      '<button type="button" data-cart-step="-1" data-id="' +
      lane.escapeHTML(item.id) +
      '" aria-label="Decrease quantity of ' +
      lane.escapeHTML(item.name) +
      '">' +
      lane.icon('minus') +
      '</button>' +
      '<label class="sr-only" for="cartQty-' +
      lane.escapeHTML(item.id) +
      '">Quantity of ' +
      lane.escapeHTML(item.name) +
      '</label>' +
      '<input type="number" id="cartQty-' +
      lane.escapeHTML(item.id) +
      '" value="' +
      item.qty +
      '" min="1" max="99" inputmode="numeric" data-cart-qty="' +
      lane.escapeHTML(item.id) +
      '">' +
      '<button type="button" data-cart-step="1" data-id="' +
      lane.escapeHTML(item.id) +
      '" aria-label="Increase quantity of ' +
      lane.escapeHTML(item.name) +
      '">' +
      lane.icon('plus') +
      '</button>' +
      '</div>' +
      '<span class="cart-item__line">' +
      lane.formatLKR(item.lineTotal) +
      '</span>' +
      '<button class="cart-item__remove" type="button" data-cart-remove="' +
      lane.escapeHTML(item.id) +
      '" aria-label="Remove ' +
      lane.escapeHTML(item.name) +
      ' from cart" title="Remove item">' +
      lane.icon('trash') +
      '</button>' +
      '</div>' +
      '</article>'
    );
  }

  function renderSummary(details) {
    var freeRemaining = details.freeDeliveryRemaining;
    var progress =
      details.subtotal <= 0
        ? 0
        : Math.min(100, (details.subtotal / lane.CONFIG.freeDeliveryThreshold) * 100);

    var freeMessage = freeRemaining > 0
      ? 'Add <strong>' + lane.formatLKR(freeRemaining) + '</strong> more for free delivery.'
      : '<strong>Free delivery unlocked.</strong> Lovely.';

    return (
      '<div class="summary-card">' +
      '<h2>Order summary</h2>' +
      '<p class="summary-card__sub">' +
      details.count +
      ' item' +
      (details.count === 1 ? '' : 's') +
      ' in your cart</p>' +

      '<div class="summary-rows">' +
      '<div class="summary-row"><span>Subtotal</span><strong>' +
      lane.formatLKR(details.subtotal) +
      '</strong></div>' +
      '<div class="summary-row' +
      (details.delivery === 0 ? ' summary-row--free' : '') +
      '"><span>Delivery</span><strong>' +
      (details.delivery === 0 ? 'Free' : lane.formatLKR(details.delivery)) +
      '</strong></div>' +
      '</div>' +

      '<div class="summary-total"><span>Total</span><strong>' +
      lane.formatLKR(details.total) +
      '</strong></div>' +

      '<div class="free-shipping">' +
      '<p>' +
      freeMessage +
      '</p>' +
      '<div class="free-progress"><span style="width:' +
      progress.toFixed(1) +
      '%"></span></div>' +
      '</div>' +

      '<a class="btn btn--lg btn--block" href="checkout.html">' +
      'Proceed to checkout' +
      lane.icon('arrow') +
      '</a>' +
      '<a class="btn btn--ghost btn--block" href="menu.html">Continue shopping</a>' +

      '<p class="summary-note">' +
      lane.icon('info') +
      '<span>Free delivery on orders over ' +
      lane.formatLKR(lane.CONFIG.freeDeliveryThreshold) +
      '. Your cart is saved in this browser.</span>' +
      '</p>' +

      '<div class="payment-icons" aria-hidden="true">' +
      '<span>Cash</span><span>Pickup</span><span>WhatsApp</span>' +
      '</div>' +
      '</div>'
    );
  }

  function renderSuggestions() {
    if (!suggestionsWrap || !suggestionsGrid) return;

    var cartIds = lane.getCart().map(function (item) {
      return item.id;
    });
    var products = lane.getProducts().filter(function (product) {
      return cartIds.indexOf(product.id) === -1;
    });

    products.sort(function (a, b) {
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });

    var picks = products.slice(0, 4);
    if (picks.length === 0) {
      suggestionsWrap.hidden = true;
      return;
    }

    suggestionsWrap.hidden = false;
    lane.renderProductGrid(suggestionsGrid, picks);
  }

  function render() {
    if (!root) return;

    var details = lane.getCartDetails();

    if (!details.items.length) {
      root.innerHTML = emptyCartHTML();
      if (suggestionsWrap) suggestionsWrap.hidden = true;
      lane.updateCartBadges();
      return;
    }

    root.innerHTML =
      '<div class="cart-layout">' +
      '<section class="cart-panel" aria-labelledby="cartHeading">' +
      '<div class="cart-panel__head">' +
      '<div>' +
      '<h2 id="cartHeading">In your basket</h2>' +
      '<span data-cart-label>' +
      details.count +
      ' item' +
      (details.count === 1 ? '' : 's') +
      '</span>' +
      '</div>' +
      '<button class="clear-cart" type="button" id="clearCartBtn">Clear cart</button>' +
      '</div>' +
      '<div class="cart-items">' +
      details.items.map(itemHTML).join('') +
      '</div>' +
      '<div class="cart-panel__foot">' +
      '<a href="menu.html">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>' +
      'Keep browsing' +
      '</a>' +
      '<span class="text-muted" style="font-size:.72rem">Saved automatically</span>' +
      '</div>' +
      '</section>' +
      '<aside>' +
      renderSummary(details) +
      '</aside>' +
      '</div>';

    lane.updateCartBadges();
    renderSuggestions();
    lane.initReveals(root);
  }

  function onRootClick(event) {
    var remove = event.target.closest('[data-cart-remove]');
    if (remove) {
      event.preventDefault();
      var removeId = remove.getAttribute('data-cart-remove');
      var product = lane.getProduct(removeId);
      lane.removeFromCart(removeId);
      lane.toast(
        (product ? product.name : 'Item') + ' removed from your cart.',
        'info',
        'Removed'
      );
      return;
    }

    var step = event.target.closest('[data-cart-step]');
    if (step) {
      event.preventDefault();
      var id = step.getAttribute('data-id');
      var input = root.querySelector('[data-cart-qty="' + id + '"]');
      if (!input) return;
      var delta = parseInt(step.getAttribute('data-cart-step'), 10) || 1;
      var next = lane.sanitizeQty((parseInt(input.value, 10) || 1) + delta);
      lane.updateCartQty(id, next);
      return;
    }

    if (event.target.closest('#clearCartBtn')) {
      event.preventDefault();
      if (window.confirm('Remove everything from your cart?')) {
        lane.clearCart();
        lane.toast('Your cart is empty again.', 'info', 'Cart cleared');
      }
    }
  }

  function onRootChange(event) {
    var input = event.target.closest('[data-cart-qty]');
    if (!input) return;
    var id = input.getAttribute('data-cart-qty');
    lane.updateCartQty(id, lane.sanitizeQty(input.value));
    render();
  }

  function init() {
    root = document.getElementById('cartRoot');
    suggestionsWrap = document.getElementById('cartSuggestionsWrap');
    suggestionsGrid = document.getElementById('cartSuggestions');
    if (!root) return;

    render();
    root.addEventListener('click', onRootClick);
    root.addEventListener('change', onRootChange);
    document.addEventListener('coco:cart-updated', render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
