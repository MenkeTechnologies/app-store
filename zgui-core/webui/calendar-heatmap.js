// zgui-core/calendar-heatmap.js — a GitHub-style contribution grid: one square per day laid out in
// week-columns, colored by value intensity, with month labels and a legend. window.ZGui.calendarHeatmap.
//   ZGui.calendarHeatmap(container, { values:{ 'YYYY-MM-DD': n }, startDate, endDate, max, levels:5,
//       weekStart:0, onCellClick(date,value), tooltip:true }) -> { el, set(values) }
(function () {
    "use strict";
    const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    function d2(n) { return String(n).padStart(2, "0"); }
    function key(d) { return d.getFullYear() + "-" + d2(d.getMonth() + 1) + "-" + d2(d.getDate()); }
    function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

    function calendarHeatmap(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let values = opts.values || {};
        const levels = opts.levels || 5;
        const end = opts.endDate ? new Date(opts.endDate) : new Date();
        const start = opts.startDate ? new Date(opts.startDate) : addDays(end, -363);
        // align start to the week start
        const ws = opts.weekStart || 0;
        let cur = new Date(start); while (cur.getDay() !== ws) cur = addDays(cur, -1);

        const root = document.createElement("div"); root.className = "zg-heatmap";

        function maxVal() { if (opts.max) return opts.max; let m = 1; for (const k in values) if (values[k] > m) m = values[k]; return m; }
        function level(v) { if (!v) return 0; const m = maxVal(); return Math.min(levels - 1, 1 + Math.floor((v / m) * (levels - 2 + 0.999))); }

        function render() {
            const weeks = [];
            let d = new Date(cur), monthMarks = [];
            let wi = 0;
            while (d <= end) {
                const col = [];
                let labelMonth = -1;
                for (let row = 0; row < 7; row++) {
                    if (d > end) { col.push(null); continue; }
                    const k = key(d), v = values[k] || 0;
                    if (d.getDate() <= 7 && labelMonth < 0) labelMonth = d.getMonth();
                    col.push({ k, v, lvl: level(v), date: new Date(d) });
                    d = addDays(d, 1);
                }
                if (labelMonth >= 0) monthMarks.push({ wi, m: labelMonth });
                weeks.push(col); wi++;
            }
            const monthRow = `<div class="zg-heatmap-months">${monthMarks.map((mm) => `<span style="grid-column:${mm.wi + 1}">${MON[mm.m]}</span>`).join("")}</div>`;
            const grid = `<div class="zg-heatmap-grid" style="grid-template-columns:repeat(${weeks.length},11px)">`
                + weeks.map((col) => `<div class="zg-heatmap-week">${col.map((c) => c ? `<span class="zg-heatmap-cell" data-lvl="${c.lvl}" data-d="${c.k}" data-v="${c.v}"${opts.tooltip !== false ? ` title="${c.k}: ${c.v}"` : ""}></span>` : '<span class="zg-heatmap-cell empty"></span>').join("")}</div>`).join("")
                + "</div>";
            const legend = `<div class="zg-heatmap-legend">Less ${Array.from({ length: levels }, (_, i) => `<span class="zg-heatmap-cell" data-lvl="${i}"></span>`).join("")} More</div>`;
            root.innerHTML = monthRow + grid + legend;
        }
        root.addEventListener("click", (e) => { const c = e.target.closest(".zg-heatmap-cell"); if (c && c.dataset.d && typeof opts.onCellClick === "function") opts.onCellClick(c.dataset.d, +c.dataset.v); });

        host.appendChild(root);
        render();
        return { el: root, set(v) { values = v || {}; render(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.calendarHeatmap = calendarHeatmap;
})();
