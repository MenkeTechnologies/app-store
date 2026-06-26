// zgui-core/lcd-display.js — a segmented LCD-style numeric readout (DAW transport: tempo / position /
// time / time-signature). One field = a big value + optional small label; compose several side by side
// for a transport bar. Extracted from the Bitwig-style transport display. window.ZGui.lcdDisplay.
//   ZGui.lcdDisplay({ value, label, sub, kind:'cyan', editable:false, onChange(v) }) ->
//       { el, set(value), setSub(s) }
//   ZGui.lcdDisplay.bbt(bar,beat,tick) -> "bar.beat.tick"   helper for bars:beats:ticks
(function () {
    "use strict";
    function el(t, c, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
    function lcdDisplay(opts) {
        opts = opts || {};
        const root = el("div", "zg-lcd");
        if (opts.kind) root.dataset.kind = opts.kind;
        const val = el("span", "zg-lcd-value", opts.value != null ? opts.value : "");
        root.appendChild(val);
        let subEl = null;
        if (opts.label || opts.sub) { subEl = el("span", "zg-lcd-sub", opts.sub != null ? opts.sub : opts.label); root.appendChild(subEl); }
        if (opts.editable) {
            val.contentEditable = "true"; val.spellcheck = false; root.classList.add("is-editable");
            val.addEventListener("blur", () => { if (typeof opts.onChange === "function") opts.onChange(val.textContent.trim()); });
            val.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); val.blur(); } });
        }
        return { el: root, set(v) { val.textContent = v == null ? "" : v; }, setSub(s) { if (subEl) subEl.textContent = s == null ? "" : s; } };
    }
    lcdDisplay.bbt = function (bar, beat, tick) { return (bar | 0) + "." + (beat | 0) + "." + (tick | 0); };
    window.ZGui = window.ZGui || {};
    window.ZGui.lcdDisplay = lcdDisplay;
})();
