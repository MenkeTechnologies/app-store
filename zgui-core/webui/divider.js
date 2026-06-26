// zgui-core/divider.js — a neon section divider, optionally with a centered label. window.ZGui.divider.
//   ZGui.divider({ label?, vertical? }) -> HTMLElement
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function divider(opts) {
        opts = opts || {};
        const el = document.createElement("div");
        el.className = "zg-divider" + (opts.vertical ? " zg-divider-v" : "") + (opts.label ? " zg-divider-labeled" : "");
        if (opts.label && !opts.vertical) el.innerHTML = `<span class="zg-divider-line"></span><span class="zg-divider-label">${esc(opts.label)}</span><span class="zg-divider-line"></span>`;
        return el;
    }
    window.ZGui = window.ZGui || {}; window.ZGui.divider = divider;
})();
