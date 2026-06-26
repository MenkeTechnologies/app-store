// zgui-core/date-range-picker.js — a date-range input with a dual-month calendar: click a start then an
// end, the span between highlights (and previews on hover), with quick presets. Ported behavior from Ant
// Design's <DatePicker.RangePicker> (value [start,end], onChange, presets, dual panel, range highlight).
// window.ZGui.dateRangePicker.   Dates are JS Date objects (or ISO strings).
//   ZGui.dateRangePicker(container, { value:[start,end], presets:[{label,range:[s,e]}], placeholder,
//       onChange([start,end]) }) -> { el, get(), set([s,e]), open(), close() }
(function () {
    "use strict";
    const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    function d2(n) { return String(n).padStart(2, "0"); }
    function toDate(v) { return v == null ? null : (v instanceof Date ? v : new Date(v)); }
    function ymd(d) { return d.getFullYear() + "-" + d2(d.getMonth() + 1) + "-" + d2(d.getDate()); }
    function dayNum(d) { return d ? d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate() : 0; }
    function sameMonthDays(y, m) { return new Date(y, m + 1, 0).getDate(); }

    function dateRangePicker(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let start = toDate(opts.value && opts.value[0]);
        let end = toDate(opts.value && opts.value[1]);
        let pick = 0;      // 0 = choosing start, 1 = choosing end
        let hover = null;
        const view = start ? new Date(start.getFullYear(), start.getMonth(), 1) : new Date();

        const root = document.createElement("div"); root.className = "zg-drp";
        const input = document.createElement("div"); input.className = "zg-drp-input"; input.tabIndex = 0;
        const pop = document.createElement("div"); pop.className = "zg-drp-pop"; pop.hidden = true;
        root.appendChild(input); root.appendChild(pop); host.appendChild(root);

        function renderInput() {
            input.innerHTML = `<span class="${start ? "" : "ph"}">${start ? ymd(start) : (opts.placeholder ? opts.placeholder.split("~")[0] || "Start" : "Start")}</span><span class="zg-drp-sep">→</span><span class="${end ? "" : "ph"}">${end ? ymd(end) : "End"}</span>`;
        }
        function inRange(num, lo, hi) { return lo && hi && num > Math.min(lo, hi) && num < Math.max(lo, hi); }
        function monthGrid(base) {
            const y = base.getFullYear(), m = base.getMonth();
            const first = new Date(y, m, 1).getDay(), days = sameMonthDays(y, m);
            const sNum = dayNum(start), eNum = dayNum(end), hNum = dayNum(hover);
            const previewEnd = (pick === 1 && start && hover) ? hNum : eNum;
            let cells = "";
            for (let i = 0; i < first; i++) cells += '<div class="zg-drp-cell empty"></div>';
            for (let day = 1; day <= days; day++) {
                const num = y * 10000 + m * 100 + day;
                const isStart = num === sNum, isEnd = num === eNum || (pick === 1 && hover && num === hNum);
                const within = inRange(num, sNum, previewEnd);
                cells += `<div class="zg-drp-cell${isStart ? " start" : ""}${isEnd ? " end" : ""}${within ? " in" : ""}" data-d="${y}-${m}-${day}">${day}</div>`;
            }
            return `<div class="zg-drp-month"><div class="zg-drp-mhead">${MON[m]} ${y}</div><div class="zg-drp-dow">${DOW.map((d) => `<span>${d}</span>`).join("")}</div><div class="zg-drp-grid">${cells}</div></div>`;
        }
        function render() {
            const right = new Date(view.getFullYear(), view.getMonth() + 1, 1);
            let presets = "";
            if (opts.presets && opts.presets.length) presets = `<div class="zg-drp-presets">${opts.presets.map((p, i) => `<button type="button" data-p="${i}">${p.label}</button>`).join("")}</div>`;
            pop.innerHTML = `<div class="zg-drp-body"><button class="zg-drp-nav prev" type="button">‹</button>${monthGrid(view)}${monthGrid(right)}<button class="zg-drp-nav next" type="button">›</button></div>${presets}`;
        }
        function commit() { if (typeof opts.onChange === "function") opts.onChange([start, end]); }
        pop.addEventListener("click", (e) => {
            const nav = e.target.closest(".zg-drp-nav");
            if (nav) { view.setMonth(view.getMonth() + (nav.classList.contains("prev") ? -1 : 1)); render(); return; }
            const pset = e.target.closest("[data-p]");
            if (pset) { const p = opts.presets[+pset.dataset.p]; const r = typeof p.range === "function" ? p.range() : p.range; start = toDate(r[0]); end = toDate(r[1]); pick = 0; renderInput(); render(); commit(); close(); return; }
            const cell = e.target.closest(".zg-drp-cell:not(.empty)");
            if (!cell) return;
            const [yy, mm, dd] = cell.dataset.d.split("-").map(Number);
            const clicked = new Date(yy, mm, dd);
            if (pick === 0) { start = clicked; end = null; pick = 1; }
            else { if (dayNum(clicked) < dayNum(start)) { end = start; start = clicked; } else end = clicked; pick = 0; renderInput(); commit(); close(); return; }
            renderInput(); render();
        });
        pop.addEventListener("mouseover", (e) => { const cell = e.target.closest(".zg-drp-cell:not(.empty)"); if (cell && pick === 1) { const [yy, mm, dd] = cell.dataset.d.split("-").map(Number); hover = new Date(yy, mm, dd); render(); } });
        function open() { render(); pop.hidden = false; root.classList.add("is-open"); document.addEventListener("pointerdown", outside, true); }
        function close() { pop.hidden = true; root.classList.remove("is-open"); document.removeEventListener("pointerdown", outside, true); }
        function outside(e) { if (!root.contains(e.target)) close(); }
        input.addEventListener("click", () => (pop.hidden ? open() : close()));

        renderInput();
        return { el: root, get() { return [start, end]; }, set(v) { start = toDate(v && v[0]); end = toDate(v && v[1]); pick = 0; renderInput(); }, open, close };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.dateRangePicker = dateRangePicker;
})();
