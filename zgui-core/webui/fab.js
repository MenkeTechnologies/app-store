// zgui-core/fab.js — a floating action button (fixed, bottom-right, neon). window.ZGui.fab.
//   ZGui.fab({ icon, label?, onClick, corner='br' }) -> { el, show, hide, remove }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function fab(opts) {
        opts = opts || {};
        const el = document.createElement("button");
        el.type = "button";
        el.className = "zg-fab zg-fab-" + (opts.corner || "br") + (opts.label ? " zg-fab-extended" : "");
        el.innerHTML = `<span class="zg-fab-icon">${opts.icon || "+"}</span>` + (opts.label ? `<span class="zg-fab-label">${esc(opts.label)}</span>` : "");
        if (opts.title) el.title = opts.title;
        if (typeof opts.onClick === "function") el.addEventListener("click", opts.onClick);
        document.body.appendChild(el);
        return { el, show() { el.style.display = ""; }, hide() { el.style.display = "none"; }, remove() { el.remove(); } };
    }
    window.ZGui = window.ZGui || {}; window.ZGui.fab = fab;
})();
