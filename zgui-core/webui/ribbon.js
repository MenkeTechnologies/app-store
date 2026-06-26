// zgui-core/ribbon.js — a diagonal corner ribbon to overlay on a card. The host the
// ribbon is appended to must be position:relative + overflow:hidden. window.ZGui.ribbon.
//   ZGui.ribbon({ text, corner?:'tr'|'tl'|'br'|'bl', variant?:'cyan'|'magenta'|'accent'|'danger' })
//     -> { el, setText }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function ribbon(opts) {
        opts = opts || {};
        const corner = opts.corner || "tr";
        const el = document.createElement("div");
        el.className = "zg-ribbon zg-ribbon-" + corner + (opts.variant ? " zg-ribbon-" + opts.variant : "");
        const span = document.createElement("span");
        span.className = "zg-ribbon-text";
        span.innerHTML = esc(opts.text || "");
        el.appendChild(span);
        return { el, setText: (t) => { span.innerHTML = esc(t); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.ribbon = ribbon;
})();
