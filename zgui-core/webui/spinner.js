// zgui-core/spinner.js — the loading spinner, ported from Audio-Haxor (the `.spinner` ring +
// the `.loading-state` centered block used for tab/panel loads). Builds native elements wearing
// the ported `spinner.css` classes. window.ZGui.spinner.
//
//   ZGui.spinner({ size })                 -> <span class="spinner">   (the two-colour ring)
//   ZGui.spinner.loadingState(label)       -> <div class="loading-state"> spinner + label  (the
//        centered block Audio-Haxor drops into a panel/tab while it loads)
(function () {
    "use strict";

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }

    function spinner(opts) {
        opts = opts || {};
        const s = el("span", "spinner");
        if (opts.size) { s.style.width = opts.size + "px"; s.style.height = opts.size + "px"; }
        s.setAttribute("aria-hidden", "true");
        return s;
    }

    // Audio-Haxor's `.loading-state`: a centered spinner over a muted label, inserted into a
    // container (e.g. a tab body) while its data loads.
    spinner.loadingState = function (label) {
        const wrap = el("div", "loading-state");
        wrap.appendChild(el("span", "spinner"));
        if (label != null) wrap.appendChild(el("div", "loading-state-label", label));
        return wrap;
    };

    window.ZGui = window.ZGui || {};
    window.ZGui.spinner = spinner;
})();
