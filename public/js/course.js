/// This will help to higlights a review when the page is opned with a link
/// used by the link to this review links 
(function () {
    function showHiglight(){
        var banner = document.getElementById('highlight-banner');
        var match = location.hash.match(/^#highlight=(.+)$/);
        document.querySelectorAll('.review.highlighted').forEach(function (el) {
            el.classList. remove('highlighted');
        });
        if (!match) {banner.hidden = true; return; }

        var id = decodeURIComponent(match[1]);
        banner.textContent = 'Showing review #' + id;
        banner.hidden = false;

        var target = document.getElementById('review-' + id);
        if (target) {
            target.classList.add('highlighted');
            target.scrollIntoView({ block: 'center'});
        }
    }
    window.addEventListener('hashchange', showHiglight);
    showHiglight();
})();