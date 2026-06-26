// zgui-core/time-picker.js — a time input with a dropdown of scrollable hour / minute / second columns
// and a Now / OK footer. Ported behavior from Ant Design's <TimePicker> (value, format, use12Hours,
// hourStep/minuteStep/secondStep, showNow, onChange). window.ZGui.timePicker.
//   ZGui.timePicker(container, { value:'14:30:00', showSeconds:true, use12Hours:false, hourStep:1,
//       minuteStep:1, secondStep:1, showNow:true, placeholder, onChange(str,{h,m,s}) }) ->
//       { el, get(), set(str), open(), close() }
(function () {
    "use strict";
    function pad(n) { return String(n).padStart(2, "0"); }
    function timePicker(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const showSec = opts.showSeconds !== false;
        const cur = { h: 0, m: 0, s: 0 };
        function parse(str) { const p = String(str || "").split(":").map((x) => parseInt(x, 10)); if (!isNaN(p[0])) cur.h = Math.min(23, Math.max(0, p[0])); if (!isNaN(p[1])) cur.m = Math.min(59, Math.max(0, p[1])); if (!isNaN(p[2])) cur.s = Math.min(59, Math.max(0, p[2])); }
        if (opts.value) parse(opts.value);

        const root = document.createElement("div"); root.className = "zg-timepicker";
        const input = document.createElement("input"); input.className = "zg-timepicker-input"; input.readOnly = true; input.placeholder = opts.placeholder || "Select time";
        const pop = document.createElement("div"); pop.className = "zg-timepicker-pop"; pop.hidden = true;
        root.appendChild(input); root.appendChild(pop); host.appendChild(root);

        function fmt() { return pad(cur.h) + ":" + pad(cur.m) + (showSec ? ":" + pad(cur.s) : ""); }
        function renderInput() { input.value = opts.value || input.value ? fmt() : ""; }
        function column(unit, count, step) {
            const col = document.createElement("div"); col.className = "zg-timepicker-col"; col.dataset.unit = unit;
            for (let i = 0; i < count; i += step) { const cell = document.createElement("div"); cell.className = "zg-timepicker-cell" + (cur[unit] === i ? " active" : ""); cell.textContent = pad(i); cell.dataset.v = i; col.appendChild(cell); }
            col.addEventListener("click", (e) => { const c = e.target.closest(".zg-timepicker-cell"); if (!c) return; cur[unit] = +c.dataset.v; build(); input.value = fmt(); emit(); const active = pop.querySelector(`[data-unit="${unit}"] .active`); if (active) active.scrollIntoView({ block: "center" }); });
            return col;
        }
        function build() {
            pop.innerHTML = "";
            const cols = document.createElement("div"); cols.className = "zg-timepicker-cols";
            cols.appendChild(column("h", 24, opts.hourStep || 1));
            cols.appendChild(column("m", 60, opts.minuteStep || 1));
            if (showSec) cols.appendChild(column("s", 60, opts.secondStep || 1));
            pop.appendChild(cols);
            const foot = document.createElement("div"); foot.className = "zg-timepicker-foot";
            if (opts.showNow !== false) { const now = document.createElement("button"); now.type = "button"; now.className = "zg-timepicker-now"; now.textContent = "Now"; now.addEventListener("click", () => { const d = new Date(); cur.h = d.getHours(); cur.m = d.getMinutes(); cur.s = d.getSeconds(); input.value = fmt(); build(); emit(); }); foot.appendChild(now); }
            const ok = document.createElement("button"); ok.type = "button"; ok.className = "zg-timepicker-ok"; ok.textContent = "OK"; ok.addEventListener("click", close); foot.appendChild(ok);
            pop.appendChild(foot);
        }
        function emit() { if (typeof opts.onChange === "function") opts.onChange(fmt(), { h: cur.h, m: cur.m, s: cur.s }); }
        function open() { build(); pop.hidden = false; root.classList.add("is-open"); document.addEventListener("pointerdown", outside, true); ["h", "m", "s"].forEach((u) => { const a = pop.querySelector(`[data-unit="${u}"] .active`); if (a) a.scrollIntoView({ block: "center" }); }); }
        function close() { pop.hidden = true; root.classList.remove("is-open"); document.removeEventListener("pointerdown", outside, true); }
        function outside(e) { if (!root.contains(e.target)) close(); }
        input.addEventListener("click", () => (pop.hidden ? open() : close()));

        renderInput();
        return { el: root, get() { return fmt(); }, set(str) { parse(str); input.value = fmt(); }, open, close };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.timePicker = timePicker;
})();
