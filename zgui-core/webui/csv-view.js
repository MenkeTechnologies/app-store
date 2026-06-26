// zgui-core/csv-view.js — render a CSV string as a cyberpunk table. Self-contained RFC-4180-ish
// parser (quoted fields, "" escapes, embedded commas/newlines). window.ZGui.csvView.
//   ZGui.csvView(container, csvString, { delimiter=',', header=true }) -> { el, set(csv), rows() }
(function () {
    "use strict";
    function parseCsv(text, delim) {
        delim = delim || ",";
        text = String(text == null ? "" : text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        const rows = [];
        let row = [], field = "", inQ = false, i = 0;
        while (i < text.length) {
            const c = text[i];
            if (inQ) {
                if (c === '"') {
                    if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
                    inQ = false; i++; continue;
                }
                field += c; i++; continue;
            }
            if (c === '"') { inQ = true; i++; continue; }
            if (c === delim) { row.push(field); field = ""; i++; continue; }
            if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
            field += c; i++;
        }
        if (field.length || row.length) { row.push(field); rows.push(row); }
        return rows;
    }

    function csvView(container, csv, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const el = document.createElement("div");
        el.className = "zg-csv";
        host.appendChild(el);
        let parsed = [];

        function set(text) {
            parsed = parseCsv(text, opts.delimiter);
            const hasHeader = opts.header !== false;
            el.innerHTML = "";
            if (!parsed.length) { el.innerHTML = '<div class="zg-csv-empty">(empty)</div>'; return; }
            const cols = parsed.reduce((m, r) => Math.max(m, r.length), 0);
            const table = document.createElement("table");
            table.className = "zg-csv-table";
            if (hasHeader) {
                const thead = document.createElement("thead");
                const tr = document.createElement("tr");
                const hdr = parsed[0];
                for (let c = 0; c < cols; c++) {
                    const th = document.createElement("th");
                    th.textContent = hdr[c] != null ? hdr[c] : "";
                    tr.appendChild(th);
                }
                thead.appendChild(tr);
                table.appendChild(thead);
            }
            const tbody = document.createElement("tbody");
            for (let r = hasHeader ? 1 : 0; r < parsed.length; r++) {
                const tr = document.createElement("tr");
                for (let c = 0; c < cols; c++) {
                    const td = document.createElement("td");
                    td.textContent = parsed[r][c] != null ? parsed[r][c] : "";
                    tr.appendChild(td);
                }
                tbody.appendChild(tr);
            }
            table.appendChild(tbody);
            el.appendChild(table);
            const foot = document.createElement("div");
            foot.className = "zg-csv-foot";
            const n = hasHeader ? parsed.length - 1 : parsed.length;
            foot.textContent = `${n} row${n === 1 ? "" : "s"} × ${cols} col${cols === 1 ? "" : "s"}`;
            el.appendChild(foot);
        }
        set(csv);
        return { el, set, rows: () => parsed };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.csvView = csvView;
})();
