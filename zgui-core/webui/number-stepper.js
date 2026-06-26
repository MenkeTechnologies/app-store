// zgui-core/number-stepper.js — a number input with − / + steppers, min/max/step. window.ZGui.numberStepper.
//   ZGui.numberStepper({ value, min, max, step, onChange }) -> { el, get(), set(n) }
(function () {
    "use strict";
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    function numberStepper(opts) {
        opts = opts || {};
        const step = opts.step || 1, min = opts.min, max = opts.max;
        let v = opts.value || 0;
        const wrap = el("div", "zg-stepper-num");
        const dec = el("button", "zg-stepnum-btn", wrap, "−"); dec.type = "button";
        const input = el("input", "zg-stepnum-input", wrap); input.type = "text"; input.value = v;
        const inc = el("button", "zg-stepnum-btn", wrap, "+"); inc.type = "button";
        function clamp(n) { if (min != null) n = Math.max(min, n); if (max != null) n = Math.min(max, n); return n; }
        function setV(n, fire) { n = clamp(n); if (isNaN(n)) return; v = n; input.value = v; if (fire && typeof opts.onChange === "function") opts.onChange(v); }
        dec.addEventListener("click", () => setV(v - step, true));
        inc.addEventListener("click", () => setV(v + step, true));
        input.addEventListener("change", () => setV(parseFloat(input.value), true));
        return { el: wrap, get() { return v; }, set(n) { setV(n, false); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.numberStepper = numberStepper;
})();
