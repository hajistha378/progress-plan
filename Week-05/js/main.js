/* ============================================================
   COCO LANE CAFE — Shared application core
   Storage helpers, product catalogue, cart engine and UI shell.
   Frontend only: HTML5 + CSS3 + Vanilla JS + LocalStorage.
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     CONFIG — change the cafe details in one place.
     The WhatsApp number is a clearly-marked placeholder, NOT a
     real business number. Replace it with the cafe's number in
     international format (no +, no spaces), e.g. 94771234567.
     ---------------------------------------------------------- */
  var CONFIG = {
    brand: 'Coco Lane Cafe',
    tagline: 'A perfect place for coffee & sweet moments.',
    whatsappNumber: '94770000000', // PLACEHOLDER — replace before going live.
    deliveryFee: 350,
    freeDeliveryThreshold: 5000,
    currency: 'LKR',
    address: 'No. 123, Coffee Lane, Colombo 07, Sri Lanka',
    phone: '+94 77 000 0000',
    email: 'hello@cocolanecafe.example',
    openingHours: 'Daily · 7:30 AM – 10:00 PM'
  };

  var KEYS = {
    products: 'cocoLaneProducts',
    cart: 'cocoLaneCart',
    users: 'cocoLaneUsers',
    session: 'cocoLaneSession',
    orders: 'cocoLaneOrders',
    messages: 'cocoLaneMessages',
    settings: 'cocoLaneSettings',
    adminSession: 'cocoLaneAdminSession',
    theme: 'cocoLaneTheme'
  };

  /* ---------------- Storage helpers (safe) ---------------- */
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      var parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      toast('Your browser storage is full or blocked. Changes could not be saved.', 'error');
      return false;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  function readSession(key, fallback) {
    try {
      var raw = sessionStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function writeSession(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function removeSession(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      /* ignore */
    }
  }

  /* ---------------- Tiny utilities ---------------- */
  function escapeHTML(value) {
    return String(value === undefined || value === null ? '' : value).replace(
      /[&<>"']/g,
      function (character) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[character];
      }
    );
  }

  function formatLKR(amount) {
    var number = Number(amount);
    if (!isFinite(number)) number = 0;
    return (
      CONFIG.currency +
      ' ' +
      new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(Math.round(number))
    );
  }

  function formatDate(value, withTime) {
    var date = value ? new Date(value) : new Date();
    if (isNaN(date.getTime())) return '—';
    var options = { year: 'numeric', month: 'short', day: 'numeric' };
    if (withTime) {
      options.hour = 'numeric';
      options.minute = '2-digit';
    }
    return new Intl.DateTimeFormat('en-LK', options).format(date);
  }

  function initials(name) {
    return String(name || 'C')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join('');
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function debounce(fn, wait) {
    var timer;
    return function () {
      var args = arguments;
      var context = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, wait || 200);
    };
  }

  function queryParam(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch (error) {
      return null;
    }
  }

  /* ---------------- Product catalogue ---------------- */
  function seedProducts() {
    try {
      return JSON.parse(JSON.stringify(window.COCO_PRODUCTS || []));
    } catch (error) {
      return [];
    }
  }

  function getProducts() {
    var stored = read(KEYS.products, null);
    if (!Array.isArray(stored) || stored.length === 0) {
      var seeded = seedProducts();
      write(KEYS.products, seeded);
      return seeded;
    }
    return stored.filter(function (product) {
      return product && product.id && product.name;
    });
  }

  function saveProducts(products) {
    return write(KEYS.products, products);
  }

  function resetProducts() {
    var seeded = seedProducts();
    saveProducts(seeded);
    return seeded;
  }

  function getProduct(id) {
    var products = getProducts();
    for (var i = 0; i < products.length; i += 1) {
      if (products[i].id === id) return products[i];
    }
    return null;
  }

  function categoryLabel(id) {
    var categories = window.COCO_CATEGORIES || [];
    for (var i = 0; i < categories.length; i += 1) {
      if (categories[i].id === id) return categories[i].label;
    }
    return 'Cafe';
  }

  function getCategories() {
    return (window.COCO_CATEGORIES || []).slice();
  }

  /* ---------------- Cart engine ---------------- */
  function sanitizeQty(value) {
    var number = parseInt(value, 10);
    if (!isFinite(number) || number < 1) return 1;
    if (number > 99) return 99;
    return number;
  }

  function getCart() {
    var raw = read(KEYS.cart, []);
    if (!Array.isArray(raw)) return [];
    var products = getProducts();
    var seen = {};
    return raw
      .map(function (item) {
        if (!item || !item.id) return null;
        var exists = products.some(function (product) {
          return product.id === item.id;
        });
        if (!exists || seen[item.id]) return null;
        seen[item.id] = true;
        return { id: item.id, qty: sanitizeQty(item.qty) };
      })
      .filter(Boolean);
  }

  function saveCart(cart) {
    var saved = write(KEYS.cart, cart);
    if (saved) {
      document.dispatchEvent(new CustomEvent('coco:cart-updated', { detail: { cart: cart } }));
      updateCartBadges();
    }
    return saved;
  }

  function getCartDetails() {
    var cart = getCart();
    var items = [];
    var count = 0;
    var subtotal = 0;

    cart.forEach(function (entry) {
      var product = getProduct(entry.id);
      if (!product) return;
      var lineTotal = Number(product.price) * entry.qty;
      items.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image,
        category: product.category,
        categoryLabel: categoryLabel(product.category),
        qty: entry.qty,
        lineTotal: lineTotal
      });
      count += entry.qty;
      subtotal += lineTotal;
    });

    var delivery = subtotal > 0 && subtotal < CONFIG.freeDeliveryThreshold ? CONFIG.deliveryFee : 0;
    return {
      items: items,
      count: count,
      subtotal: subtotal,
      delivery: delivery,
      total: subtotal + delivery,
      freeDeliveryRemaining: Math.max(0, CONFIG.freeDeliveryThreshold - subtotal)
    };
  }

  function addToCart(id, qty, options) {
    var product = getProduct(id);
    if (!product) {
      toast('That product is no longer available.', 'error');
      return false;
    }

    var amount = sanitizeQty(qty || 1);
    var cart = getCart();
    var existing = null;

    for (var i = 0; i < cart.length; i += 1) {
      if (cart[i].id === id) {
        existing = cart[i];
        break;
      }
    }

    if (existing) {
      existing.qty = sanitizeQty(existing.qty + amount);
    } else {
      cart.push({ id: id, qty: amount });
    }

    var saved = saveCart(cart);
    if (saved && !(options && options.silent)) {
      toast(product.name + ' added to your cart.', 'success', 'Added to cart');
    }
    return saved;
  }

  function updateCartQty(id, qty) {
    var cart = getCart();
    var amount = sanitizeQty(qty);
    var found = false;

    cart = cart.map(function (item) {
      if (item.id === id) {
        found = true;
        item.qty = amount;
      }
      return item;
    });

    if (!found) return false;
    return saveCart(cart);
  }

  function removeFromCart(id) {
    var cart = getCart().filter(function (item) {
      return item.id !== id;
    });
    return saveCart(cart);
  }

  function clearCart() {
    var saved = write(KEYS.cart, []);
    if (saved) {
      document.dispatchEvent(new CustomEvent('coco:cart-updated', { detail: { cart: [] } }));
      updateCartBadges();
    }
    return saved;
  }

  function cartCount() {
    return getCart().reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
  }

  function updateCartBadges() {
    var count = cartCount();
    document.querySelectorAll('[data-cart-count]').forEach(function (badge) {
      badge.textContent = String(count);
    });
    document.querySelectorAll('.cart-link').forEach(function (link) {
      link.classList.toggle('has-items', count > 0);
      link.setAttribute(
        'aria-label',
        count > 0 ? 'Shopping cart, ' + count + ' item' + (count === 1 ? '' : 's') : 'Shopping cart, empty'
      );
    });
    document.querySelectorAll('[data-cart-label]').forEach(function (label) {
      label.textContent = count + ' item' + (count === 1 ? '' : 's');
    });
  }

  /* ---------------- Customers & sessions ---------------- */
  function getUsers() {
    var users = read(KEYS.users, []);
    return Array.isArray(users) ? users : [];
  }

  function saveUsers(users) {
    return write(KEYS.users, users);
  }

  function findUserByEmail(email) {
    var normalized = String(email || '').trim().toLowerCase();
    return getUsers().find(function (user) {
      return String(user.email || '').toLowerCase() === normalized;
    });
  }

  function getCurrentUser() {
    var user = read(KEYS.session, null);
    if (!user || !user.email) user = readSession(KEYS.session, null);
    if (!user || !user.email) return null;
    return user;
  }

  function setCurrentUser(user, remember) {
    var payload = {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      createdAt: user.createdAt || new Date().toISOString()
    };
    if (remember === false) {
      remove(KEYS.session);
      writeSession(KEYS.session, payload);
    } else {
      removeSession(KEYS.session);
      write(KEYS.session, payload);
    }
    updateAccountUI();
    return payload;
  }

  function clearCurrentUser() {
    remove(KEYS.session);
    removeSession(KEYS.session);
    updateAccountUI();
  }

  function updateAccountUI() {
    var user = getCurrentUser();
    document.querySelectorAll('[data-account-link]').forEach(function (link) {
      link.setAttribute('href', user ? 'orders.html' : 'login.html');
      link.setAttribute('title', user ? 'View your profile and orders' : 'Sign in to your account');
    });
    document.querySelectorAll('[data-account-label]').forEach(function (label) {
      var firstName = user && user.name ? String(user.name).trim().split(/\s+/)[0] : 'Sign in';
      label.textContent = firstName;
    });
  }

  /* ---------------- Settings & WhatsApp ---------------- */
  function getSettings() {
    var stored = read(KEYS.settings, {});
    if (!stored || typeof stored !== 'object') stored = {};
    return {
      whatsappNumber: String(stored.whatsappNumber || CONFIG.whatsappNumber).replace(/\D/g, ''),
      cafeName: stored.cafeName || CONFIG.brand
    };
  }

  function saveSettings(settings) {
    var next = Object.assign({}, getSettings(), settings);
    next.whatsappNumber = String(next.whatsappNumber || '').replace(/\D/g, '');
    return write(KEYS.settings, next);
  }

  function isWhatsAppPlaceholder() {
    return getSettings().whatsappNumber === CONFIG.whatsappNumber;
  }

  function buildWhatsAppLink(message, number) {
    var phone = String(number || getSettings().whatsappNumber || '').replace(/\D/g, '');
    return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message || '');
  }

  function openWhatsApp(message) {
    var link = buildWhatsAppLink(message);
    var opened = window.open(link, '_blank', 'noopener');
    return opened;
  }

  function whatsAppHref(message) {
    return buildWhatsAppLink(message || 'Hello Coco Lane Cafe! I would like to place an order.');
  }

  /* ---------------- Icons ---------------- */
  var ICONS = {
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.55-1.2L21 8H6"/><circle cx="9.5" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9L12 2.6Z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 12 5 5L20 6"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.2s-.7.8-.9 1c-.2.2-.3.2-.6.1a6.6 6.6 0 0 1-1.9-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.6l.5-.6.2-.4a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.7 11.3 11.3 0 0 0 4.3 3.8c2.5 1 2.5.7 3 .7a2.5 2.5 0 0 0 1.7-1.2 2 2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    coffee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"/><path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16M7 3v2M11 3v2M15 3v2"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>',
    sun: '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5a8.5 8.5 0 1 0 10.8 10.8Z"/></svg>',
    arrowUpRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 3 18 18M10.6 6.2A10.9 10.9 0 0 1 12 6c6.4 0 10 6 10 6a16.6 16.6 0 0 1-3 3.6M6.3 6.3C3.6 8.1 2 12 2 12s3.6 7 10 7a10.8 10.8 0 0 0 4.2-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M15 8l4 4-4 4M19 12H9"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };

  function icon(name) {
    return ICONS[name] || '';
  }

  /* ---------------- Orders & messages ---------------- */
  function getOrders() {
    var orders = read(KEYS.orders, []);
    if (!Array.isArray(orders)) return [];
    return orders
      .filter(function (order) {
        return order && order.id;
      })
      .sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }

  function saveOrders(orders) {
    return write(KEYS.orders, orders);
  }

  function createOrderId() {
    var now = new Date();
    var stamp =
      String(now.getFullYear()).slice(-2) +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    var random = Math.floor(1000 + Math.random() * 9000);
    var id = 'CL-' + stamp + '-' + random;
    var existing = getOrders().some(function (order) {
      return order.id === id;
    });
    return existing ? createOrderId() : id;
  }

  function addOrder(order) {
    var orders = getOrders();
    orders.unshift(order);
    if (!saveOrders(orders)) return false;
    document.dispatchEvent(new CustomEvent('coco:orders-updated'));
    return true;
  }

  function updateOrder(id, changes) {
    var orders = getOrders();
    var found = false;
    orders = orders.map(function (order) {
      if (order.id === id) {
        found = true;
        return Object.assign({}, order, changes);
      }
      return order;
    });
    if (!found) return false;
    return saveOrders(orders);
  }

  function getMessages() {
    var messages = read(KEYS.messages, []);
    if (!Array.isArray(messages)) return [];
    return messages
      .filter(function (message) {
        return message && message.id;
      })
      .sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }

  function saveMessages(messages) {
    return write(KEYS.messages, messages);
  }

  /* ---------------- Validation ---------------- */
  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
  }

  function isPhone(value) {
    var cleaned = String(value || '').replace(/[\s().-]/g, '');
    return /^(?:\+94|94|0)?7\d{8}$/.test(cleaned);
  }

  function normalizePhone(value) {
    return String(value || '').replace(/[^\d+]/g, '');
  }

  function fieldError(input, message) {
    if (!input) return;
    var field = input.closest('.field');
    if (!field) return;
    var error = field.querySelector('.field-error');
    if (message) {
      field.classList.add('has-error');
      input.setAttribute('aria-invalid', 'true');
      if (error) error.textContent = message;
    } else {
      field.classList.remove('has-error');
      input.removeAttribute('aria-invalid');
      if (error) error.textContent = '';
    }
  }

  function clearFieldErrors(scope) {
    if (!scope) return;
    scope.querySelectorAll('.field.has-error').forEach(function (field) {
      field.classList.remove('has-error');
    });
    scope.querySelectorAll('[aria-invalid="true"]').forEach(function (input) {
      input.removeAttribute('aria-invalid');
    });
  }

  function showFormAlert(container, message, type) {
    if (!container) return;
    var variant = type || 'error';
    var iconName = variant === 'success' ? 'check' : variant === 'info' ? 'info' : 'alert';
    container.innerHTML =
      '<div class="form-alert form-alert--' +
      variant +
      '" role="' +
      (variant === 'error' ? 'alert' : 'status') +
      '">' +
      icon(iconName) +
      '<span>' +
      escapeHTML(message) +
      '</span></div>';
  }

  function setLoading(button, loading, loadingText) {
    if (!button) return;
    if (loading) {
      if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
      button.classList.add('is-loading');
      button.disabled = true;
      if (loadingText) button.textContent = loadingText;
    } else {
      button.classList.remove('is-loading');
      button.disabled = false;
      if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
        delete button.dataset.originalHtml;
      }
    }
  }

  /* ---------------- Toasts ---------------- */
  function toast(message, type, title) {
    var stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('role', 'status');
      stack.setAttribute('aria-live', 'polite');
      stack.setAttribute('aria-atomic', 'false');
      document.body.appendChild(stack);
    }

    var variant = type === 'success' || type === 'error' || type === 'info' ? type : 'info';
    var iconName = variant === 'success' ? 'check' : variant === 'error' ? 'alert' : 'info';
    var element = document.createElement('div');
    element.className = 'toast toast--' + variant;

    var iconWrap = document.createElement('div');
    iconWrap.className = 'toast__icon';
    iconWrap.innerHTML = icon(iconName);

    var content = document.createElement('div');
    content.className = 'toast__content';
    if (title) {
      var heading = document.createElement('strong');
      heading.textContent = title;
      content.appendChild(heading);
    }
    var text = document.createElement('span');
    text.textContent = message;
    content.appendChild(text);

    element.appendChild(iconWrap);
    element.appendChild(content);
    stack.appendChild(element);

    var dismiss = function () {
      if (!element.parentNode) return;
      element.classList.add('is-leaving');
      setTimeout(function () {
        if (element.parentNode) element.parentNode.removeChild(element);
      }, 260);
    };

    element.addEventListener('click', dismiss);
    setTimeout(dismiss, 4200);
    return element;
  }

  /* ---------------- Product cards ---------------- */
  function renderStars(rating, reviews) {
    var score = Number(rating) || 0;
    return (
      '<span class="rating" aria-label="Rated ' +
      score.toFixed(1) +
      ' out of 5">' +
      icon('star') +
      score.toFixed(1) +
      (reviews ? ' <span class="text-muted">(' + escapeHTML(reviews) + ')</span>' : '') +
      '</span>'
    );
  }

  function productCardHTML(product, index) {
    var badge = product.badge
      ? '<span class="product-badge' +
        (product.featured ? ' product-badge--gold' : '') +
        '">' +
        escapeHTML(product.badge) +
        '</span>'
      : '';

    return (
      '<article class="product-card reveal" style="--delay:' +
      (Number(index) || 0) * 55 +
      'ms">' +
      '<div class="product-media">' +
      '<a href="product.html?id=' +
      encodeURIComponent(product.id) +
      '" aria-label="View ' +
      escapeHTML(product.name) +
      '">' +
      '<img src="' +
      escapeHTML(product.image) +
      '" alt="' +
      escapeHTML(product.name) +
      '" loading="lazy" decoding="async">' +
      '</a>' +
      (badge ? '<div class="product-badges">' + badge + '</div>' : '') +
      '</div>' +
      '<div class="product-body">' +
      '<span class="product-category">' +
      escapeHTML(categoryLabel(product.category)) +
      '</span>' +
      '<h3 class="product-name"><a href="product.html?id=' +
      encodeURIComponent(product.id) +
      '">' +
      escapeHTML(product.name) +
      '</a></h3>' +
      '<p class="product-desc">' +
      escapeHTML(product.short) +
      '</p>' +
      '<div class="product-foot">' +
      '<div class="product-price"><small>Price</small>' +
      formatLKR(product.price) +
      '</div>' +
      '<div class="product-actions">' +
      '<button class="add-cart-btn" type="button" data-add-to-cart="' +
      escapeHTML(product.id) +
      '" aria-label="Add ' +
      escapeHTML(product.name) +
      ' to cart">' +
      icon('plus') +
      '<span>Add</span>' +
      '</button>' +
      '<a class="details-btn" href="product.html?id=' +
      encodeURIComponent(product.id) +
      '" aria-label="View details for ' +
      escapeHTML(product.name) +
      '" title="View details">' +
      icon('arrowUpRight') +
      '</a>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</article>'
    );
  }

  function renderProductGrid(container, products) {
    if (!container) return;
    if (!products || products.length === 0) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = products
      .map(function (product, index) {
        return productCardHTML(product, index);
      })
      .join('');
    initReveals(container);
  }

  /* ---------------- Reveal animations ---------------- */
  var revealObserver = null;

  function ensureRevealObserver() {
    if (revealObserver || !('IntersectionObserver' in window)) return;
    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
  }

  function initReveals(scope) {
    var root = scope || document;
    var elements = root.querySelectorAll('.reveal:not(.is-visible)');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach(function (element) {
        element.classList.add('is-visible');
      });
      return;
    }

    ensureRevealObserver();
    elements.forEach(function (element) {
      revealObserver.observe(element);
    });
  }

  /* ---------------- Image fallback ---------------- */
  var FALLBACK_IMAGE =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">' +
        '<rect width="900" height="700" fill="#e9dac5"/>' +
        '<circle cx="450" cy="330" r="105" fill="none" stroke="#ad7440" stroke-width="4" opacity=".5"/>' +
        '<path d="M380 300h115v60a57 57 0 0 1-57 57h-1a57 57 0 0 1-57-57v-60Z" fill="none" stroke="#ad7440" stroke-width="5" opacity=".7"/>' +
        '<path d="M495 312h22a24 24 0 0 1 0 48h-22M405 275v-18M435 275v-18M465 275v-18" fill="none" stroke="#ad7440" stroke-width="5" stroke-linecap="round" opacity=".7"/>' +
        '<text x="450" y="500" font-family="Georgia,serif" font-size="30" fill="#6e5a4b" text-anchor="middle" opacity=".8">Coco Lane Cafe</text>' +
        '<text x="450" y="535" font-family="Arial,sans-serif" font-size="16" fill="#8a7463" text-anchor="middle" opacity=".7">Image unavailable</text>' +
        '</svg>'
    );

  function initImageFallbacks() {
    document.addEventListener(
      'error',
      function (event) {
        var image = event.target;
        if (!image || image.tagName !== 'IMG') return;
        if (image.dataset.fallbackApplied === 'true') return;
        image.dataset.fallbackApplied = 'true';
        image.src = FALLBACK_IMAGE;
      },
      true
    );
  }

  /* ---------------- Header & mobile navigation ---------------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.main-nav');
    var overlay = document.querySelector('.nav-overlay');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'nav-overlay';
      document.body.appendChild(overlay);
    }

    if (nav && !nav.querySelector('.main-nav__foot')) {
      var foot = document.createElement('div');
      foot.className = 'main-nav__foot';
      foot.innerHTML =
        '<p><strong>Visit us</strong><br>' +
        escapeHTML(CONFIG.address) +
        '<br>' +
        escapeHTML(CONFIG.openingHours) +
        '</p>' +
        '<a href="contact.html">Get directions &amp; contact details</a>';
      nav.appendChild(foot);
    }

    function closeNav() {
      if (!document.body.classList.contains('nav-open')) return;
      document.body.classList.remove('nav-open');
      overlay.classList.remove('is-visible');
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open navigation menu');
      }
    }

    function openNav() {
      document.body.classList.add('nav-open');
      overlay.classList.add('is-visible');
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Close navigation menu');
      }
    }

    if (toggle && nav) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', 'mainNav');
      toggle.addEventListener('click', function () {
        if (document.body.classList.contains('nav-open')) closeNav();
        else openNav();
      });
    }

    overlay.addEventListener('click', closeNav);

    if (nav) {
      nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeNav);
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) closeNav();
    });

    /* Active navigation state */
    var page = document.body.getAttribute('data-page');
    if (!page) {
      var file = window.location.pathname.split('/').pop() || 'index.html';
      page = file.replace('.html', '') || 'home';
    }
    document.querySelectorAll('[data-nav]').forEach(function (link) {
      var isActive = link.getAttribute('data-nav') === page;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    /* Sticky header shadow */
    if (header) {
      var ticking = false;
      var updateHeader = function () {
        header.classList.toggle('is-scrolled', window.scrollY > 10);
        ticking = false;
      };
      updateHeader();
      window.addEventListener(
        'scroll',
        function () {
          if (!ticking) {
            window.requestAnimationFrame(updateHeader);
            ticking = true;
          }
        },
        { passive: true }
      );
    }

    updateAccountUI();
    updateCartBadges();
  }

  /* ---------------- Global interactions ---------------- */
  function initGlobalActions() {
    /* Add-to-cart buttons (menu, home, product page) */
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-add-to-cart]');
      if (!button) return;
      event.preventDefault();

      var id = button.getAttribute('data-add-to-cart');
      var qty = 1;
      var targetSelector = button.getAttribute('data-qty-target');
      if (targetSelector) {
        var input = document.querySelector(targetSelector);
        if (input) qty = sanitizeQty(input.value);
      } else if (button.getAttribute('data-qty')) {
        qty = sanitizeQty(button.getAttribute('data-qty'));
      }

      if (!addToCart(id, qty)) return;

      if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
      button.classList.add('is-added');
      button.innerHTML = icon('check') + '<span>Added</span>';
      clearTimeout(button._resetTimer);
      button._resetTimer = setTimeout(function () {
        button.classList.remove('is-added');
        if (button.dataset.originalHtml) {
          button.innerHTML = button.dataset.originalHtml;
          delete button.dataset.originalHtml;
        }
      }, 1600);
    });

    /* Quantity steppers */
    document.addEventListener('click', function (event) {
      var step = event.target.closest('[data-qty-step]');
      if (!step) return;
      event.preventDefault();
      var wrap = step.closest('.qty-stepper');
      if (!wrap) return;
      var input = wrap.querySelector('input');
      if (!input) return;

      var delta = parseInt(step.getAttribute('data-qty-step'), 10) || 1;
      var min = parseInt(input.getAttribute('min'), 10) || 1;
      var max = parseInt(input.getAttribute('max'), 10) || 99;
      var next = Math.min(max, Math.max(min, (parseInt(input.value, 10) || min) + delta));
      input.value = String(next);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    /* Inputs: only allow digits in quantity fields */
    document.addEventListener(
      'input',
      function (event) {
        var input = event.target;
        if (input.matches('.qty-stepper input')) {
          input.value = input.value.replace(/\D/g, '').slice(0, 2);
        }
      },
      true
    );

    document.querySelectorAll('[data-year]').forEach(function (element) {
      element.textContent = String(new Date().getFullYear());
    });

    document.querySelectorAll('[data-whatsapp-link]').forEach(function (link) {
      var message =
        link.getAttribute('data-whatsapp-message') ||
        'Hello Coco Lane Cafe! I would like to ask about your menu and ordering.';
      link.setAttribute('href', whatsAppHref(message));
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });

    document.querySelectorAll('[data-phone-link]').forEach(function (link) {
      link.setAttribute('href', 'tel:' + CONFIG.phone.replace(/\s/g, ''));
    });

    document.querySelectorAll('[data-email-link]').forEach(function (link) {
      link.setAttribute('href', 'mailto:' + CONFIG.email);
    });

    initImageFallbacks();
    initReveals(document);
  }

  /* ---------------- Boot ---------------- */
  function init() {
    initHeader();
    initGlobalActions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Expose a small, purposeful API for page scripts. */
  window.CocoLane = {
    CONFIG: CONFIG,
    KEYS: KEYS,
    storage: {
      read: read,
      write: write,
      remove: remove,
      readSession: readSession,
      writeSession: writeSession,
      removeSession: removeSession
    },
    getProducts: getProducts,
    saveProducts: saveProducts,
    resetProducts: resetProducts,
    getProduct: getProduct,
    getCategories: getCategories,
    categoryLabel: categoryLabel,
    getCart: getCart,
    getCartDetails: getCartDetails,
    addToCart: addToCart,
    updateCartQty: updateCartQty,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    cartCount: cartCount,
    updateCartBadges: updateCartBadges,
    getUsers: getUsers,
    saveUsers: saveUsers,
    findUserByEmail: findUserByEmail,
    getCurrentUser: getCurrentUser,
    setCurrentUser: setCurrentUser,
    clearCurrentUser: clearCurrentUser,
    updateAccountUI: updateAccountUI,
    getSettings: getSettings,
    saveSettings: saveSettings,
    isWhatsAppPlaceholder: isWhatsAppPlaceholder,
    buildWhatsAppLink: buildWhatsAppLink,
    openWhatsApp: openWhatsApp,
    whatsAppHref: whatsAppHref,
    getOrders: getOrders,
    saveOrders: saveOrders,
    addOrder: addOrder,
    updateOrder: updateOrder,
    createOrderId: createOrderId,
    getMessages: getMessages,
    saveMessages: saveMessages,
    formatLKR: formatLKR,
    formatDate: formatDate,
    initials: initials,
    escapeHTML: escapeHTML,
    slugify: slugify,
    debounce: debounce,
    queryParam: queryParam,
    icon: icon,
    toast: toast,
    isEmail: isEmail,
    isPhone: isPhone,
    normalizePhone: normalizePhone,
    fieldError: fieldError,
    clearFieldErrors: clearFieldErrors,
    showFormAlert: showFormAlert,
    setLoading: setLoading,
    renderStars: renderStars,
    productCardHTML: productCardHTML,
    renderProductGrid: renderProductGrid,
    initReveals: initReveals,
    sanitizeQty: sanitizeQty
  };
})();
