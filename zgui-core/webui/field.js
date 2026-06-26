// zgui-core/field.js — a form field wrapper: label + control + optional help / error. Pairs the
// atomic controls (ZGui.textfield/select/…) with a label and validation message. window.ZGui.field.
//
//   ZGui.field({ label, control, help, error, required }) -> { el, setError(msg), setHelp(msg) }
//   control: an HTMLElement, or a {el} handle from a ZGui control factory.
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    function field(opts) {
        opts = opts || {};
        const wrap = el("div", "zg-field");
        if (opts.label != null) { const l = el("label", "zg-field-label", wrap); l.innerHTML = esc(opts.label) + (opts.required ? ' <span class="zg-field-req">*</span>' : ""); }
        const ctl = opts.control && opts.control.el ? opts.control.el : opts.control;
        if (ctl) wrap.appendChild(ctl);
        const help = el("div", "zg-field-help", wrap, opts.help || "");
        const err = el("div", "zg-field-error", wrap, opts.error || "");
        if (!opts.help) help.style.display = "none";
        if (opts.error) wrap.classList.add("has-error"); else err.style.display = "none";
        return {
            el: wrap,
            setError(msg) { err.textContent = msg || ""; err.style.display = msg ? "" : "none"; wrap.classList.toggle("has-error", !!msg); },
            setHelp(msg) { help.textContent = msg || ""; help.style.display = msg ? "" : "none"; },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.field = field;
})();
