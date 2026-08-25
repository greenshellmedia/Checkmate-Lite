(function () {
    var base = 'https://cdn.jsdelivr.net/npm/primeng@17.18.15/resources/themes/';
    var link = document.createElement('link');
    var media = window.matchMedia('(prefers-color-scheme: dark)');
    link.id = 'pf-theme';
    link.rel = 'stylesheet';
    function apply(dark) {
        link.href = base + (dark ? 'md-dark-indigo' : 'md-light-indigo') + '/theme.css';
        document.documentElement.dataset.theme = dark ? 'dark' : 'light';
        document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    }
    apply(media.matches);
    document.head.appendChild(link);
    if (media.addEventListener) media.addEventListener('change', function (event) { apply(event.matches); });
})();
