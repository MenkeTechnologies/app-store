// zgui-core/schedule-grid.js — a paintable day×hour schedule grid: drag to enable cells, emits a derived
// cron expression. A visual cron editor (not a date picker). window.ZGui.scheduleGrid.
//   ZGui.scheduleGrid(container, { rows:7, cols:24, values:[[bool]], rowLabels, colLabels, onChange(grid) }) ->
//       { el, get(), cron(), set(grid), clear() }
(function () {
    "use strict";
    const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const CRON_DOW = [0, 1, 2, 3, 4, 5, 6];
    function scheduleGrid(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const rows = opts.rows || 7, cols = opts.cols || 24;
        const rowLabels = opts.rowLabels || DOW;
        let grid = [];
        for (let r = 0; r < rows; r++) { grid[r] = []; for (let c = 0; c < cols; c++) grid[r][c] = !!(opts.values && opts.values[r] && opts.values[r][c]); }

        const root = document.createElement("div"); root.className = "zg-schedgrid"; root.style.setProperty("--zg-cols", cols);
        host.appendChild(root);

        function render() {
            let html = '<div class="zg-schedgrid-corner"></div>';
            for (let c = 0; c < cols; c++) html += `<div class="zg-schedgrid-col">${opts.colLabels ? opts.colLabels[c] : (c % 6 === 0 ? c : "")}</div>`;
            for (let r = 0; r < rows; r++) { html += `<div class="zg-schedgrid-row">${rowLabels[r] || r}</div>`; for (let c = 0; c < cols; c++) html += `<div class="zg-schedgrid-cell${grid[r][c] ? " on" : ""}" data-r="${r}" data-c="${c}"></div>`; }
            root.innerHTML = html;
        }
        let paint = false, paintVal = true;
        function setCell(el) { const r = +el.dataset.r, c = +el.dataset.c; if (grid[r][c] === paintVal) return; grid[r][c] = paintVal; el.classList.toggle("on", paintVal); if (typeof opts.onChange === "function") opts.onChange(grid); }
        root.addEventListener("pointerdown", (e) => { const cell = e.target.closest(".zg-schedgrid-cell"); if (!cell) return; paint = true; paintVal = !grid[+cell.dataset.r][+cell.dataset.c]; setCell(cell); e.preventDefault(); });
        root.addEventListener("pointermove", (e) => { if (!paint) return; const el = document.elementFromPoint(e.clientX, e.clientY); if (el && el.classList && el.classList.contains("zg-schedgrid-cell")) setCell(el); });
        window.addEventListener("pointerup", () => { paint = false; });

        function cron() {
            // hours/days that are on across the grid → "m h dom mon dow"
            const hoursOn = new Set(), daysOn = new Set();
            for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c]) { hoursOn.add(c); daysOn.add(CRON_DOW[r] != null ? CRON_DOW[r] : r); }
            if (!hoursOn.size) return "";
            const h = [...hoursOn].sort((a, b) => a - b).join(",");
            const d = daysOn.size === rows ? "*" : [...daysOn].sort((a, b) => a - b).join(",");
            return `0 ${h} * * ${d}`;
        }
        render();
        return { el: root, get() { return grid; }, cron, set(g) { grid = g; render(); }, clear() { grid = grid.map((r) => r.map(() => false)); render(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.scheduleGrid = scheduleGrid;
})();
