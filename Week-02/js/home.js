/* ============================================================
   COCO LANE CAFE — Home page
   Renders featured products and testimonials from local data.
   ============================================================ */

(function () {
  'use strict';

  function renderFeatured() {
    var grid = document.querySelector('[data-featured-grid]');
    if (!grid) return;

    var products = window.CocoLane.getProducts();
    var featured = products.filter(function (product) {
      return product.featured;
    });

    if (featured.length < 3) {
      featured = products.slice(0, 6);
    } else if (featured.length > 6) {
      featured = featured.slice(0, 6);
    }

    window.CocoLane.renderProductGrid(grid, featured);
  }

  function renderTestimonials() {
    var container = document.querySelector('[data-testimonials]');
    if (!container) return;

    var testimonials = window.COCO_TESTIMONIALS || [];
    if (!testimonials.length) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = testimonials
      .map(function (item, index) {
        var stars = '';
        for (var i = 0; i < 5; i += 1) {
          stars += window.CocoLane.icon('star');
        }

        return (
          '<article class="testimonial-card reveal" style="--delay:' +
          index * 80 +
          'ms">' +
          '<span class="testimonial-card__quote" aria-hidden="true">&ldquo;</span>' +
          '<span class="rating" aria-label="Rated ' +
          Number(item.rating || 5) +
          ' out of 5">' +
          stars +
          '</span>' +
          '<p class="testimonial-text">' +
          window.CocoLane.escapeHTML(item.quote) +
          '</p>' +
          '<div class="testimonial-author">' +
          '<span class="avatar avatar--sm" aria-hidden="true">' +
          window.CocoLane.escapeHTML(item.initials) +
          '</span>' +
          '<div>' +
          '<strong>' +
          window.CocoLane.escapeHTML(item.name) +
          '</strong>' +
          '<span>' +
          window.CocoLane.escapeHTML(item.role) +
          '</span>' +
          '</div>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');

    window.CocoLane.initReveals(container);
  }

  function init() {
    renderFeatured();
    renderTestimonials();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
