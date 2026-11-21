/* ============================================================
   COCO LANE CAFE — Demo admin dashboard
   Frontend only. Everything is stored in LocalStorage — the
   "login" is a demo gate, not real authentication.
   ============================================================ */

(function () {
  'use strict';

  var lane = window.CocoLane;

  /* Clearly marked demo credentials. This is NOT security. */
  var ADMIN = {
    email: 'admin@cocolanecafe.example',
    password: 'coco1234',
    name: 'Coco Lane Admin'
  };

  var STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Completed', 'Cancelled'];
  var OPEN_STATUSES = ['Pending', 'Confirmed', 'Preparing'];
  var VIEWS = ['dashboard', 'products', 'orders', 'messages', 'settings'];

  var state = {
    view: 'dashboard',
    productSearch: '',
    productCategory: 'all',
    orderSearch: '',
    orderStatus: 'all',
    messageFilter: 'all'
  };

  var els = {};
  var modalEl = null;

  /* ---------------- Small helpers ---------------- */
  function isSignedIn() {
    var session = lane.storage.readSession(lane.KEYS.adminSession, null);
    return Boolean(session && String(session.email).toLowerCase() === ADMIN.email);
  }

  function statusChip(status) {
    var value = String(status || 'Pending');
    var key = value.toLowerCase().replace(/\s+/g, '-');
    return (
      '<span class="status-chip status-chip--' +
      lane.escapeHTML(key) +
      '">' +
      lane.escapeHTML(value) +
      '</span>'
    );
  }

  function waNumber(phone) {
    var digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.indexOf('0') === 0) return '94' + digits.slice(1);
    if (digits.indexOf('94') === 0) return digits;
    return digits;
  }

  function itemsCount(order) {
    return (order.items || []).reduce(function (sum, item) {
      return sum + Number(item.qty || 1);
    }, 0);
  }

  function orderItemsLabel(order) {
    var count = itemsCount(order);
    return (
      count +
      ' item' +
      (count === 1 ? '' : 's') +
      ' · ' +
      (order.fulfilment === 'pickup' ? 'Pickup' : 'Delivery')
    );
  }

  function isOpenOrder(order) {
    return OPEN_STATUSES.indexOf(String(order.status || 'Pending')) !== -1;
  }

  function totalRevenue(orders) {
    return orders.reduce(function (sum, order) {
      if (String(order.status) === 'Cancelled') return sum;
      return sum + Number(order.total || 0);
    }, 0);
  }

  function uniqueProductId(base, products) {
    var id = base || 'product';
    var suffix = 2;
    while (
      products.some(function (product) {
        return product.id === id;
      })
    ) {
      id = base + '-' + suffix;
      suffix += 1;
    }
    return id;
  }

  function downloadJSON(filename, data) {
    try {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1200);
      return true;
    } catch (error) {
      lane.toast('Your browser could not prepare the download.', 'error');
      return false;
    }
  }

  function fileStamp() {
    var date = new Date();
    return (
      date.getFullYear() +
      '-' +
      String(date.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getDate()).padStart(2, '0')
    );
  }

  /* ---------------- Modal ---------------- */
  function closeModal() {
    if (!modalEl) return;
    if (modalEl.parentNode) modalEl.parentNode.removeChild(modalEl);
    modalEl = null;
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onModalKeydown);
  }

  function onModalKeydown(event) {
    if (event.key === 'Escape') closeModal();
  }

  function openModal(options) {
    closeModal();

    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'presentation');
    modal.innerHTML =
      '<div class="modal-card' +
      (options.wide ? ' modal-card--wide' : '') +
      '" role="dialog" aria-modal="true" aria-labelledby="adminModalTitle">' +
      '<div class="modal-card__head">' +
      '<div><h2 id="adminModalTitle">' +
      lane.escapeHTML(options.title) +
      '</h2>' +
      (options.subtitle ? '<p>' + lane.escapeHTML(options.subtitle) + '</p>' : '') +
      '</div>' +
      '<button class="modal-card__close" type="button" data-modal-close aria-label="Close dialog">' +
      lane.icon('close') +
      '</button>' +
      '</div>' +
      '<div class="modal-card__body">' +
      options.body +
      '</div>' +
      (options.footer ? '<div class="modal-card__foot">' + options.footer + '</div>' : '') +
      '</div>';

    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    modalEl = modal;

    modal.addEventListener('click', function (event) {
      if (event.target === modal || event.target.closest('[data-modal-close]')) closeModal();
    });
    document.addEventListener('keydown', onModalKeydown);

    var focusTarget = modal.querySelector('input, select, textarea, button');
    if (focusTarget) {
      setTimeout(function () {
        focusTarget.focus();
      }, 60);
    }

    return modal;
  }

  /* ---------------- Admin login ---------------- */
  function initLogin() {
    var form = document.getElementById('adminLoginForm');
    if (!form) return;

    var alertBox = document.getElementById('adminLoginAlert');
    var emailInput = document.getElementById('adminEmail');
    var passwordInput = document.getElementById('adminPassword');
    var submit = document.getElementById('adminLoginSubmit');
    var fillDemo = document.getElementById('fillDemoBtn');

    if (fillDemo) {
      fillDemo.addEventListener('click', function () {
        emailInput.value = ADMIN.email;
        passwordInput.value = ADMIN.password;
        if (alertBox) alertBox.innerHTML = '';
        lane.clearFieldErrors(form);
        passwordInput.focus();
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      lane.clearFieldErrors(form);
      if (alertBox) alertBox.innerHTML = '';

      var valid = true;
      var emailValue = emailInput.value.trim().toLowerCase();

      if (!emailValue) {
        lane.fieldError(emailInput, 'Please enter the admin email.');
        valid = false;
      } else if (!lane.isEmail(emailValue)) {
        lane.fieldError(emailInput, 'That does not look like a valid email address.');
        valid = false;
      }

      if (!passwordInput.value) {
        lane.fieldError(passwordInput, 'Please enter the demo admin password.');
        valid = false;
      }

      if (!valid) {
        lane.showFormAlert(alertBox, 'Please check the highlighted fields.', 'error');
        return;
      }

      if (emailValue !== ADMIN.email || passwordInput.value !== ADMIN.password) {
        lane.showFormAlert(
          alertBox,
          'Those credentials do not match the demo admin account. Use the details shown below, or press “Fill demo credentials”.',
          'error'
        );
        return;
      }

      lane.setLoading(submit, true, 'Signing in…');
      lane.storage.writeSession(lane.KEYS.adminSession, {
        email: ADMIN.email,
        name: ADMIN.name,
        loginAt: new Date().toISOString()
      });
      lane.setLoading(submit, false);
      lane.toast('Welcome to the demo admin dashboard.', 'success', 'Signed in');
      showApp();
    });
  }

  function showLogin() {
    if (els.login) els.login.hidden = false;
    if (els.app) els.app.hidden = true;
    if (els.logout) els.logout.hidden = true;
    var emailInput = document.getElementById('adminEmail');
    if (emailInput) emailInput.focus();
  }

  function showApp() {
    if (!isSignedIn()) {
      showLogin();
      return;
    }

    if (els.login) els.login.hidden = true;
    if (els.app) els.app.hidden = false;
    if (els.logout) els.logout.hidden = false;

    renderHeaderDate();
    renderAll();
    setView(currentHash(), false);
  }

  function currentHash() {
    var hash = String(window.location.hash || '').replace('#', '');
    return VIEWS.indexOf(hash) !== -1 ? hash : 'dashboard';
  }

  function renderHeaderDate() {
    var now = new Date();
    var hour = now.getHours();
    var greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    if (els.greeting) els.greeting.textContent = greeting;
    if (els.date) {
      els.date.textContent = new Intl.DateTimeFormat('en-LK', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(now);
    }
  }

  /* ---------------- Routing ---------------- */
  function setView(view, updateHash) {
    var next = VIEWS.indexOf(view) !== -1 ? view : 'dashboard';
    state.view = next;

    document.querySelectorAll('[data-admin-panel]').forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-admin-panel') !== next;
    });

    document.querySelectorAll('.dash-nav [data-admin-view]').forEach(function (button) {
      var active = button.getAttribute('data-admin-view') === next;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });

    if (updateHash !== false) {
      try {
        window.history.replaceState(null, '', '#' + next);
      } catch (error) {
        /* Ignore history restrictions on file:// previews. */
      }
    }

    renderView(next);
  }

  function renderView(view) {
    if (view === 'dashboard') renderDashboard();
    else if (view === 'products') renderProducts();
    else if (view === 'orders') renderOrders();
    else if (view === 'messages') renderMessages();
    else if (view === 'settings') renderSettings();
  }

  function renderAll() {
    renderDashboard();
    renderProducts();
    renderOrders();
    renderMessages();
    renderSettings();
    updateCounts();
  }

  /* ---------------- Sidebar counts ---------------- */
  function updateCounts() {
    var orders = lane.getOrders();
    var messages = lane.getMessages();
    var open = orders.filter(isOpenOrder).length;
    var unread = messages.filter(function (message) {
      return !message.read;
    }).length;

    if (els.orderCount) {
      els.orderCount.textContent = String(open);
      els.orderCount.hidden = open === 0;
    }
    if (els.messageCount) {
      els.messageCount.textContent = String(unread);
      els.messageCount.hidden = unread === 0;
    }
  }

  /* ---------------- Dashboard ---------------- */
  function renderDashboard() {
    var orders = lane.getOrders();
    var messages = lane.getMessages();
    var openOrders = orders.filter(isOpenOrder);
    var completed = orders.filter(function (order) {
      return String(order.status) === 'Completed';
    }).length;
    var revenue = totalRevenue(orders);
    var average = orders.length ? Math.round(revenue / orders.length) : 0;
    var unread = messages.filter(function (message) {
      return !message.read;
    }).length;

    var weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    var thisWeek = orders.filter(function (order) {
      return new Date(order.createdAt) >= weekAgo;
    }).length;

    if (els.statOrders) els.statOrders.textContent = String(orders.length);
    if (els.statOrdersMeta) {
      els.statOrdersMeta.textContent =
        thisWeek + ' in the last 7 days · ' + lane.getUsers().length + ' local accounts';
    }
    if (els.statRevenue) els.statRevenue.textContent = lane.formatLKR(revenue);
    if (els.statRevenueMeta) {
      els.statRevenueMeta.textContent = orders.length
        ? 'Average ' + lane.formatLKR(average) + ' per order'
        : 'No orders yet';
    }
    if (els.statPending) els.statPending.textContent = String(openOrders.length);
    if (els.statPendingMeta) {
      els.statPendingMeta.textContent = completed + ' completed · ' + (orders.length - openOrders.length) + ' closed';
    }
    if (els.statMessages) els.statMessages.textContent = String(unread);
    if (els.statMessagesMeta) {
      els.statMessagesMeta.textContent =
        messages.length + ' message' + (messages.length === 1 ? '' : 's') + ' in this browser';
    }

    renderSalesChart(orders);
    renderPopular(orders);
    renderRecentOrders(orders);
    updateCounts();
  }

  function renderSalesChart(orders) {
    if (!els.salesChart) return;

    var days = [];
    for (var i = 6; i >= 0; i -= 1) {
      var date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      days.push({ date: date, total: 0 });
    }

    orders.forEach(function (order) {
      if (String(order.status) === 'Cancelled') return;
      var created = new Date(order.createdAt);
      if (isNaN(created.getTime())) return;
      created.setHours(0, 0, 0, 0);
      for (var index = 0; index < days.length; index += 1) {
        if (days[index].date.getTime() === created.getTime()) {
          days[index].total += Number(order.total || 0);
          break;
        }
      }
    });

    var max = Math.max.apply(
      null,
      days.map(function (day) {
        return day.total;
      })
    );
    if (max <= 0) max = 1;

    els.salesChart.innerHTML = days
      .map(function (day) {
        var height = Math.max(4, Math.round((day.total / max) * 100));
        var label = new Intl.DateTimeFormat('en-LK', { weekday: 'short' }).format(day.date);
        return (
          '<div class="chart-bar">' +
          '<div class="chart-bar__fill" style="height:' +
          height +
          '%" title="' +
          lane.escapeHTML(label + ' · ' + lane.formatLKR(day.total)) +
          '"></div>' +
          '<span>' +
          lane.escapeHTML(label) +
          '</span>' +
          '</div>'
        );
      })
      .join('');
  }

  function renderPopular(orders) {
    if (!els.popularList) return;

    var counts = {};
    orders.forEach(function (order) {
      (order.items || []).forEach(function (item) {
        if (!item || !item.id) return;
        if (!counts[item.id]) {
          counts[item.id] = { name: item.name || 'Item', qty: 0, image: item.image || '' };
        }
        counts[item.id].qty += Number(item.qty || 1);
      });
    });

    var rows = Object.keys(counts)
      .map(function (id) {
        var product = lane.getProduct(id);
        return {
          name: (product && product.name) || counts[id].name,
          category: product ? lane.categoryLabel(product.category) : 'Menu item',
          image: (product && product.image) || counts[id].image,
          qty: counts[id].qty,
          label: counts[id].qty + ' sold'
        };
      })
      .sort(function (a, b) {
        return b.qty - a.qty;
      })
      .slice(0, 5);

    if (!rows.length) {
      rows = lane
        .getProducts()
        .filter(function (product) {
          return product.featured;
        })
        .slice(0, 4)
        .map(function (product) {
          return {
            name: product.name,
            category: lane.categoryLabel(product.category),
            image: product.image,
            qty: 0,
            label: 'Menu pick'
          };
        });
    }

    if (!rows.length) {
      els.popularList.innerHTML = '<p class="text-muted">No products on the menu yet.</p>';
      return;
    }

    els.popularList.innerHTML = rows
      .map(function (row) {
        return (
          '<div class="popular-item">' +
          '<img class="popular-item__img" src="' +
          lane.escapeHTML(row.image) +
          '" alt="' +
          lane.escapeHTML(row.name) +
          '" loading="lazy">' +
          '<div class="popular-item__info"><strong>' +
          lane.escapeHTML(row.name) +
          '</strong><span>' +
          lane.escapeHTML(row.category) +
          ' · ' +
          lane.escapeHTML(row.label) +
          '</span></div>' +
          '<span class="popular-item__qty">' +
          (row.qty ? row.qty : '—') +
          '</span>' +
          '</div>'
        );
      })
      .join('');
  }

  function renderRecentOrders(orders) {
    if (!els.recentOrders) return;

    if (!orders.length) {
      els.recentOrders.innerHTML =
        '<tr><td colspan="5" class="admin-empty">No orders yet. Orders placed from the checkout page will appear here.</td></tr>';
      return;
    }

    els.recentOrders.innerHTML = orders
      .slice(0, 5)
      .map(function (order) {
        return (
          '<tr>' +
          '<td><strong>' +
          lane.escapeHTML(order.id) +
          '</strong><br><span class="text-muted" style="font-size:.64rem">' +
          lane.escapeHTML(orderItemsLabel(order)) +
          '</span></td>' +
          '<td>' +
          lane.escapeHTML(order.name || '—') +
          '<br><span class="text-muted" style="font-size:.64rem">' +
          lane.escapeHTML(order.phone || '') +
          '</span></td>' +
          '<td>' +
          lane.formatDate(order.createdAt, true) +
          '</td>' +
          '<td><strong>' +
          lane.formatLKR(order.total) +
          '</strong></td>' +
          '<td>' +
          statusChip(order.status) +
          '</td>' +
          '<td><div class="table-actions">' +
          '<button class="table-action" type="button" data-view-order="' +
          lane.escapeHTML(order.id) +
          '" aria-label="View order ' +
          lane.escapeHTML(order.id) +
          '" title="View order">' +
          lane.icon('eye') +
          '</button>' +
          '</div></td>' +
          '</tr>'
        );
      })
      .join('');
  }

  /* ---------------- Products ---------------- */
  function fillCategorySelect(select, includeAll) {
    if (!select) return;
    var options = includeAll ? '<option value="all">All categories</option>' : '';
    options += lane
      .getCategories()
      .map(function (category) {
        return '<option value="' + lane.escapeHTML(category.id) + '">' + lane.escapeHTML(category.label) + '</option>';
      })
      .join('');
    select.innerHTML = options;
  }

  function renderProducts() {
    if (!els.productsBody) return;

    var all = lane.getProducts();
    var term = state.productSearch.trim().toLowerCase();

    var products = all.filter(function (product) {
      if (state.productCategory !== 'all' && product.category !== state.productCategory) return false;
      if (!term) return true;
      return (
        String(product.name).toLowerCase().indexOf(term) !== -1 ||
        String(product.id).toLowerCase().indexOf(term) !== -1 ||
        String(product.short || '').toLowerCase().indexOf(term) !== -1
      );
    });

    if (els.productCount) {
      els.productCount.textContent =
        products.length + ' of ' + all.length + ' product' + (all.length === 1 ? '' : 's');
    }

    if (!products.length) {
      els.productsBody.innerHTML =
        '<tr><td colspan="5" class="admin-empty">No products match those filters.</td></tr>';
      return;
    }

    els.productsBody.innerHTML = products
      .map(function (product) {
        return (
          '<tr>' +
          '<td><div class="table-product">' +
          '<img src="' +
          lane.escapeHTML(product.image) +
          '" alt="' +
          lane.escapeHTML(product.name) +
          '" loading="lazy">' +
          '<div><strong>' +
          lane.escapeHTML(product.name) +
          '</strong><br><span class="text-muted" style="font-size:.64rem">' +
          lane.escapeHTML(product.id) +
          '</span></div></div></td>' +
          '<td>' +
          lane.escapeHTML(lane.categoryLabel(product.category)) +
          '</td>' +
          '<td><strong>' +
          lane.formatLKR(product.price) +
          '</strong></td>' +
          '<td>' +
          (product.featured
            ? '<span class="badge badge--soft">Featured</span>'
            : '<span class="text-muted">—</span>') +
          '</td>' +
          '<td><div class="table-actions">' +
          '<button class="table-action" type="button" data-edit-product="' +
          lane.escapeHTML(product.id) +
          '" aria-label="Edit ' +
          lane.escapeHTML(product.name) +
          '" title="Edit product">' +
          lane.icon('edit') +
          '</button>' +
          '<button class="table-action table-action--danger" type="button" data-delete-product="' +
          lane.escapeHTML(product.id) +
          '" aria-label="Delete ' +
          lane.escapeHTML(product.name) +
          '" title="Delete product">' +
          lane.icon('trash') +
          '</button>' +
          '</div></td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function openProductModal(id) {
    var existing = id ? lane.getProduct(id) : null;
    if (id && !existing) {
      lane.toast('That product could not be found.', 'error');
      return;
    }

    var categories = lane
      .getCategories()
      .map(function (category) {
        return (
          '<option value="' +
          lane.escapeHTML(category.id) +
          '"' +
          (existing && existing.category === category.id ? ' selected' : '') +
          '>' +
          lane.escapeHTML(category.label) +
          '</option>'
        );
      })
      .join('');

    var body =
      '<form class="settings-form" id="adminProductForm" novalidate>' +
      '<input type="hidden" id="adminProductId" value="' +
      lane.escapeHTML(existing ? existing.id : '') +
      '">' +
      '<div class="field-row">' +
      '<div class="field"><label class="field-label" for="adminProductName">Product name <span aria-hidden="true">*</span></label>' +
      '<input class="input" type="text" id="adminProductName" value="' +
      lane.escapeHTML(existing ? existing.name : '') +
      '" placeholder="Iced Cinnamon Latte" required><span class="field-error" role="alert"></span></div>' +
      '<div class="field"><label class="field-label" for="adminProductCategory">Category</label>' +
      '<select class="input select" id="adminProductCategory">' +
      categories +
      '</select></div>' +
      '</div>' +
      '<div class="field-row">' +
      '<div class="field"><label class="field-label" for="adminProductPrice">Price (LKR) <span aria-hidden="true">*</span></label>' +
      '<input class="input" type="number" id="adminProductPrice" min="1" step="10" value="' +
      lane.escapeHTML(existing ? existing.price : '') +
      '" placeholder="950" required><span class="field-error" role="alert"></span></div>' +
      '<div class="field"><label class="field-label" for="adminProductBadge">Badge <span class="text-muted">(optional)</span></label>' +
      '<input class="input" type="text" id="adminProductBadge" value="' +
      lane.escapeHTML(existing && existing.badge ? existing.badge : '') +
      '" placeholder="New, Bestseller…"></div>' +
      '</div>' +
      '<div class="field"><label class="field-label" for="adminProductShort">Short description <span aria-hidden="true">*</span></label>' +
      '<input class="input" type="text" id="adminProductShort" maxlength="120" value="' +
      lane.escapeHTML(existing ? existing.short : '') +
      '" placeholder="One tempting line for the menu card." required><span class="field-error" role="alert"></span></div>' +
      '<div class="field"><label class="field-label" for="adminProductDescription">Full description <span aria-hidden="true">*</span></label>' +
      '<textarea class="textarea" id="adminProductDescription" rows="3" required>' +
      lane.escapeHTML(existing ? existing.description : '') +
      '</textarea><span class="field-error" role="alert"></span></div>' +
      '<div class="field-row">' +
      '<div class="field"><label class="field-label" for="adminProductIngredients">Ingredients</label>' +
      '<input class="input" type="text" id="adminProductIngredients" value="' +
      lane.escapeHTML(existing && existing.ingredients ? existing.ingredients : '') +
      '" placeholder="Espresso, milk, cinnamon"></div>' +
      '<div class="field"><label class="field-label" for="adminProductAllergens">Allergens</label>' +
      '<input class="input" type="text" id="adminProductAllergens" value="' +
      lane.escapeHTML(existing && existing.allergens ? existing.allergens : '') +
      '" placeholder="Milk"></div>' +
      '</div>' +
      '<div class="field-row">' +
      '<div class="field"><label class="field-label" for="adminProductCalories">Approx. energy</label>' +
      '<input class="input" type="text" id="adminProductCalories" value="' +
      lane.escapeHTML(existing && existing.calories ? existing.calories : '') +
      '" placeholder="180 kcal"></div>' +
      '<div class="field"><label class="field-label" for="adminProductImage">Image path</label>' +
      '<input class="input" type="text" id="adminProductImage" value="' +
      lane.escapeHTML(existing ? existing.image : 'images/hero-cafe.jpg') +
      '" placeholder="images/product.jpg"><span class="field-error" role="alert"></span></div>' +
      '</div>' +
      '<label class="check"><input type="checkbox" id="adminProductFeatured"' +
      (existing && existing.featured ? ' checked' : '') +
      '><span>Feature this product on the homepage</span></label>' +
      '</form>';

    var footer =
      '<button class="btn btn--ghost" type="button" data-modal-close>Cancel</button>' +
      '<button class="btn" type="submit" form="adminProductForm">' +
      (existing ? 'Save changes' : 'Add product') +
      '</button>';

    var modal = openModal({
      title: existing ? 'Edit product' : 'Add a product',
      subtitle: 'Saved in this browser only — no server or database is involved.',
      body: body,
      footer: footer,
      wide: true
    });

    var form = modal.querySelector('#adminProductForm');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      lane.clearFieldErrors(form);

      var nameInput = form.querySelector('#adminProductName');
      var priceInput = form.querySelector('#adminProductPrice');
      var shortInput = form.querySelector('#adminProductShort');
      var descriptionInput = form.querySelector('#adminProductDescription');
      var imageInput = form.querySelector('#adminProductImage');
      var valid = true;

      if (nameInput.value.trim().length < 2) {
        lane.fieldError(nameInput, 'Please enter a product name.');
        valid = false;
      }
      if (!priceInput.value || Number(priceInput.value) <= 0) {
        lane.fieldError(priceInput, 'Enter a price greater than zero.');
        valid = false;
      }
      if (shortInput.value.trim().length < 5) {
        lane.fieldError(shortInput, 'Add a short description of at least 5 characters.');
        valid = false;
      }
      if (descriptionInput.value.trim().length < 10) {
        lane.fieldError(descriptionInput, 'Add a fuller description of at least 10 characters.');
        valid = false;
      }
      if (!imageInput.value.trim()) {
        imageInput.value = 'images/hero-cafe.jpg';
      }

      if (!valid) return;

      var products = lane.getProducts();
      var payload = {
        name: nameInput.value.trim(),
        category: form.querySelector('#adminProductCategory').value,
        price: Math.round(Number(priceInput.value)),
        badge: form.querySelector('#adminProductBadge').value.trim(),
        short: shortInput.value.trim(),
        description: descriptionInput.value.trim(),
        ingredients: form.querySelector('#adminProductIngredients').value.trim(),
        allergens: form.querySelector('#adminProductAllergens').value.trim(),
        calories: form.querySelector('#adminProductCalories').value.trim(),
        image: imageInput.value.trim(),
        featured: form.querySelector('#adminProductFeatured').checked
      };

      if (existing) {
        products = products.map(function (product) {
          if (product.id !== existing.id) return product;
          return Object.assign({}, product, payload);
        });
      } else {
        var id = uniqueProductId(lane.slugify(payload.name), products);
        products.push(
          Object.assign(
            {
              id: id,
              rating: 4.8,
              reviews: 0
            },
            payload
          )
        );
      }

      if (!lane.saveProducts(products)) return;

      lane.toast(
        existing ? '“' + payload.name + '” was updated.' : '“' + payload.name + '” was added to the menu.',
        'success',
        existing ? 'Product saved' : 'Product added'
      );
      closeModal();
      renderAll();
    });
  }

  function deleteProduct(id) {
    var product = lane.getProduct(id);
    if (!product) return;

    if (!window.confirm('Delete “' + product.name + '” from the menu? This only changes this browser.')) {
      return;
    }

    var products = lane.getProducts().filter(function (item) {
      return item.id !== id;
    });

    if (!lane.saveProducts(products)) return;
    lane.removeFromCart(id);
    lane.toast('“' + product.name + '” was removed from the menu.', 'info', 'Product deleted');
    renderAll();
  }

  /* ---------------- Orders ---------------- */
  function renderOrders() {
    if (!els.ordersBody) return;

    var all = lane.getOrders();
    var term = state.orderSearch.trim().toLowerCase();

    var orders = all.filter(function (order) {
      if (state.orderStatus !== 'all' && String(order.status || 'Pending') !== state.orderStatus) {
        return false;
      }
      if (!term) return true;
      return (
        String(order.id).toLowerCase().indexOf(term) !== -1 ||
        String(order.name || '').toLowerCase().indexOf(term) !== -1 ||
        String(order.phone || '').toLowerCase().indexOf(term) !== -1 ||
        String(order.email || '').toLowerCase().indexOf(term) !== -1
      );
    });

    if (els.orderCountLabel) {
      els.orderCountLabel.textContent =
        orders.length + ' of ' + all.length + ' order' + (all.length === 1 ? '' : 's');
    }

    if (!orders.length) {
      els.ordersBody.innerHTML =
        '<tr><td colspan="6" class="admin-empty">No orders match that view yet.</td></tr>';
      return;
    }

    els.ordersBody.innerHTML = orders
      .map(function (order) {
        var options = STATUSES.map(function (status) {
          return (
            '<option value="' +
            lane.escapeHTML(status) +
            '"' +
            (String(order.status || 'Pending') === status ? ' selected' : '') +
            '>' +
            lane.escapeHTML(status) +
            '</option>'
          );
        }).join('');

        return (
          '<tr>' +
          '<td><strong>' +
          lane.escapeHTML(order.id) +
          '</strong><br><span class="text-muted" style="font-size:.64rem">' +
          lane.escapeHTML(orderItemsLabel(order)) +
          '</span></td>' +
          '<td>' +
          lane.escapeHTML(order.name || '—') +
          '<br><span class="text-muted" style="font-size:.64rem">' +
          lane.escapeHTML(order.phone || '') +
          '</span></td>' +
          '<td>' +
          lane.formatDate(order.createdAt, true) +
          '</td>' +
          '<td><strong>' +
          lane.formatLKR(order.total) +
          '</strong></td>' +
          '<td><select class="input select table-select" data-order-status="' +
          lane.escapeHTML(order.id) +
          '" aria-label="Status for order ' +
          lane.escapeHTML(order.id) +
          '">' +
          options +
          '</select></td>' +
          '<td><div class="table-actions">' +
          '<button class="table-action" type="button" data-view-order="' +
          lane.escapeHTML(order.id) +
          '" aria-label="View order ' +
          lane.escapeHTML(order.id) +
          '" title="View order">' +
          lane.icon('eye') +
          '</button>' +
          '<button class="table-action table-action--danger" type="button" data-delete-order="' +
          lane.escapeHTML(order.id) +
          '" aria-label="Delete order ' +
          lane.escapeHTML(order.id) +
          '" title="Delete order">' +
          lane.icon('trash') +
          '</button>' +
          '</div></td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function viewOrder(id) {
    var order = lane.getOrders().find(function (item) {
      return item.id === id;
    });
    if (!order) {
      lane.toast('That order could not be found.', 'error');
      return;
    }

    var items = (order.items || [])
      .map(function (item) {
        return (
          '<div class="summary-row"><span>' +
          lane.escapeHTML(item.name) +
          ' × ' +
          Number(item.qty || 1) +
          '</span><strong>' +
          lane.formatLKR(Number(item.price || 0) * Number(item.qty || 1)) +
          '</strong></div>'
        );
      })
      .join('');

    var fulfilment =
      order.fulfilment === 'pickup'
        ? 'Pickup from the cafe'
        : 'Delivery to ' +
          lane.escapeHTML(order.address || '—') +
          (order.city ? ', ' + lane.escapeHTML(order.city) : '') +
          (order.landmark ? '<br><span class="text-muted">Landmark: ' + lane.escapeHTML(order.landmark) + '</span>' : '');

    var body =
      '<div class="summary-rows">' +
      '<div class="summary-row"><span>Status</span>' +
      statusChip(order.status) +
      '</div>' +
      '<div class="summary-row"><span>Placed</span><strong>' +
      lane.formatDate(order.createdAt, true) +
      '</strong></div>' +
      '<div class="summary-row"><span>Customer</span><strong>' +
      lane.escapeHTML(order.name || '—') +
      '</strong></div>' +
      '<div class="summary-row"><span>Phone</span><strong>' +
      lane.escapeHTML(order.phone || '—') +
      '</strong></div>' +
      (order.email
        ? '<div class="summary-row"><span>Email</span><strong>' + lane.escapeHTML(order.email) + '</strong></div>'
        : '') +
      '</div>' +
      '<hr class="divider-line">' +
      '<div class="summary-rows">' +
      items +
      '</div>' +
      '<div class="summary-total"><span>Total</span><strong>' +
      lane.formatLKR(order.total) +
      '</strong></div>' +
      '<hr class="divider-line">' +
      '<p><strong>Fulfilment</strong><br>' +
      fulfilment +
      '<br>Payment: ' +
      lane.escapeHTML(order.payment || 'Cash on delivery / pickup') +
      '</p>' +
      (order.notes ? '<p><strong>Notes</strong><br>' + lane.escapeHTML(order.notes) + '</p>' : '');

    var footer = '<button class="btn btn--ghost" type="button" data-modal-close>Close</button>';
    var number = waNumber(order.phone);

    if (number) {
      var message =
        'Hello ' +
        (order.name || 'there') +
        ', this is Coco Lane Cafe about your order ' +
        order.id +
        '. We would like to confirm the details.';
      footer +=
        '<a class="btn" href="' +
        lane.escapeHTML(lane.buildWhatsAppLink(message, number)) +
        '" target="_blank" rel="noopener noreferrer">WhatsApp customer</a>';
    }

    openModal({
      title: 'Order ' + order.id,
      subtitle: orderItemsLabel(order),
      body: body,
      footer: footer,
      wide: true
    });
  }

  function deleteOrder(id) {
    if (!window.confirm('Delete order ' + id + ' from this browser? This cannot be undone.')) {
      return;
    }

    var orders = lane.getOrders().filter(function (order) {
      return order.id !== id;
    });

    if (!lane.saveOrders(orders)) return;
    lane.toast('Order ' + id + ' was deleted.', 'info', 'Order removed');
    renderAll();
  }

  function exportOrders() {
    var orders = lane.getOrders();
    if (!orders.length) {
      lane.toast('There are no orders to export yet.', 'info');
      return;
    }
    if (downloadJSON('coco-lane-orders-' + fileStamp() + '.json', orders)) {
      lane.toast('Orders exported as a JSON file.', 'success', 'Export ready');
    }
  }

  /* ---------------- Messages ---------------- */
  function renderMessages() {
    if (!els.messagesList) return;

    var all = lane.getMessages();
    var messages = all.filter(function (message) {
      if (state.messageFilter === 'unread') return !message.read;
      if (state.messageFilter === 'read') return Boolean(message.read);
      return true;
    });

    var unread = all.filter(function (message) {
      return !message.read;
    }).length;

    if (els.messageCountLabel) {
      els.messageCountLabel.textContent =
        messages.length + ' shown · ' + unread + ' unread';
    }

    updateCounts();

    if (!messages.length) {
      els.messagesList.innerHTML =
        '<div class="admin-empty">No messages in this view. Contact-form submissions will appear here.</div>';
      return;
    }

    els.messagesList.innerHTML = messages
      .map(function (message) {
        var phone = waNumber(message.phone);
        var messageLink = phone
          ? lane.buildWhatsAppLink(
              'Hello ' + (message.name || 'there') + ', thank you for contacting Coco Lane Cafe.',
              phone
            )
          : '';
        var replySubject = 'Re: ' + (message.subject || 'Your message to Coco Lane Cafe');
        var replyLink =
          'mailto:' +
          encodeURIComponent(message.email || '') +
          '?subject=' +
          encodeURIComponent(replySubject);

        return (
          '<article class="message-card' +
          (message.read ? '' : ' is-unread') +
          '" data-message-card="' +
          lane.escapeHTML(message.id) +
          '">' +
          '<div class="message-card__head">' +
          '<div class="message-card__who"><strong>' +
          lane.escapeHTML(message.name) +
          '</strong><span>' +
          lane.escapeHTML(message.email) +
          (message.phone ? ' · ' + lane.escapeHTML(message.phone) : '') +
          '</span></div>' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
          '<span class="badge ' +
          (message.read ? 'badge--soft' : 'badge--warning') +
          '">' +
          (message.read ? 'Read' : 'Unread') +
          '</span>' +
          '<span class="text-muted" style="font-size:.64rem">' +
          lane.formatDate(message.createdAt, true) +
          '</span></div>' +
          '</div>' +
          '<div class="message-card__body"><strong>' +
          lane.escapeHTML(message.subject || 'General question') +
          '</strong><br>' +
          lane.escapeHTML(message.message).replace(/\n/g, '<br>') +
          '</div>' +
          '<div class="message-card__actions">' +
          '<button class="btn btn--sm btn--ghost" type="button" data-message-toggle="' +
          lane.escapeHTML(message.id) +
          '">' +
          (message.read ? 'Mark as unread' : 'Mark as read') +
          '</button>' +
          '<a class="btn btn--sm btn--outline" href="' +
          lane.escapeHTML(replyLink) +
          '">Reply by email</a>' +
          (messageLink
            ? '<a class="btn btn--sm btn--ghost" href="' +
              lane.escapeHTML(messageLink) +
              '" target="_blank" rel="noopener noreferrer">WhatsApp</a>'
            : '') +
          '<button class="btn btn--sm btn--danger" type="button" data-message-delete="' +
          lane.escapeHTML(message.id) +
          '">Delete</button>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');
  }

  function toggleMessage(id) {
    var messages = lane.getMessages();
    messages = messages.map(function (message) {
      if (message.id !== id) return message;
      return Object.assign({}, message, { read: !message.read });
    });
    if (!lane.saveMessages(messages)) return;
    renderMessages();
    renderDashboard();
  }

  function deleteMessage(id) {
    if (!window.confirm('Delete this message from this browser? This cannot be undone.')) return;
    var messages = lane.getMessages().filter(function (message) {
      return message.id !== id;
    });
    if (!lane.saveMessages(messages)) return;
    lane.toast('Message deleted.', 'info', 'Message removed');
    renderMessages();
    renderDashboard();
  }

  function markAllMessagesRead() {
    var messages = lane.getMessages();
    if (!messages.length) {
      lane.toast('There are no messages to mark.', 'info');
      return;
    }
    messages = messages.map(function (message) {
      return Object.assign({}, message, { read: true });
    });
    if (!lane.saveMessages(messages)) return;
    lane.toast('All messages marked as read.', 'success');
    renderMessages();
    renderDashboard();
  }

  /* ---------------- Settings ---------------- */
  function renderSettings() {
    if (!els.settingsForm) return;

    var settings = lane.getSettings();
    var numberInput = document.getElementById('adminWhatsApp');
    var nameInput = document.getElementById('adminCafeName');

    if (numberInput && document.activeElement !== numberInput) {
      numberInput.value = settings.whatsappNumber;
    }
    if (nameInput && document.activeElement !== nameInput) {
      nameInput.value = settings.cafeName;
    }

    updatePlaceholderNote();
  }

  function updatePlaceholderNote() {
    if (!els.numberState) return;
    var settings = lane.getSettings();
    var placeholder = lane.isWhatsAppPlaceholder();

    els.numberState.textContent = placeholder
      ? 'Currently using the built-in placeholder number 94770000000. Replace it before publishing the site.'
      : 'Custom number saved: ' + settings.whatsappNumber + '. This overrides the placeholder in js/main.js.';
    els.numberState.style.color = placeholder ? '' : 'var(--success)';
  }

  function initSettings() {
    if (!els.settingsForm) return;

    els.settingsForm.addEventListener('submit', function (event) {
      event.preventDefault();
      lane.clearFieldErrors(els.settingsForm);
      if (els.settingsAlert) els.settingsAlert.innerHTML = '';

      var numberInput = document.getElementById('adminWhatsApp');
      var nameInput = document.getElementById('adminCafeName');
      var digits = String(numberInput.value || '').replace(/\D/g, '');
      var valid = true;

      if (!digits) {
        lane.fieldError(numberInput, 'Enter the WhatsApp number in international format.');
        valid = false;
      } else if (!/^\d{10,15}$/.test(digits)) {
        lane.fieldError(numberInput, 'Use 10 to 15 digits, e.g. 94771234567 (no + or spaces).');
        valid = false;
      }

      if (nameInput.value.trim().length < 2) {
        lane.fieldError(nameInput, 'Please enter the cafe name.');
        valid = false;
      }

      if (!valid) {
        lane.showFormAlert(els.settingsAlert, 'Please check the highlighted fields.', 'error');
        return;
      }

      if (
        !lane.saveSettings({
          whatsappNumber: digits,
          cafeName: nameInput.value.trim()
        })
      ) {
        lane.showFormAlert(els.settingsAlert, 'Settings could not be saved in this browser.', 'error');
        return;
      }

      lane.showFormAlert(
        els.settingsAlert,
        'Settings saved in this browser. New checkout messages will use this WhatsApp number.',
        'success'
      );
      lane.toast('Cafe settings updated.', 'success', 'Saved');
      updatePlaceholderNote();
    });
  }

  function exportEverything() {
    var payload = {
      exportedAt: new Date().toISOString(),
      note: 'Demo export from the Coco Lane Cafe frontend-only project. Data lives in the browser LocalStorage.',
      settings: lane.getSettings(),
      products: lane.getProducts(),
      orders: lane.getOrders(),
      messages: lane.getMessages(),
      profiles: lane.getUsers().map(function (user) {
        return {
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          createdAt: user.createdAt || ''
        };
      })
    };

    if (downloadJSON('coco-lane-demo-data-' + fileStamp() + '.json', payload)) {
      lane.toast('A JSON copy of the demo data was downloaded.', 'success', 'Export ready');
    }
  }

  function runDataAction(action) {
    if (action === 'export') {
      exportEverything();
      return;
    }

    if (action === 'reseed') {
      if (!window.confirm('Restore the original 18 sample products? Any menu edits in this browser will be lost.')) return;
      lane.resetProducts();
      lane.toast('The sample menu has been restored.', 'success', 'Menu reset');
      renderAll();
      return;
    }

    if (action === 'clear-orders') {
      if (!window.confirm('Delete every locally saved order? This cannot be undone.')) return;
      lane.saveOrders([]);
      lane.toast('All local orders were cleared.', 'info', 'Orders cleared');
      renderAll();
      return;
    }

    if (action === 'clear-messages') {
      if (!window.confirm('Delete every locally saved contact message? This cannot be undone.')) return;
      lane.saveMessages([]);
      lane.toast('All local messages were cleared.', 'info', 'Messages cleared');
      renderAll();
      return;
    }

    if (action === 'reset-all') {
      if (
        !window.confirm(
          'Reset products, cart, orders, messages and settings in this browser? Customer accounts will be kept. This cannot be undone.'
        )
      ) {
        return;
      }

      ['products', 'cart', 'orders', 'messages', 'settings'].forEach(function (key) {
        lane.storage.remove(lane.KEYS[key]);
      });
      lane.toast('Demo data has been reset in this browser.', 'success', 'Fresh start');
      renderAll();
    }
  }

  /* ---------------- Global admin interactions ---------------- */
  function onDocumentClick(event) {
    var viewButton = event.target.closest('[data-admin-view]');
    if (viewButton) {
      event.preventDefault();
      setView(viewButton.getAttribute('data-admin-view'));
      return;
    }

    if (event.target.closest('[data-open-product]')) {
      event.preventDefault();
      openProductModal(null);
      return;
    }

    var editButton = event.target.closest('[data-edit-product]');
    if (editButton) {
      event.preventDefault();
      openProductModal(editButton.getAttribute('data-edit-product'));
      return;
    }

    var deleteProductButton = event.target.closest('[data-delete-product]');
    if (deleteProductButton) {
      event.preventDefault();
      deleteProduct(deleteProductButton.getAttribute('data-delete-product'));
      return;
    }

    var viewOrderButton = event.target.closest('[data-view-order]');
    if (viewOrderButton) {
      event.preventDefault();
      viewOrder(viewOrderButton.getAttribute('data-view-order'));
      return;
    }

    var deleteOrderButton = event.target.closest('[data-delete-order]');
    if (deleteOrderButton) {
      event.preventDefault();
      deleteOrder(deleteOrderButton.getAttribute('data-delete-order'));
      return;
    }

    var messageToggle = event.target.closest('[data-message-toggle]');
    if (messageToggle) {
      event.preventDefault();
      toggleMessage(messageToggle.getAttribute('data-message-toggle'));
      return;
    }

    var messageDelete = event.target.closest('[data-message-delete]');
    if (messageDelete) {
      event.preventDefault();
      deleteMessage(messageDelete.getAttribute('data-message-delete'));
      return;
    }

    var dataAction = event.target.closest('[data-admin-action]');
    if (dataAction) {
      event.preventDefault();
      runDataAction(dataAction.getAttribute('data-admin-action'));
    }
  }

  function onDocumentChange(event) {
    var statusSelect = event.target.closest('[data-order-status]');
    if (statusSelect) {
      var id = statusSelect.getAttribute('data-order-status');
      var status = statusSelect.value;

      if (!lane.updateOrder(id, { status: status })) {
        lane.toast('That order could not be updated.', 'error');
        return;
      }

      lane.toast('Order ' + id + ' marked ' + status + '.', 'success', 'Order updated');
      renderDashboard();
      renderOrders();
      return;
    }
  }

  function initToolbar() {
    if (els.productSearch) {
      els.productSearch.addEventListener(
        'input',
        lane.debounce(function () {
          state.productSearch = els.productSearch.value;
          renderProducts();
        }, 150)
      );
    }

    if (els.productCategory) {
      els.productCategory.addEventListener('change', function () {
        state.productCategory = els.productCategory.value;
        renderProducts();
      });
    }

    if (els.orderSearch) {
      els.orderSearch.addEventListener(
        'input',
        lane.debounce(function () {
          state.orderSearch = els.orderSearch.value;
          renderOrders();
        }, 150)
      );
    }

    if (els.orderStatusFilter) {
      els.orderStatusFilter.addEventListener('change', function () {
        state.orderStatus = els.orderStatusFilter.value;
        renderOrders();
      });
    }

    if (els.messageFilter) {
      els.messageFilter.addEventListener('change', function () {
        state.messageFilter = els.messageFilter.value;
        renderMessages();
      });
    }

    if (els.markAllRead) {
      els.markAllRead.addEventListener('click', markAllMessagesRead);
    }

    if (els.exportOrders) {
      els.exportOrders.addEventListener('click', exportOrders);
    }

    if (els.logout) {
      els.logout.addEventListener('click', function () {
        lane.storage.removeSession(lane.KEYS.adminSession);
        closeModal();
        showLogin();
        lane.toast('You have signed out of the demo admin.', 'info', 'Signed out');
      });
    }

    window.addEventListener('hashchange', function () {
      if (isSignedIn()) setView(currentHash(), false);
    });
  }

  /* ---------------- Boot ---------------- */
  function init() {
    els.login = document.getElementById('adminLogin');
    els.app = document.getElementById('adminApp');
    els.logout = document.getElementById('adminLogoutBtn');
    els.greeting = document.getElementById('adminGreeting');
    els.date = document.getElementById('adminDate');

    els.statOrders = document.getElementById('statOrders');
    els.statOrdersMeta = document.getElementById('statOrdersMeta');
    els.statRevenue = document.getElementById('statRevenue');
    els.statRevenueMeta = document.getElementById('statRevenueMeta');
    els.statPending = document.getElementById('statPending');
    els.statPendingMeta = document.getElementById('statPendingMeta');
    els.statMessages = document.getElementById('statMessages');
    els.statMessagesMeta = document.getElementById('statMessagesMeta');

    els.salesChart = document.getElementById('salesChart');
    els.popularList = document.getElementById('popularList');
    els.recentOrders = document.getElementById('recentOrdersBody');

    els.orderCount = document.getElementById('navOrderCount');
    els.messageCount = document.getElementById('navMessageCount');

    els.productSearch = document.getElementById('adminProductSearch');
    els.productCategory = document.getElementById('adminProductCategoryFilter');
    els.productsBody = document.getElementById('productsBody');
    els.productCount = document.getElementById('productCountLabel');

    els.orderSearch = document.getElementById('adminOrderSearch');
    els.orderStatusFilter = document.getElementById('adminOrderStatusFilter');
    els.ordersBody = document.getElementById('ordersBody');
    els.orderCountLabel = document.getElementById('orderCountLabel');
    els.exportOrders = document.getElementById('exportOrdersBtn');

    els.messagesList = document.getElementById('messagesList');
    els.messageFilter = document.getElementById('adminMessageFilter');
    els.messageCountLabel = document.getElementById('messageCountLabel');
    els.markAllRead = document.getElementById('markAllReadBtn');

    els.settingsForm = document.getElementById('adminSettingsForm');
    els.settingsAlert = document.getElementById('settingsAlert');
    els.numberState = document.getElementById('settingsNumberState');

    fillCategorySelect(els.productCategory, true);
    initLogin();
    initToolbar();
    initSettings();

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('change', onDocumentChange);

    if (isSignedIn()) showApp();
    else showLogin();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
