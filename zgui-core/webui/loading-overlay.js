// zgui-core/loading-overlay.js — a busy scrim (backdrop blur + spinner + text) layered
// over a container, for in-place async work. window.ZGui.loadingOverlay.
//   ZGui.loadingOverlay(container, { text?, blur? }) -> { el, show(), hide(), toggle(on), setText }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function loadingOverlay(container, opts) {
        opts = opts || {};
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        // the scrim is absolutely positioned within the host, so the host must establish
        // a positioning context.
        const pos = host.style.position;
        if (!pos || pos === "static") host.style.position = "relative";

        const el = document.createElement("div");
        el.className = "zg-loading-overlay";
        if (opts.blur === false) el.classList.add("zg-no-blur");
        const spin = document.createElement("div");
        spin.className = "zg-loading-spinner";
        const txt = document.createElement("div");
        txt.className = "zg-loading-text";
        txt.innerHTML = esc(opts.text || "");
        el.appendChild(spin);
        el.appendChild(txt);
        el.style.display = "none";
        host.appendChild(el);

        return {
            el,
            show: () => { el.style.display = "flex"; },
            hide: () => { el.style.display = "none"; },
            toggle: (on) => { el.style.display = on ? "flex" : "none"; },
            setText: (t) => { txt.innerHTML = esc(t); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.loadingOverlay = loadingOverlay;
})();
