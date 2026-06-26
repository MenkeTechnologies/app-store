// zgui-core/count-badge.js — a small notification count/dot badge to overlay on icons. window.ZGui.countBadge.
//   ZGui.countBadge(count, { max=99, dot=false, accent='accent' }) -> <span class="zg-count-badge">
//   ZGui.countBadge.html(count, opts) -> string
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function text(count, opts) { const max = opts.max == null ? 99 : opts.max; const n = Number(count) || 0; return n > max ? max + "+" : String(n); }
    function html(count, opts) {
        opts = opts || {};
        const cls = "zg-count-badge zg-count-" + (opts.accent || "accent") + (opts.dot ? " zg-count-dot" : "");
        if (opts.dot) return `<span class="${cls}"></span>`;
        const n = Number(count) || 0;
        return n > 0 ? `<span class="${cls}">${esc(text(count, opts))}</span>` : "";
    }
    function countBadge(count, opts) {
        opts = opts || {};
        const span = document.createElement("span");
        span.className = "zg-count-badge zg-count-" + (opts.accent || "accent") + (opts.dot ? " zg-count-dot" : "");
        if (!opts.dot) span.textContent = text(count, opts);
        if (!opts.dot && !(Number(count) > 0)) span.style.display = "none";
        return span;
    }
    countBadge.html = html;
    window.ZGui = window.ZGui || {}; window.ZGui.countBadge = countBadge;
})();
