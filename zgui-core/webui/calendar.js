// zgui-core/calendar.js — a month-grid date picker (the 7-column .cal-grid pattern across the
// suite). Prev/next month, click a day. window.ZGui.calendar.
//
//   ZGui.calendar(container, { value:Date, onSelect(date), markers:{ 'YYYY-MM-DD': 'cls' } }) -> { el, set(date), month(y,m) }
(function () {
    "use strict";
    const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
    function calendar(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        host.classList.add("zg-cal");
        let sel = opts.value instanceof Date ? new Date(opts.value) : null;
        let view = new Date(sel || new Date()); view.setDate(1);
        function render() {
            host.innerHTML = "";
            const head = el("div", "zg-cal-head", host);
            const prev = el("button", "zg-cal-nav", head, "‹"); prev.type = "button";
            el("span", "zg-cal-title", head, MON[view.getMonth()] + " " + view.getFullYear());
            const next = el("button", "zg-cal-nav", head, "›"); next.type = "button";
            prev.addEventListener("click", () => { view.setMonth(view.getMonth() - 1); render(); });
            next.addEventListener("click", () => { view.setMonth(view.getMonth() + 1); render(); });
            const grid = el("div", "zg-cal-grid", host);
            DOW.forEach((d) => el("span", "zg-cal-dow", grid, d));
            const first = new Date(view), start = first.getDay();
            const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
            for (let i = 0; i < start; i++) el("span", "zg-cal-pad", grid);
            const today = iso(new Date());
            for (let d = 1; d <= days; d++) {
                const date = new Date(view.getFullYear(), view.getMonth(), d), k = iso(date);
                const cell = el("button", "zg-cal-day", grid, String(d)); cell.type = "button";
                if (k === today) cell.classList.add("today");
                if (sel && k === iso(sel)) cell.classList.add("selected");
                if (opts.markers && opts.markers[k]) cell.classList.add(opts.markers[k]);
                cell.addEventListener("click", () => { sel = date; render(); if (typeof opts.onSelect === "function") opts.onSelect(date); });
            }
        }
        render();
        return { el: host, set(d) { sel = new Date(d); view = new Date(d); view.setDate(1); render(); }, month(y, m) { view = new Date(y, m, 1); render(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.calendar = calendar;
})();
