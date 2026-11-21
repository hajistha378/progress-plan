/* ============================================================
   COCO LANE CAFE — Theme controller
   Persists the customer's light/dark preference in LocalStorage.
   ============================================================ */

(function () {
  'use strict';

  var KEY = 'cocoLaneTheme';
  var root = document.documentElement;

  function readTheme() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (error) {
      /* Storage may be blocked; fall back to system preference. */
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function applyTheme(theme, persist) {
    var next = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    root.style.colorScheme = next;

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'dark' ? '#100c09' : '#f8f1e6');

    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      var isDark = next === 'dark';
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
      button.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    });

    if (persist) {
      try {
        localStorage.setItem(KEY, next);
      } catch (error) {
        /* LocalStorage may be unavailable; the theme still applies for this visit. */
      }
    }

    document.dispatchEvent(
      new CustomEvent('coco:theme-changed', { detail: { theme: next } })
    );
  }

  function toggleTheme() {
    var current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark', true);
  }

  function init() {
    applyTheme(root.getAttribute('data-theme') || readTheme(), false);

    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      button.addEventListener('click', toggleTheme);
    });

    if (window.matchMedia) {
      var query = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function (event) {
        var saved = null;
        try {
          saved = localStorage.getItem(KEY);
        } catch (error) {
          saved = null;
        }
        if (!saved) applyTheme(event.matches ? 'dark' : 'light', false);
      };
      if (query.addEventListener) query.addEventListener('change', onChange);
      else if (query.addListener) query.addListener(onChange);
    }
  }

  window.CocoLaneTheme = {
    apply: applyTheme,
    toggle: toggleTheme,
    current: function () {
      return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
