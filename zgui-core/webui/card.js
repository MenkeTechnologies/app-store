// zgui-core/card.js — a content card / panel (header + body + optional actions). window.ZGui.card.
//   ZGui.card({ title, body, actions:[el], collapsible }) -> { el, head, body }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    function card(opts) {
        opts = opts || {};
        const wrap = el("div", "zg-card");
        let head = null;
        if (opts.title != null || (opts.actions && opts.actions.length)) {
            head = el("div", "zg-card-head", wrap);
            const t = el("span", "zg-card-title", head); t.innerHTML = esc(opts.title || "");
            if (opts.actions) { const a = el("span", "zg-card-actions", head); opts.actions.forEach((n) => n && a.appendChild(n)); }
        }
        const body = el("div", "zg-card-body", wrap);
        if (opts.body != null) { if (typeof opts.body === "string") body.innerHTML = opts.body; else body.appendChild(opts.body); }
        if (opts.collapsible && head) { head.style.cursor = "pointer"; head.addEventListener("click", () => wrap.classList.toggle("collapsed")); }
        return { el: wrap, head, body };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.card = card;
})();
