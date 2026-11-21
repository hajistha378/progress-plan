/* ============================================================
   COCO LANE CAFE — Customer accounts & order history
   Frontend-only authentication. Everything is stored in this browser.
   ============================================================ */

(function () {
  'use strict';

  var lane = window.CocoLane;
  var DEMO_USER = {
    name: 'Amara Silva',
    email: 'demo@cocolanecafe.example',
    phone: '0770000000',
    password: 'demo1234'
  };

  /* ---------------- Password hashing (demo only) ---------------- */
  function fallbackHash(text) {
    var hash = 5381;
    for (var i = 0; i < text.length; i += 1) {
      hash = (hash * 33) ^ text.charCodeAt(i);
    }
    return 'fallback-' + (hash >>> 0).toString(16);
  }

  function hashPassword(password) {
    var salted = 'cocoLaneDemo::' + password;
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      return window.crypto.subtle
        .digest('SHA-256', new TextEncoder().encode(salted))
        .then(function (buffer) {
          return Array.prototype.map
            .call(new Uint8Array(buffer), function (byte) {
              return byte.toString(16).padStart(2, '0');
            })
            .join('');
        })
        .catch(function () {
          return fallbackHash(salted);
        });
    }
    return Promise.resolve(fallbackHash(salted));
  }

  function ensureDemoUser() {
    var users = lane.getUsers();
    var exists = users.some(function (user) {
      return String(user.email).toLowerCase() === DEMO_USER.email;
    });
    if (exists) return Promise.resolve();

    return hashPassword(DEMO_USER.password).then(function (hash) {
      var current = lane.getUsers();
      var found = current.some(function (user) {
        return String(user.email).toLowerCase() === DEMO_USER.email;
      });
      if (found) return;
      current.push({
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        phone: DEMO_USER.phone,
        passwordHash: hash,
        createdAt: new Date().toISOString(),
        demo: true
      });
      lane.saveUsers(current);
    });
  }

  /* ---------------- Shared helpers ---------------- */
  function togglePassword(button, input) {
    if (!button || !input) return;
    button.addEventListener('click', function () {
      var showing = input.getAttribute('type') === 'text';
      input.setAttribute('type', showing ? 'password' : 'text');
      button.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      button.setAttribute('title', showing ? 'Show password' : 'Hide password');
      button.innerHTML = showing ? lane.icon('eye') : lane.icon('eyeOff');
    });
  }

  function redirectTarget() {
    var next = lane.queryParam('next');
    if (next && /^[a-z0-9-]+\.html$/i.test(next)) return next;
    return 'orders.html';
  }

  /* ---------------- Login ---------------- */
  function initLogin() {
    var form = document.getElementById('loginForm');
    if (!form) return;

    var alertBox = document.getElementById('loginAlert');
    var email = document.getElementById('loginEmail');
    var password = document.getElementById('loginPassword');
    var remember = document.getElementById('loginRemember');
    var submit = document.getElementById('loginSubmit');

    togglePassword(document.getElementById('loginTogglePassword'), password);

    var registerLink = document.getElementById('loginRegisterLink');
    if (registerLink) {
      registerLink.setAttribute('href', 'register.html?next=' + encodeURIComponent(redirectTarget()));
    }

    ensureDemoUser();

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      lane.clearFieldErrors(form);
      if (alertBox) alertBox.innerHTML = '';

      var valid = true;
      var emailValue = email.value.trim();

      if (!emailValue) {
        lane.fieldError(email, 'Please enter your email address.');
        valid = false;
      } else if (!lane.isEmail(emailValue)) {
        lane.fieldError(email, 'That does not look like a valid email address.');
        valid = false;
      }

      if (!password.value) {
        lane.fieldError(password, 'Please enter your password.');
        valid = false;
      }

      if (!valid) {
        lane.showFormAlert(alertBox, 'Please check the highlighted fields and try again.', 'error');
        return;
      }

      var user = lane.findUserByEmail(emailValue);
      if (!user && emailValue.toLowerCase() !== DEMO_USER.email) {
        lane.showFormAlert(
          alertBox,
          'No account found for that email. Try the sample account shown below, or create a new account.',
          'error'
        );
        return;
      }

      lane.setLoading(submit, true, 'Signing in…');

      ensureDemoUser()
        .then(function () {
          var account = lane.findUserByEmail(emailValue);
          if (!account) {
            lane.showFormAlert(alertBox, 'No account found for that email. Please create an account first.', 'error');
            return null;
          }
          return hashPassword(password.value).then(function (hash) {
            if (hash !== account.passwordHash) {
              lane.showFormAlert(alertBox, 'That password does not match this account. Please try again.', 'error');
              return null;
            }

            lane.setCurrentUser(account, remember ? remember.checked : true);
            lane.showFormAlert(
              alertBox,
              'Welcome back, ' + account.name.split(' ')[0] + '. Taking you to your orders…',
              'success'
            );
            lane.toast('Signed in as ' + account.email, 'success', 'Welcome back');
            window.setTimeout(function () {
              window.location.href = redirectTarget();
            }, 650);
            return null;
          });
        })
        .finally(function () {
          lane.setLoading(submit, false);
        });
    });
  }

  /* ---------------- Register ---------------- */
  function initRegister() {
    var form = document.getElementById('registerForm');
    if (!form) return;

    var alertBox = document.getElementById('registerAlert');
    var name = document.getElementById('registerName');
    var email = document.getElementById('registerEmail');
    var phone = document.getElementById('registerPhone');
    var password = document.getElementById('registerPassword');
    var confirm = document.getElementById('registerConfirm');
    var terms = document.getElementById('registerTerms');
    var termsError = document.getElementById('registerTermsError');
    var submit = document.getElementById('registerSubmit');
    var strength = document.getElementById('passwordStrength');
    var strengthLabel = document.getElementById('passwordStrengthLabel');

    togglePassword(document.getElementById('registerTogglePassword'), password);

    var loginLink = document.getElementById('registerLoginLink');
    if (loginLink) {
      loginLink.setAttribute('href', 'login.html?next=' + encodeURIComponent(redirectTarget()));
    }

    ensureDemoUser();

    function score(value) {
      var points = 0;
      if (value.length >= 6) points += 1;
      if (value.length >= 10) points += 1;
      if (/[A-Z]/.test(value) && /[a-z]/.test(value)) points += 1;
      if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) points += 1;
      return Math.min(4, points);
    }

    function updateStrength() {
      var value = password.value;
      var level = value ? score(value) : 0;
      var labels = ['Add a password', 'Weak', 'Fair', 'Good', 'Strong'];
      if (strength) strength.setAttribute('data-strength', String(level));
      if (strengthLabel) strengthLabel.textContent = labels[level];
    }

    password.addEventListener('input', updateStrength);
    updateStrength();

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      lane.clearFieldErrors(form);
      if (alertBox) alertBox.innerHTML = '';
      if (termsError) termsError.textContent = '';

      var valid = true;
      var nameValue = name.value.trim();
      var emailValue = email.value.trim();
      var phoneValue = phone.value.trim();

      if (nameValue.length < 2) {
        lane.fieldError(name, 'Please enter your full name.');
        valid = false;
      }

      if (!emailValue) {
        lane.fieldError(email, 'Please enter your email address.');
        valid = false;
      } else if (!lane.isEmail(emailValue)) {
        lane.fieldError(email, 'That does not look like a valid email address.');
        valid = false;
      } else if (lane.findUserByEmail(emailValue)) {
        lane.fieldError(email, 'An account with this email already exists. Try signing in instead.');
        valid = false;
      }

      if (!phoneValue) {
        lane.fieldError(phone, 'Please enter your mobile number.');
        valid = false;
      } else if (!lane.isPhone(phoneValue)) {
        lane.fieldError(phone, 'Enter a Sri Lankan mobile number, e.g. 077 123 4567.');
        valid = false;
      }

      if (password.value.length < 6) {
        lane.fieldError(password, 'Use at least 6 characters.');
        valid = false;
      }

      if (confirm.value !== password.value || !confirm.value) {
        lane.fieldError(confirm, 'The two passwords do not match.');
        valid = false;
      }

      if (!terms.checked) {
        if (termsError) {
          termsError.textContent = 'Please tick the box to continue.';
          termsError.style.display = 'block';
        }
        valid = false;
      } else if (termsError) {
        termsError.style.display = 'none';
      }

      if (!valid) {
        lane.showFormAlert(alertBox, 'Please check the highlighted fields and try again.', 'error');
        return;
      }

      lane.setLoading(submit, true, 'Creating account…');

      hashPassword(password.value)
        .then(function (hash) {
          var users = lane.getUsers();
          if (users.some(function (user) { return String(user.email).toLowerCase() === emailValue.toLowerCase(); })) {
            lane.showFormAlert(alertBox, 'An account with this email already exists. Please sign in instead.', 'error');
            return;
          }

          var user = {
            name: nameValue,
            email: emailValue,
            phone: lane.normalizePhone(phoneValue),
            passwordHash: hash,
            createdAt: new Date().toISOString()
          };

          users.push(user);
          if (!lane.saveUsers(users)) {
            lane.showFormAlert(alertBox, 'Your browser could not save the account. Storage may be blocked or full.', 'error');
            return;
          }

          lane.setCurrentUser(user, true);
          lane.toast('Account created. Welcome to Coco Lane!', 'success', 'You are in');
          window.setTimeout(function () {
            window.location.href = redirectTarget();
          }, 700);
        })
        .finally(function () {
          lane.setLoading(submit, false);
        });
    });
  }

  /* ---------------- Orders / profile ---------------- */
  function statusChip(status) {
    var value = String(status || 'Pending');
    var key = value.toLowerCase().replace(/\s+/g, '-');
    return '<span class="status-chip status-chip--' + lane.escapeHTML(key) + '">' + lane.escapeHTML(value) + '</span>';
  }

  function orderProgress(status) {
    var steps = ['Pending', 'Confirmed', 'Preparing', 'Completed'];
    var index = steps.indexOf(String(status || 'Pending'));
    if (index === -1) index = 0;
    return (
      '<div class="order-timeline" aria-hidden="true">' +
      steps
        .map(function (step, position) {
          return '<span class="' + (position <= index ? 'is-done' : '') + '"></span>';
        })
        .join('') +
      '</div>'
    );
  }

  function orderCardHTML(order) {
    var items = Array.isArray(order.items) ? order.items : [];
    var thumbs = items
      .slice(0, 4)
      .map(function (item) {
        var product = lane.getProduct(item.id);
        var image = item.image || (product ? product.image : '');
        var name = item.name || (product ? product.name : 'Item');
        return image
          ? '<img src="' + lane.escapeHTML(image) + '" alt="' + lane.escapeHTML(name) + '" loading="lazy">'
          : '';
      })
      .join('');
    if (items.length > 4) {
      thumbs += '<span>+' + (items.length - 4) + '</span>';
    }

    var itemsMini = items
      .map(function (item) {
        return lane.escapeHTML(item.name) + ' × ' + Number(item.qty || 1);
      })
      .join(' · ');

    var itemRows = items
      .map(function (item) {
        return (
          '<li><span>' +
          lane.escapeHTML(item.name) +
          ' × ' +
          Number(item.qty || 1) +
          '</span><span>' +
          lane.formatLKR(Number(item.price || 0) * Number(item.qty || 1)) +
          '</span></li>'
        );
      })
      .join('');

    var deliveryLine =
      order.fulfilment === 'pickup'
        ? 'Pickup from the cafe'
        : 'Delivery to ' +
          lane.escapeHTML(order.address || '—') +
          (order.city ? ', ' + lane.escapeHTML(order.city) : '');

    return (
      '<article class="order-card" data-order-id="' +
      lane.escapeHTML(order.id) +
      '">' +
      '<div class="order-card__head">' +
      '<div class="order-card__id">' +
      '<strong>Order ' +
      lane.escapeHTML(order.id) +
      '</strong>' +
      '<span>' +
      lane.formatDate(order.createdAt, true) +
      ' · ' +
      items.length +
      ' item' +
      (items.length === 1 ? '' : 's') +
      '</span>' +
      '</div>' +
      statusChip(order.status) +
      '</div>' +
      '<div class="order-card__body">' +
      (thumbs ? '<div class="order-thumbs">' + thumbs + '</div>' : '') +
      '<p class="order-items-mini">' +
      lane.escapeHTML(itemsMini) +
      '</p>' +
      orderProgress(order.status) +
      '<div class="order-card__foot">' +
      '<span class="order-total">Total <strong>' +
      lane.formatLKR(order.total) +
      '</strong></span>' +
      '<div class="order-card__actions" style="display:flex;gap:7px;flex-wrap:wrap">' +
      '<button class="btn btn--sm btn--outline" type="button" data-reorder="' +
      lane.escapeHTML(order.id) +
      '">Order again</button>' +
      '<a class="btn btn--sm btn--ghost" href="contact.html">Need help?</a>' +
      '</div>' +
      '</div>' +
      '<details class="order-details">' +
      '<summary>View order details</summary>' +
      '<div class="order-details__inner">' +
      '<h4>Items</h4>' +
      '<ul>' +
      itemRows +
      '</ul>' +
      '<h4>Delivery</h4>' +
      '<p>' +
      deliveryLine +
      '<br>' +
      (order.notes ? '<em>Notes: ' + lane.escapeHTML(order.notes) + '</em><br>' : '') +
      'Payment: ' +
      lane.escapeHTML(order.payment || 'Cash on delivery / pickup') +
      '<br>Subtotal ' +
      lane.formatLKR(order.subtotal) +
      ' · Delivery ' +
      (Number(order.delivery) === 0 ? 'free' : lane.formatLKR(order.delivery)) +
      '</p>' +
      '<h4>Contact</h4>' +
      '<p>' +
      lane.escapeHTML(order.name) +
      ' · ' +
      lane.escapeHTML(order.phone) +
      (order.email ? ' · ' + lane.escapeHTML(order.email) : '') +
      '</p>' +
      '</div>' +
      '</details>' +
      '</div>' +
      '</article>'
    );
  }

  function loginRequiredHTML() {
    return (
      '<div class="login-required">' +
      '<div class="login-required__content">' +
      '<span class="eyebrow">Your account</span>' +
      '<h1>Sign in to see your coffee trail.</h1>' +
      '<p>Your order history and saved details live in this browser. Sign in to pick up where you left off — or create an account in less than a minute.</p>' +
      '<div class="login-required__actions">' +
      '<a class="btn btn--lg" href="login.html?next=orders.html">Sign in</a>' +
      '<a class="btn btn--outline btn--lg" href="register.html?next=orders.html">Create an account</a>' +
      '</div>' +
      '<div class="form-alert form-alert--info mt-3">' +
      lane.icon('info') +
      '<span><strong>Local data:</strong> accounts are stored only in this browser and are not protected like a real service.</span>' +
      '</div>' +
      '</div>' +
      '<div class="login-required__media">' +
      '<img src="images/contact-cafe.jpg" alt="Quiet tables at Coco Lane Cafe" loading="lazy">' +
      '</div>' +
      '</div>'
    );
  }

  function renderOrders() {
    var root = document.getElementById('ordersRoot');
    if (!root) return;

    var user = lane.getCurrentUser();
    if (!user) {
      root.innerHTML = loginRequiredHTML();
      return;
    }

    var allOrders = lane.getOrders();
    var email = String(user.email).toLowerCase();
    var orders = allOrders.filter(function (order) {
      return String(order.email || order.userEmail || '').toLowerCase() === email;
    });

    var spent = orders.reduce(function (sum, order) {
      return sum + Number(order.total || 0);
    }, 0);

    var counts = {};
    orders.forEach(function (order) {
      (order.items || []).forEach(function (item) {
        counts[item.name] = (counts[item.name] || 0) + Number(item.qty || 1);
      });
    });
    var favourite = Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a];
    })[0];

    var ordersHTML = orders.length
      ? '<div class="orders-list">' + orders.map(orderCardHTML).join('') + '</div>'
      : '<div class="empty-state">' +
        '<span class="empty-state__icon" aria-hidden="true">' + lane.icon('coffee') + '</span>' +
        '<h2>No orders here yet.</h2>' +
        '<p>Your first coffee is waiting. Add something to your cart and your order will appear here after checkout.</p>' +
        '<a class="btn btn--lg" href="menu.html">Browse the menu</a>' +
        '</div>';

    root.innerHTML =
      '<div class="profile-card">' +
      '<div class="profile-main">' +
      '<span class="avatar avatar--lg" aria-hidden="true">' +
      lane.escapeHTML(lane.initials(user.name)) +
      '</span>' +
      '<div>' +
      '<h2>Hello, ' +
      lane.escapeHTML(String(user.name).split(' ')[0]) +
      '.</h2>' +
      '<p>' +
      lane.escapeHTML(user.email) +
      (user.phone ? ' · ' + lane.escapeHTML(user.phone) : '') +
      '</p>' +
      '</div>' +
      '</div>' +
      '<div class="profile-stats">' +
      '<div><strong>' + orders.length + '</strong><span>Orders</span></div>' +
      '<div><strong>' + lane.formatLKR(spent) + '</strong><span>Total spent</span></div>' +
      '<div><strong>' + (favourite ? lane.escapeHTML(favourite) : '—') + '</strong><span>Favourite</span></div>' +
      '</div>' +
      '<div class="profile-actions">' +
      '<button class="btn btn--sm btn--outline" type="button" id="editProfileBtn">Edit profile</button>' +
      '<button class="btn btn--sm btn--ghost" type="button" id="logoutBtn">' +
      lane.icon('logout') +
      'Sign out</button>' +
      '</div>' +
      '</div>' +

      '<div class="orders-layout">' +
      '<div>' +
      '<div class="section-head" style="margin-bottom:22px">' +
      '<div><span class="eyebrow">Order history</span><h2 class="section-title" style="font-size:1.9rem">Everything you have ordered.</h2></div>' +
      '<a class="btn btn--outline btn--sm" href="menu.html">Order something new</a>' +
      '</div>' +
      ordersHTML +
      '</div>' +
      '<aside class="orders-side">' +
      '<div class="side-card side-card--accent">' +
      '<h3>Keep it local</h3>' +
      '<p>These orders are saved in this browser only. Clearing browser data will remove them.</p>' +
      '</div>' +
      '<div class="side-card">' +
      '<h3>Your details</h3>' +
      '<form class="profile-form" id="profileForm">' +
      '<div class="field"><label class="field-label" for="profileName">Name</label>' +
      '<input class="input" type="text" id="profileName" value="' + lane.escapeHTML(user.name) + '" required>' +
      '<span class="field-error" role="alert"></span></div>' +
      '<div class="field"><label class="field-label" for="profilePhone">Mobile</label>' +
      '<input class="input" type="tel" id="profilePhone" value="' + lane.escapeHTML(user.phone || '') + '" placeholder="07X XXX XXXX">' +
      '<span class="field-error" role="alert"></span></div>' +
      '<div class="field"><label class="field-label" for="profileEmail">Email</label>' +
      '<input class="input" type="email" id="profileEmail" value="' + lane.escapeHTML(user.email) + '" readonly>' +
      '</div>' +
      '<button class="btn btn--sm" type="submit" id="saveProfileBtn">Save changes</button>' +
      '</form>' +
      '</div>' +
      '<div class="side-card">' +
      '<h3>Something wrong?</h3>' +
      '<p>If an order looks incorrect, message the cafe on WhatsApp and quote your order number.</p>' +
      '<a class="btn btn--sm btn--ghost" href="contact.html">Contact the cafe</a>' +
      '</div>' +
      '</aside>' +
      '</div>';

    lane.initReveals(root);
    bindOrders(root, user);
  }

  function bindOrders(root, user) {
    var logout = document.getElementById('logoutBtn');
    if (logout) {
      logout.addEventListener('click', function () {
        lane.clearCurrentUser();
        lane.toast('You have been signed out.', 'info', 'Signed out');
        renderOrders();
      });
    }

    var profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', function (event) {
        event.preventDefault();
        lane.clearFieldErrors(profileForm);

        var nameInput = document.getElementById('profileName');
        var phoneInput = document.getElementById('profilePhone');
        var valid = true;

        if (nameInput.value.trim().length < 2) {
          lane.fieldError(nameInput, 'Please enter your name.');
          valid = false;
        }
        if (phoneInput.value.trim() && !lane.isPhone(phoneInput.value)) {
          lane.fieldError(phoneInput, 'Enter a Sri Lankan mobile number.');
          valid = false;
        }
        if (!valid) return;

        var users = lane.getUsers();
        users = users.map(function (item) {
          if (String(item.email).toLowerCase() !== String(user.email).toLowerCase()) return item;
          return Object.assign({}, item, {
            name: nameInput.value.trim(),
            phone: lane.normalizePhone(phoneInput.value)
          });
        });

        if (!lane.saveUsers(users)) {
          lane.toast('Could not save your profile in this browser.', 'error');
          return;
        }

        var updated = lane.findUserByEmail(user.email);
        lane.setCurrentUser(updated, true);
        lane.toast('Profile updated.', 'success', 'Saved');
        renderOrders();
      });
    }

    var edit = document.getElementById('editProfileBtn');
    if (edit) {
      edit.addEventListener('click', function () {
        var form = document.getElementById('profileForm');
        if (form) {
          form.scrollIntoView({ behavior: 'smooth', block: 'center' });
          var input = document.getElementById('profileName');
          if (input) input.focus({ preventScroll: true });
        }
      });
    }

    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-reorder]');
      if (!button) return;
      var id = button.getAttribute('data-reorder');
      var order = lane.getOrders().find(function (item) {
        return item.id === id;
      });
      if (!order) return;

      var added = 0;
      (order.items || []).forEach(function (item) {
        if (lane.addToCart(item.id, item.qty || 1, { silent: true })) added += 1;
      });

      if (added === 0) {
        lane.toast('Those items are no longer on the menu.', 'error');
        return;
      }
      lane.toast('Added ' + added + ' item' + (added === 1 ? '' : 's') + ' back to your cart.', 'success', 'Ready to reorder');
    });
  }

  /* ---------------- Boot ---------------- */
  function init() {
    initLogin();
    initRegister();
    renderOrders();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
