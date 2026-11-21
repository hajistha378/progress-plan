/* ============================================================
   COCO LANE CAFE — Menu page
   Search, category filters, sorting and URL query support.
   ============================================================ */

(function () {
  'use strict';

  var lane = window.CocoLane;
  var state = {
    search: '',
    category: 'all',
    sort: 'featured'
  };

  var grid;
  var emptyState;
  var resultsText;
  var searchInput;
  var sortSelect;
  var filterRow;

  function readQuery() {
    var category = lane.queryParam('category');
    if (category) {
      var valid = lane.getCategories().some(function (item) {
        return item.id === category;
      });
      if (valid) state.category = category;
    }

    var search = lane.queryParam('q') || lane.queryParam('search');
    if (search) state.search = search;

    var sort = lane.queryParam('sort');
    if (sort) state.sort = sort;
  }

  function syncControls() {
    if (searchInput) searchInput.value = state.search;

    if (sortSelect) {
      var hasOption = Array.prototype.some.call(sortSelect.options, function (option) {
        return option.value === state.sort;
      });
      sortSelect.value = hasOption ? state.sort : 'featured';
    }

    if (filterRow) {
      filterRow.querySelectorAll('[data-category]').forEach(function (button) {
        var active = button.getAttribute('data-category') === state.category;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }
  }

  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    var params = new URLSearchParams();
    if (state.category !== 'all') params.set('category', state.category);
    if (state.search) params.set('q', state.search);
    if (state.sort !== 'featured') params.set('sort', state.sort);
    var query = params.toString();
    var url = window.location.pathname + (query ? '?' + query : '');
    window.history.replaceState({}, '', url);
  }

  function sortProducts(products) {
    var list = products.slice();

    switch (state.sort) {
      case 'price-asc':
        list.sort(function (a, b) {
          return Number(a.price) - Number(b.price);
        });
        break;
      case 'price-desc':
        list.sort(function (a, b) {
          return Number(b.price) - Number(a.price);
        });
        break;
      case 'name-asc':
        list.sort(function (a, b) {
          return String(a.name).localeCompare(String(b.name));
        });
        break;
      case 'rating':
        list.sort(function (a, b) {
          return Number(b.rating || 0) - Number(a.rating || 0);
        });
        break;
      default:
        list.sort(function (a, b) {
          var featuredDiff = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
          if (featuredDiff !== 0) return featuredDiff;
          return Number(b.rating || 0) - Number(a.rating || 0);
        });
    }

    return list;
  }

  function getFilteredProducts() {
    var products = lane.getProducts();
    var term = state.search.trim().toLowerCase();

    return products.filter(function (product) {
      if (state.category !== 'all' && product.category !== state.category) return false;
      if (!term) return true;

      var haystack = [
        product.name,
        product.short,
        product.description,
        product.ingredients,
        lane.categoryLabel(product.category)
      ]
        .join(' ')
        .toLowerCase();

      return haystack.indexOf(term) !== -1;
    });
  }

  function render() {
    var products = sortProducts(getFilteredProducts());
    var categoryName =
      state.category === 'all' ? 'all menu items' : lane.categoryLabel(state.category);

    if (products.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
    } else {
      if (emptyState) emptyState.hidden = true;
      lane.renderProductGrid(grid, products);
    }

    if (resultsText) {
      if (state.search.trim()) {
        resultsText.innerHTML =
          'Showing <strong>' +
          products.length +
          '</strong> result' +
          (products.length === 1 ? '' : 's') +
          ' for “<strong>' +
          lane.escapeHTML(state.search.trim()) +
          '</strong>”';
      } else {
        resultsText.innerHTML =
          'Showing <strong>' + products.length + '</strong> of ' + categoryName;
      }
    }
  }

  function resetAll() {
    state.search = '';
    state.category = 'all';
    state.sort = 'featured';
    syncControls();
    syncUrl();
    render();
  }

  function init() {
    grid = document.getElementById('menuGrid');
    if (!grid) return;

    emptyState = document.getElementById('menuEmpty');
    resultsText = document.getElementById('menuResults');
    searchInput = document.getElementById('menuSearch');
    sortSelect = document.getElementById('menuSort');
    filterRow = document.getElementById('menuFilters');

    readQuery();
    syncControls();

    if (searchInput) {
      searchInput.addEventListener(
        'input',
        lane.debounce(function () {
          state.search = searchInput.value;
          syncUrl();
          render();
        }, 180)
      );

      searchInput.addEventListener('search', function () {
        state.search = searchInput.value;
        syncUrl();
        render();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        state.sort = sortSelect.value;
        syncUrl();
        render();
      });
    }

    if (filterRow) {
      filterRow.addEventListener('click', function (event) {
        var button = event.target.closest('[data-category]');
        if (!button) return;
        state.category = button.getAttribute('data-category');
        syncControls();
        syncUrl();
        render();
      });
    }

    var clear = document.getElementById('menuClear');
    if (clear) clear.addEventListener('click', resetAll);

    var emptyReset = document.getElementById('menuEmptyReset');
    if (emptyReset) emptyReset.addEventListener('click', resetAll);

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
