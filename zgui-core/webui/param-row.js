// zgui-core/param-row.js — a synth/settings parameter row: an uppercase label on the left, a control
// (premium groove slider / select / number) and an optional unit + live value readout on the right.
// Ported from zpwr-patch-core's .set-row / .set-slider / .set-sel / .set-val / .set-unit. window.ZGui.paramRow.
//   ZGui.paramRow({ label, type:'range'|'select'|'number', value, min, max, step, unit, options:[[v,label]],
//       format(v), onChange(value) }) -> { el, get(), set(v), control }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function paramRow(opts) {
        opts = opts || {};
        const type = opts.type || "range";
        const row = document.createElement("div");
        row.className = "zg-param-row";
        const label = document.createElement("span"); label.className = "zg-param-label"; label.textContent = opts.label || "";
        row.appendChild(label);

        let control, valEl = null;
        const fmt = typeof opts.format === "function" ? opts.format : (v) => v;
        if (type === "select") {
            control = document.createElement("select"); control.className = "zg-param-sel";
            (opts.options || []).forEach((o) => { const op = document.createElement("option"); const v = Array.isArray(o) ? o[0] : o; const l = Array.isArray(o) ? o[1] : o; op.value = v; op.textContent = l; control.appendChild(op); });
            if (opts.value != null) control.value = opts.value;
            control.addEventListener("change", () => { if (typeof opts.onChange === "function") opts.onChange(control.value); });
            row.appendChild(control);
        } else if (type === "number") {
            control = document.createElement("input"); control.type = "number"; control.className = "zg-param-num";
            if (opts.min != null) control.min = opts.min; if (opts.max != null) control.max = opts.max; if (opts.step != null) control.step = opts.step;
            control.value = opts.value != null ? opts.value : 0;
            control.addEventListener("input", () => { if (typeof opts.onChange === "function") opts.onChange(+control.value); });
            row.appendChild(control);
        } else {
            control = document.createElement("input"); control.type = "range"; control.className = "zg-param-slider";
            control.min = opts.min != null ? opts.min : 0; control.max = opts.max != null ? opts.max : 1; control.step = opts.step != null ? opts.step : 0.01;
            control.value = opts.value != null ? opts.value : 0;
            valEl = document.createElement("span"); valEl.className = "zg-param-val"; valEl.textContent = fmt(+control.value);
            control.addEventListener("input", () => { valEl.textContent = fmt(+control.value); if (typeof opts.onChange === "function") opts.onChange(+control.value); });
            row.appendChild(control); row.appendChild(valEl);
        }
        if (opts.unit) { const u = document.createElement("span"); u.className = "zg-param-unit"; u.innerHTML = esc(opts.unit); row.appendChild(u); }

        return {
            el: row, control,
            get() { return type === "select" ? control.value : +control.value; },
            set(v) { control.value = v; if (valEl) valEl.textContent = fmt(+v); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.paramRow = paramRow;
})();
