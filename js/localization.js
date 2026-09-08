(function () {
  'use strict';
  var STORAGE_KEY = 'cmp:locale';
  var SOURCE = 'en-GB';
  var LOCALES = [
    ['en-GB', 'English'], ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'],
    ['pt-BR', 'Português (Brasil)'], ['it', 'Italiano'], ['nl', 'Nederlands'],
    ['pl', 'Polski'], ['uk', 'Українська'], ['ru', 'Русский']
  ];
  var script = document.currentScript;
  var root = new URL('../', script.src);
  var originalText = new WeakMap();
  var originalAttrs = new WeakMap();
  var observer;
  var activeMap = new Map();
  var reverseMap = new Map();
  var activePatterns = [];

  function normalize(value) {
    var candidate = String(value || '').trim().replace('_', '-').toLowerCase();
    var exact = LOCALES.find(function (item) { return item[0].toLowerCase() === candidate; });
    if (exact) return exact[0];
    var language = candidate.split('-')[0];
    var partial = LOCALES.find(function (item) { return item[0].toLowerCase().split('-')[0] === language; });
    return partial ? partial[0] : SOURCE;
  }
  function initialLocale() {
    try { if (localStorage.getItem(STORAGE_KEY)) return normalize(localStorage.getItem(STORAGE_KEY)); } catch (_) {}
    if (document.documentElement.dataset.cmpLocaleDefault) return normalize(document.documentElement.dataset.cmpLocaleDefault);
    return normalize((navigator.languages && navigator.languages[0]) || navigator.language);
  }
  var locale = initialLocale();
  document.documentElement.lang = locale;
  document.documentElement.classList.add('cmp-i18n-loading');

  function rememberAttr(element, name) {
    var attrs = originalAttrs.get(element) || {};
    if (!(name in attrs)) attrs[name] = reverseMap.get(element.getAttribute(name)) || element.getAttribute(name);
    originalAttrs.set(element, attrs);
    return attrs[name];
  }
  function translateValue(value) {
    var trimmed = String(value || '').trim();
    if (!trimmed) return value;
    var translated = activeMap.get(trimmed);
    if (!translated) {
      for (var i = 0; i < activePatterns.length; i++) {
        var match = trimmed.match(activePatterns[i].regex);
        if (match) {
          translated = activePatterns[i].translation.replace(/\{(\d+)\}/g, function (_, index) { return match[Number(index) + 1] || ''; });
          break;
        }
      }
    }
    if (!translated) return value;
    return String(value).replace(trimmed, translated);
  }
  function translateTree(scope) {
    if (!scope || (scope.nodeType === 1 && scope.closest('[data-no-translate]'))) return;
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        return node.parentElement && !node.parentElement.closest('script,style,code,pre,[data-no-translate]') && node.nodeValue.trim()
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (!originalText.has(node)) {
        var trimmed = node.nodeValue.trim();
        originalText.set(node, trimmed && reverseMap.has(trimmed) ? node.nodeValue.replace(trimmed, reverseMap.get(trimmed)) : node.nodeValue);
      }
      node.nodeValue = translateValue(originalText.get(node));
    });
    var elements = scope.nodeType === 1 ? [scope].concat(Array.from(scope.querySelectorAll('*'))) : Array.from(document.querySelectorAll('*'));
    elements.forEach(function (element) {
      ['title', 'aria-label', 'placeholder', 'alt'].forEach(function (name) {
        if (element.hasAttribute(name)) element.setAttribute(name, translateValue(rememberAttr(element, name)));
      });
    });
    if (!document.documentElement.dataset.cmpOriginalTitle) document.documentElement.dataset.cmpOriginalTitle = reverseMap.get(document.title) || document.title;
    document.title = translateValue(document.documentElement.dataset.cmpOriginalTitle);
    document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"]').forEach(function (meta) {
      meta.content = translateValue(rememberAttr(meta, 'content'));
    });
  }
  function injectSelector() {
    if (document.querySelector('[data-cmp-locale]')) return;
    var hosts = Array.from(document.querySelectorAll('.cm-nav, .cm-nav-compact, .seo-links, .app-topnav-links'));
    hosts.forEach(function (host) {
      var wrapper = document.createElement('label');
      wrapper.className = 'cmp-locale-picker';
      wrapper.setAttribute('data-no-translate', '');
      wrapper.title = 'Language';
      wrapper.innerHTML = '<span class="pi pi-globe" aria-hidden="true"></span><span class="cmp-sr-only">Language</span>' +
        '<select data-cmp-locale aria-label="Language">' + LOCALES.map(function (item) { return '<option value="' + item[0] + '">' + item[1] + '</option>'; }).join('') + '</select>';
      wrapper.querySelector('select').value = locale;
      wrapper.querySelector('select').addEventListener('change', function (event) { setLocale(event.target.value); });
      host.prepend(wrapper);
    });
  }
  async function loadJson(url) {
    var response = await fetch(url);
    if (!response.ok) throw new Error('Could not load ' + url);
    return response.json();
  }
  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      var element = document.createElement('script');
      element.src = url;
      element.onload = resolve;
      element.onerror = reject;
      document.head.appendChild(element);
    });
  }
  async function loadCatalogue(localeCode) {
    var isSource = localeCode === SOURCE;
    var globalValue = isSource ? window.__CMP_SOURCE_CATALOGUE__ : window.__CMP_LOCALE_CATALOGUES__ && window.__CMP_LOCALE_CATALOGUES__[localeCode];
    if (globalValue) return globalValue;
    var stem = isSource ? 'localization/source-catalogue' : 'localization/locales/' + localeCode;
    try { return await loadJson(new URL(stem + '.json', root)); }
    catch (_) {
      await loadScript(new URL(stem + '.js', root));
      return isSource ? window.__CMP_SOURCE_CATALOGUE__ : window.__CMP_LOCALE_CATALOGUES__[localeCode];
    }
  }
  async function setLocale(value) {
    locale = normalize(value);
    document.documentElement.lang = locale;
    try { localStorage.setItem(STORAGE_KEY, locale); } catch (_) {}
    var source = await loadCatalogue(SOURCE);
    var translations = locale === SOURCE ? {} : await loadCatalogue(locale).catch(function () { return {}; });
    activeMap = new Map(Object.keys(source).map(function (id) { return [source[id], translations[id] || source[id]]; }));
    reverseMap = new Map(Object.keys(source).filter(function (id) { return translations[id]; }).map(function (id) { return [translations[id], source[id]]; }));
    activePatterns = Object.keys(source).filter(function (id) { return /\{\d+\}/.test(source[id]) && translations[id]; }).map(function (id) {
      var escaped = source[id].replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{\d+\\\}/g, '(.+?)');
      return { regex: new RegExp('^' + escaped + '$'), translation: translations[id] };
    });
    if (observer) observer.disconnect();
    translateTree(document.body);
    if (observer) observer.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll('[data-cmp-locale]').forEach(function (select) { select.value = locale; });
    document.documentElement.classList.remove('cmp-i18n-loading');
    document.dispatchEvent(new CustomEvent('cmp:localechange', { detail: { locale: locale } }));
  }
  function ready() {
    injectSelector();
    observer = new MutationObserver(function (records) {
      records.forEach(function (record) { record.addedNodes.forEach(function (node) { if (node.nodeType === 1) translateTree(node); }); });
    });
    setLocale(locale).catch(function (error) {
      console.warn('[CheckmateMore localisation]', error.message);
      document.documentElement.classList.remove('cmp-i18n-loading');
    });
  }
  window.CheckmateMoreI18n = { normalizeLocale: normalize, setLocale: setLocale, getLocale: function () { return locale; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
})();
