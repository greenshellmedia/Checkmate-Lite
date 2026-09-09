(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CheckmateMoreAttribution = api;
  if (root.document && root.location) api.start(root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STORAGE_KEY = 'cmp:attribution';
  var FIXED_KEYS = new Set(['ref', 'affiliate', 'sub_id']);

  function isAttributionKey(key) {
    var normalised = String(key || '').toLowerCase();
    return FIXED_KEYS.has(normalised) || normalised.indexOf('utm_') === 0;
  }

  function collect(search) {
    var result = {};
    new URLSearchParams(search || '').forEach(function (value, key) {
      if (isAttributionKey(key)) result[key.toLowerCase()] = value;
    });
    return result;
  }

  function readStored(storage) {
    try {
      var value = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
  }

  function remember(storage, current) {
    var merged = Object.assign({}, readStored(storage), current);
    try { storage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch (_) {}
    return merged;
  }

  function decorateHref(href, attribution, baseUrl) {
    var url;
    try { url = new URL(href, baseUrl); } catch (_) { return href; }
    if (url.hostname.toLowerCase() !== 'app.checkmatemore.com') return href;
    Object.keys(attribution).forEach(function (key) {
      if (isAttributionKey(key) && !url.searchParams.has(key)) url.searchParams.set(key, attribution[key]);
    });
    return url.href;
  }

  function decorateLinks(scope, attribution, baseUrl) {
    var links = [];
    if (scope && scope.matches && scope.matches('a[href]')) links.push(scope);
    if (scope && scope.querySelectorAll) links = links.concat(Array.from(scope.querySelectorAll('a[href]')));
    links.forEach(function (link) {
      var decorated = decorateHref(link.getAttribute('href'), attribution, baseUrl);
      if (decorated !== link.getAttribute('href')) link.setAttribute('href', decorated);
    });
  }

  function start(win) {
    var current = collect(win.location.search);
    var storage;
    try { storage = win.sessionStorage; } catch (_) {
      storage = { getItem: function () { return null; }, setItem: function () {} };
    }
    var attribution = remember(storage, current);
    function apply(scope) { decorateLinks(scope || win.document, attribution, win.location.href); }
    if (win.document.readyState === 'loading') win.document.addEventListener('DOMContentLoaded', function () { apply(); }, { once: true });
    else apply();
    win.document.addEventListener('click', function (event) {
      var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
      if (link) decorateLinks(link, attribution, win.location.href);
    }, true);
    var observer = new win.MutationObserver(function (records) {
      records.forEach(function (record) { record.addedNodes.forEach(function (node) { if (node.nodeType === 1) apply(node); }); });
    });
    observer.observe(win.document.documentElement, { childList: true, subtree: true });
    return { attribution: attribution, observer: observer };
  }

  return { STORAGE_KEY: STORAGE_KEY, isAttributionKey: isAttributionKey, collect: collect, decorateHref: decorateHref, start: start };
});
