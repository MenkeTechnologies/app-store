// zgui-core/banner.js — a full-width inline callout/banner. window.ZGui.banner.
//   ZGui.banner(container, { type:'info'|'success'|'warn'|'error', title?, message, icon?, dismissible?, onDismiss? }) -> { el, dismiss() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    const ICON = { info: "ⓘ", success: "✓", warn: "⚠", error: "✕" };
    function banner(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const type = ["info", "success", "warn", "error"].indexOf(opts.type) >= 0 ? opts.type : "info";
        const el = document.createElement("div");
        el.className = "zg-banner zg-banner-" + type;
        el.innerHTML = `<span class="zg-banner-icon">${opts.icon != null ? opts.icon : ICON[type]}</span>`
            + `<span class="zg-banner-body">${opts.title ? `<span class="zg-banner-title">${esc(opts.title)}</span>` : ""}<span class="zg-banner-msg">${esc(opts.message || "")}</span></span>`
            + (opts.dismissible ? `<button type="button" class="zg-banner-x" aria-label="Dismiss">✕</button>` : "");
        function dismiss() { el.remove(); if (typeof opts.onDismiss === "function") opts.onDismiss(); }
        if (opts.dismissible) el.querySelector(".zg-banner-x").addEventListener("click", dismiss);
        host.appendChild(el);
        return { el, dismiss };
    }
    window.ZGui = window.ZGui || {}; window.ZGui.banner = banner;
})();
