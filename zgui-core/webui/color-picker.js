// zgui-core/color-picker.js — a color picker: a styled swatch wrapping a native <input type=color>
// + a hex readout (used by the colorscheme custom builder). window.ZGui.colorPicker.
//
//   ZGui.colorPicker({ value:'#05d9e8', label, onChange }) -> { el, get(), set(hex) }
(function () {
    "use strict";
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    function colorPicker(opts) {
        opts = opts || {};
        const wrap = el("label", "zg-colorpicker");
        if (opts.label != null) el("span", "zg-colorpicker-label", wrap, opts.label);
        const sw = el("span", "zg-colorpicker-swatch", wrap);
        const input = el("input", null, sw); input.type = "color"; input.value = opts.value || "#000000";
        const hex = el("span", "zg-colorpicker-hex", wrap, input.value);
        sw.style.background = input.value;
        input.addEventListener("input", () => { sw.style.background = input.value; hex.textContent = input.value; if (typeof opts.onChange === "function") opts.onChange(input.value); });
        return { el: wrap, get() { return input.value; }, set(h) { input.value = h; sw.style.background = h; hex.textContent = h; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.colorPicker = colorPicker;
})();
