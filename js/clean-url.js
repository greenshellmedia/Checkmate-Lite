/**
 * Keep the address bar free of …/index.html on http(s) hosts
 * (GitHub Pages, local static servers). Skips file:// so relative
 * asset paths stay valid when opening HTML directly from disk.
 */
(function cleanPrettyUrl() {
    try {
        if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
        var path = location.pathname || '';
        if (!/\/index\.html$/i.test(path)) return;
        var clean = path.replace(/\/index\.html$/i, '/');
        if (!clean) clean = '/';
        history.replaceState(null, '', clean + location.search + location.hash);
    } catch (_) { /* ignore */ }
})();
