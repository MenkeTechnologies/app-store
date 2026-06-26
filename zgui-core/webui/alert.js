// zgui-core/alert.js — an inline message bar (info / success / warning / error), distinct from the
// transient toast. Optional dismiss button. window.ZGui.alert.
//
//   ZGui.alert({ kind:'warning', text, dismissible:true, onDismiss }) -> { el, dismiss() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    const GLYPH = { info: "ℹ", success: "✓", warning: "⚠", error: "✕" };
    function alert(opts) {
        opts = opts || {};
        const kind = opts.kind || "info";
        const box = el("div", "zg-alert zg-alert-" + kind);
        el("span", "zg-alert-icon", box, GLYPH[kind] || GLYPH.info);
        const msg = el("span", "zg-alert-msg", box); msg.innerHTML = esc(opts.text);
        function dismiss() { if (box.parentNode) box.parentNode.removeChild(box); if (typeof opts.onDismiss === "function") opts.onDismiss(); }
        if (opts.dismissible) { const x = el("button", "zg-alert-x", box, "✕"); x.type = "button"; x.addEventListener("click", dismiss); }
        return { el: box, dismiss };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.alert = alert;
})();
