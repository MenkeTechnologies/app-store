// zgui-core/empty-state.js — a centered "nothing here" placeholder. window.ZGui.emptyState.
//   ZGui.emptyState(container, { icon, title, message, action:{label,onClick} }) -> { el }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function emptyState(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        host.classList.add("zg-empty");
        host.innerHTML = (opts.icon ? `<div class="zg-empty-icon">${opts.icon}</div>` : "")
            + `<div class="zg-empty-title">${esc(opts.title || "Nothing here")}</div>`
            + (opts.message ? `<div class="zg-empty-msg">${esc(opts.message)}</div>` : "")
            + (opts.action ? `<button type="button" class="zs-btn zs-btn-primary zg-empty-action">${esc(opts.action.label || "")}</button>` : "");
        if (opts.action && typeof opts.action.onClick === "function") host.querySelector(".zg-empty-action").addEventListener("click", opts.action.onClick);
        return { el: host };
    }
    window.ZGui = window.ZGui || {}; window.ZGui.emptyState = emptyState;
})();
