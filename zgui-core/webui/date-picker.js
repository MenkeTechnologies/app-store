// zgui-core/date-picker.js — a text input bound to a calendar popover. window.ZGui.datePicker.
//   ZGui.datePicker(container, { value?, format?, onChange?, calendar? }) -> { el, input, get, set }
// If ZGui.calendar exists it is used for the popover; else a native <input type=date> fallback.
(function () {
    "use strict";
    function fmtISO(d) { return d ? new Date(d).toISOString().slice(0, 10) : ""; }
    function datePicker(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        host.classList.add("zg-datepicker");
        const input = document.createElement("input");
        input.className = "zs-input zg-datepicker-input";
        input.readOnly = !!(window.ZGui && window.ZGui.calendar);
        input.placeholder = opts.placeholder || "YYYY-MM-DD";
        if (opts.value) input.value = fmtISO(opts.value);
        const pop = document.createElement("div"); pop.className = "zg-datepicker-pop"; pop.hidden = true;
        host.appendChild(input); host.appendChild(pop);
        let value = opts.value ? fmtISO(opts.value) : "";
        function set(v) { value = fmtISO(v); input.value = value; if (typeof opts.onChange === "function") opts.onChange(value); }
        if (window.ZGui && window.ZGui.calendar) {
            input.addEventListener("click", () => {
                pop.hidden = !pop.hidden;
                if (!pop.hidden) { pop.innerHTML = ""; window.ZGui.calendar(pop, { value: value, onSelect: (d) => { set(d); pop.hidden = true; } }); }
            });
            document.addEventListener("click", (e) => { if (!host.contains(e.target)) pop.hidden = true; });
        } else {
            input.type = "date";
            input.addEventListener("change", () => set(input.value));
        }
        return { el: host, input, get() { return value; }, set };
    }
    window.ZGui = window.ZGui || {}; window.ZGui.datePicker = datePicker;
})();
