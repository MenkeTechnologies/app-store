// zgui-core/data-table.js — render a table from data + column defs, with sortable headers wired to
// ZGui.table.sort and resizable columns via ZGui.table.columns. The toolkit (table.js) is the
// engine; this is the render-from-data convenience. window.ZGui.dataTable.
//
//   ZGui.dataTable(container, {
//       columns: [{ key, label, render?(row), sortable?, width?, minWidth? }],
//       rows: [...], rowKey?(row), onRowClick?(row), sortScope?, resizable?
//   }) -> { el, setRows(rows), sort(key), getSort() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function el(t, c, p) { const e = document.createElement(t); if (c) e.className = c; if (p) p.appendChild(e); return e; }
    function dataTable(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const cols = opts.columns || [];
        let rows = (opts.rows || []).slice();
        const T = window.ZGui && window.ZGui.table;
        let sortKey = null, sortAsc = true;
        if (T && opts.sortScope) { const s = T.sort.restore(opts.sortScope); if (s) { sortKey = s.key; sortAsc = s.asc; } }
        const table = el("table", "zg-datatable", host); if (opts.id) table.id = opts.id;
        const thead = el("thead", null, table); const tr = el("tr", null, thead);
        cols.forEach((c) => {
            const th = el("th", null, tr); if (c.width) th.style.width = c.width; if (c.minWidth) th.dataset.minWidth = c.minWidth; th.dataset.key = c.key;
            const lab = el("span", "zg-dt-th", th); lab.textContent = c.label != null ? c.label : c.key;
            if (c.sortable !== false) { th.classList.add("zg-dt-sortable"); th.addEventListener("click", () => doSort(c.key)); }
            if (opts.resizable !== false) el("span", "col-resize", th);
        });
        const tbody = el("tbody", null, table);
        function sorted() {
            if (!sortKey) return rows;
            const cmp = (a, b) => { const x = a[sortKey], y = b[sortKey]; return x == null ? -1 : y == null ? 1 : (x < y ? -1 : x > y ? 1 : 0); };
            return rows.slice().sort((a, b) => sortAsc ? cmp(a, b) : -cmp(a, b));
        }
        function draw() {
            tbody.innerHTML = "";
            sorted().forEach((row) => {
                const r = el("tr", null, tbody);
                if (opts.rowKey) r.dataset.path = opts.rowKey(row);
                cols.forEach((c) => { const td = el("td", null, r); if (c.render) { const o = c.render(row); if (o instanceof Node) td.appendChild(o); else td.innerHTML = o; } else td.innerHTML = esc(row[c.key]); });
                if (opts.onRowClick) { r.style.cursor = "pointer"; r.addEventListener("click", () => opts.onRowClick(row)); }
            });
            tr.querySelectorAll(".zg-dt-th").forEach((s) => s.classList.remove("asc", "desc"));
            if (sortKey) { const th = tr.querySelector(`th[data-key="${sortKey}"] .zg-dt-th`); if (th) th.classList.add(sortAsc ? "asc" : "desc"); }
        }
        function doSort(key) { if (sortKey === key) sortAsc = !sortAsc; else { sortKey = key; sortAsc = true; } if (T && opts.sortScope) T.sort.save(sortKey, sortAsc, opts.sortScope); draw(); }
        draw();
        if (T && opts.resizable !== false && opts.id) T.columns.initResize(table);
        return { el: table, setRows(r) { rows = (r || []).slice(); draw(); }, sort: doSort, getSort() { return { key: sortKey, asc: sortAsc }; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.dataTable = dataTable;
})();
