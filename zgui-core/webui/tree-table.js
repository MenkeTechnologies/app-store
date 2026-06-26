// zgui-core/tree-table.js — a table whose rows are hierarchical: the expander column carries an
// indent + a ▸/▾ toggle, and expanding a row reveals its child rows in place. Ported behavior from
// PrimeReact's <TreeTable> (nodes[{key,data,children}], columns[{field,header,expander}],
// expandedKeys, onToggle, selection). window.ZGui.treeTable.
//   ZGui.treeTable(container, { columns:[{field,header,expander,width,render(value,node)}], nodes,
//       expandedKeys:{}, selectable, onToggle(key,open), onSelect(node) }) ->
//       { el, expand(key), collapse(key), toggle(key), set(nodes), getExpanded() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function treeTable(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let nodes = opts.nodes || [];
        const cols = opts.columns || [];
        const expanded = Object.assign({}, opts.expandedKeys);
        let selectedKey = null;

        const root = document.createElement("table"); root.className = "zg-treetable";
        host.appendChild(root);

        function cellValue(col, node) {
            const v = node.data ? node.data[col.field] : undefined;
            if (typeof col.render === "function") return col.render(v, node);
            return esc(v == null ? "" : v);
        }
        function render() {
            const head = "<thead><tr>" + cols.map((c) => `<th${c.width ? ` style="width:${typeof c.width === "number" ? c.width + "px" : c.width}"` : ""}>${esc(c.header || "")}</th>`).join("") + "</tr></thead>";
            const rows = [];
            (function walk(list, depth) {
                list.forEach((node) => {
                    const kids = node.children || [];
                    const isOpen = !!expanded[node.key];
                    const tds = cols.map((c, ci) => {
                        const isExp = c.expander || (ci === 0 && !cols.some((x) => x.expander));
                        const inner = cellValue(c, node);
                        if (isExp) {
                            const pad = `padding-left:${6 + depth * 18}px`;
                            const tog = kids.length ? `<span class="zg-treetable-tog" data-key="${esc(node.key)}">${isOpen ? "▾" : "▸"}</span>` : '<span class="zg-treetable-tog empty"></span>';
                            return `<td style="${pad}"><span class="zg-treetable-exp">${tog}<span>${inner}</span></span></td>`;
                        }
                        return `<td>${inner}</td>`;
                    }).join("");
                    rows.push(`<tr data-key="${esc(node.key)}" class="zg-treetable-row${selectedKey === node.key ? " selected" : ""}">${tds}</tr>`);
                    if (kids.length && isOpen) walk(kids, depth + 1);
                });
            })(nodes, 0);
            root.innerHTML = head + "<tbody>" + rows.join("") + "</tbody>";
        }
        function setOpen(key, open) { if (open) expanded[key] = true; else delete expanded[key]; render(); if (typeof opts.onToggle === "function") opts.onToggle(key, !!open); }

        root.addEventListener("click", (e) => {
            const tog = e.target.closest(".zg-treetable-tog");
            if (tog && tog.dataset.key) { e.stopPropagation(); setOpen(tog.dataset.key, !expanded[tog.dataset.key]); return; }
            const tr = e.target.closest(".zg-treetable-row");
            if (tr && opts.selectable) { selectedKey = tr.dataset.key; render(); if (typeof opts.onSelect === "function") opts.onSelect(findNode(nodes, selectedKey)); }
        });
        function findNode(list, key) { for (const n of list) { if (String(n.key) === String(key)) return n; const f = n.children && findNode(n.children, key); if (f) return f; } return null; }

        render();
        return {
            el: root,
            expand(key) { setOpen(key, true); }, collapse(key) { setOpen(key, false); }, toggle(key) { setOpen(key, !expanded[key]); },
            set(n) { nodes = n || []; render(); }, getExpanded() { return Object.assign({}, expanded); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.treeTable = treeTable;
})();
