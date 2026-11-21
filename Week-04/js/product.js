/* ============================================================
   COCO LANE CAFE — Product detail page
   ============================================================ */

(function () {
  'use strict';

  var lane = window.CocoLane;

  function renderNotFound() {
    var loading = document.getElementById('productLoading');
    var notFound = document.getElementById('productNotFound');
    var detail = document.getElementById('productDetail');
    var related = document.getElementById('relatedWrap');
    if (loading) loading.hidden = true;
    if (detail) detail.innerHTML = '';
    if (related) related.hidden = true;
    if (notFound) notFound.hidden = false;
  }

  function renderDetail(product) {
    var detail = document.getElementById('productDetail');
    var loading = document.getElementById('productLoading');
    if (!detail) return;
    if (loading) loading.hidden = true;

    document.title = product.name + ' — Coco Lane Cafe';
    var metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', product.short || '');

    var badge = product.badge
      ? '<span class="badge">' + lane.escapeHTML(product.badge) + '</span>'
      : '';

    detail.innerHTML =
      '<div class="product-detail">' +
      '<div class="product-gallery">' +
      '<div class="product-gallery__main">' +
      '<img src="' +
      lane.escapeHTML(product.image) +
      '" alt="' +
      lane.escapeHTML(product.name) +
      '" width="900" height="900" fetchpriority="high">' +
      '</div>' +
      '<p class="product-gallery__note">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg>' +
      'Photograph is representative. Actual presentation may vary slightly.' +
      '</p>' +
      '</div>' +

      '<div class="product-info">' +
      '<nav class="breadcrumb" aria-label="Breadcrumb">' +
      '<a href="index.html">Home</a>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>' +
      '<a href="menu.html">Menu</a>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>' +
      '<a href="menu.html?category=' +
      encodeURIComponent(product.category) +
      '">' +
      lane.escapeHTML(lane.categoryLabel(product.category)) +
      '</a>' +
      '</nav>' +

      '<span class="product-info__category">' +
      lane.escapeHTML(lane.categoryLabel(product.category)) +
      '</span>' +
      '<h1>' +
      lane.escapeHTML(product.name) +
      '</h1>' +

      '<div class="product-info__rating">' +
      lane.renderStars(product.rating, product.reviews) +
      '<span class="dot" aria-hidden="true"></span>' +
      '<span>' +
      (product.reviews || 0) +
      ' happy reviews</span>' +
      (badge ? '<span class="dot" aria-hidden="true"></span>' + badge : '') +
      '</div>' +

      '<div class="product-info__price">' +
      lane.formatLKR(product.price) +
      '<small>incl. taxes</small>' +
      '</div>' +

      '<p class="product-info__desc">' +
      lane.escapeHTML(product.description) +
      '</p>' +

      '<div class="product-meta-list">' +
      '<div><small>Ingredients</small><strong>' +
      lane.escapeHTML(product.ingredients || 'Ask the counter') +
      '</strong></div>' +
      '<div><small>Allergens</small><strong>' +
      lane.escapeHTML(product.allergens || 'Please ask our team') +
      '</strong></div>' +
      '<div><small>Approx. energy</small><strong>' +
      (product.calories ? lane.escapeHTML(product.calories) + ' kcal' : 'Ask the counter') +
      '</strong></div>' +
      '</div>' +

      '<div class="product-buy">' +
      '<div class="qty-stepper">' +
      '<button type="button" data-qty-step="-1" aria-label="Decrease quantity">' +
      lane.icon('minus') +
      '</button>' +
      '<label class="sr-only" for="productQty">Quantity</label>' +
      '<input type="number" id="productQty" value="1" min="1" max="20" inputmode="numeric">' +
      '<button type="button" data-qty-step="1" aria-label="Increase quantity">' +
      lane.icon('plus') +
      '</button>' +
      '</div>' +
      '<button class="btn btn--lg" type="button" data-add-to-cart="' +
      lane.escapeHTML(product.id) +
      '" data-qty-target="#productQty">' +
      lane.icon('cart') +
      'Add to cart · ' +
      lane.formatLKR(product.price) +
      '</button>' +
      '<a class="btn btn--outline btn--lg" href="cart.html">View cart</a>' +
      '</div>' +

      '<div class="product-accordion">' +
      '<details open>' +
      '<summary>Ingredients &amp; allergens</summary>' +
      '<p><strong>Ingredients:</strong> ' +
      lane.escapeHTML(product.ingredients || 'Please ask our team for the full ingredient list.') +
      '<br><strong>Allergens:</strong> ' +
      lane.escapeHTML(product.allergens || 'Please ask our team about allergens before ordering.') +
      '</p>' +
      '</details>' +
      '<details>' +
      '<summary>How it is made</summary>' +
      '<p>' +
      lane.escapeHTML(product.description) +
      ' Every order is prepared fresh at the counter. If you have an allergy, please tell us before ordering — we handle nuts, dairy, eggs and wheat in the same kitchen.</p>' +
      '</details>' +
      '<details>' +
      '<summary>Delivery &amp; pickup</summary>' +
      '<p>Pickup is usually ready in about 20 minutes. Local delivery is LKR 350 and free on orders over LKR 5,000. We will confirm the timing with you on WhatsApp after you place your order.</p>' +
      '</details>' +
      '</div>' +

      '</div>' +
      '</div>';

    lane.initReveals(detail);
    renderRelated(product);
  }

  function renderRelated(product) {
    var wrap = document.getElementById('relatedWrap');
    var grid = document.getElementById('relatedGrid');
    if (!wrap || !grid) return;

    var products = lane.getProducts();
    var sameCategory = products.filter(function (item) {
      return item.id !== product.id && item.category === product.category;
    });
    var others = products.filter(function (item) {
      return item.id !== product.id && item.category !== product.category;
    });

    var related = sameCategory.concat(others).slice(0, 3);
    if (related.length === 0) {
      wrap.hidden = true;
      return;
    }

    wrap.hidden = false;
    lane.renderProductGrid(grid, related);
  }

  function init() {
    var id = lane.queryParam('id');
    if (!id) {
      renderNotFound();
      return;
    }

    var product = lane.getProduct(id);
    if (!product) {
      renderNotFound();
      return;
    }

    renderDetail(product);

    /* Keep the cart quantity input in sync with stock limits */
    var qtyInput = document.getElementById('productQty');
    if (qtyInput) {
      qtyInput.addEventListener('change', function () {
        qtyInput.value = String(lane.sanitizeQty(qtyInput.value));
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
