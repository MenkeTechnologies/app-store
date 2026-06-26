// zgui-core/tree-select.js — a select whose dropdown is an expandable tree; pick one node or many
// (checkbox mode). Ported behavior from Ant Design's <TreeSelect> (treeData[{title,value,children}],
// value, multiple, treeCheckable, showSearch, treeDefaultExpandAll, onChange). window.ZGui.treeSelect.
//   ZGui.treeSelect(container, { treeData, value, multiple:false, checkable:false, showSearch:false,
//       placeholder, defaultExpandAll:false, onChange(value, labels) }) -> { el, get(), set(v), open(), close() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function treeSelect(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const multi = !!opts.multiple || !!opts.checkable;
        let value = multi ? (opts.value || []).slice() : (opts.value != null ? opts.value : null);
        const expanded = new Set();
        const labelByValue = {};
        (function walk(nodes) { (nodes || []).forEach((n) => { labelByValue[n.value] = n.title; if (opts.defaultExpandAll && n.children) expanded.add(n.value); walk(n.children); }); })(opts.treeData);

        const root = document.createElement("div"); root.className = "zg-treeselect";
        const trig = document.createElement("button"); trig.type = "button"; trig.className = "zg-treeselect-trigger";
        const pop = document.createElement("div"); pop.className = "zg-treeselect-pop"; pop.hidden = true;
        let search = null;
        if (opts.showSearch) { search = document.createElement("input"); search.className = "zg-treeselect-search"; search.placeholder = "Search…"; pop.appendChild(search); }
        const treeBox = document.createElement("div"); treeBox.className = "zg-treeselect-tree"; pop.appendChild(treeBox);
        root.appendChild(trig); root.appendChild(pop); host.appendChild(root);

        function isSelected(v) { return multi ? value.indexOf(v) >= 0 : value === v; }
        function renderTrigger() {
            const sel = multi ? value : (value != null ? [value] : []);
            if (sel.length) trig.innerHTML = `<span class="zg-treeselect-val">${sel.map((v) => esc(labelByValue[v] != null ? labelByValue[v] : v)).join(", ")}</span><span class="zg-treeselect-caret">▾</span>`;
            else trig.innerHTML = `<span class="zg-treeselect-ph">${esc(opts.placeholder || "Select…")}</span><span class="zg-treeselect-caret">▾</span>`;
        }
        function renderTree() {
            const q = search ? search.value.toLowerCase() : "";
            treeBox.innerHTML = "";
            (function build(nodes, depth) {
                (nodes || []).forEach((n) => {
                    const match = !q || String(n.title).toLowerCase().includes(q);
                    const kids = n.children || [];
                    if (match || subtreeMatches(n, q)) {
                        const row = document.createElement("div"); row.className = "zg-treeselect-node" + (isSelected(n.value) ? " selected" : ""); row.style.paddingLeft = (6 + depth * 16) + "px";
                        const tog = kids.length ? `<span class="zg-treeselect-tog">${expanded.has(n.value) || q ? "▾" : "▸"}</span>` : '<span class="zg-treeselect-tog empty"></span>';
                        const box = opts.checkable ? `<span class="zg-treeselect-check${isSelected(n.value) ? " on" : ""}"></span>` : "";
                        row.innerHTML = `${tog}${box}<span class="zg-treeselect-label">${esc(n.title)}</span>`;
                        row.querySelector(".zg-treeselect-tog").addEventListener("click", (e) => { e.stopPropagation(); if (kids.length) { if (expanded.has(n.value)) expanded.delete(n.value); else expanded.add(n.value); renderTree(); } });
                        row.querySelector(".zg-treeselect-label").addEventListener("click", () => pick(n));
                        if (box) row.querySelector(".zg-treeselect-check").addEventListener("click", () => pick(n));
                        treeBox.appendChild(row);
                        if (kids.length && (expanded.has(n.value) || q)) build(kids, depth + 1);
                    }
                });
            })(opts.treeData, 0);
        }
        function subtreeMatches(n, q) { if (!q) return false; return (n.children || []).some((c) => String(c.title).toLowerCase().includes(q) || subtreeMatches(c, q)); }
        function pick(n) {
            if (multi) { const i = value.indexOf(n.value); if (i >= 0) value.splice(i, 1); else value.push(n.value); }
            else { value = n.value; }
            renderTrigger(); renderTree();
            if (typeof opts.onChange === "function") opts.onChange(multi ? value.slice() : value, multi ? value.map((v) => labelByValue[v]) : labelByValue[value]);
            if (!multi) close();
        }
        function open() { pop.hidden = false; root.classList.add("is-open"); renderTree(); document.addEventListener("pointerdown", outside, true); if (search) search.focus(); }
        function close() { pop.hidden = true; root.classList.remove("is-open"); document.removeEventListener("pointerdown", outside, true); }
        function outside(e) { if (!root.contains(e.target)) close(); }
        trig.addEventListener("click", () => (pop.hidden ? open() : close()));
        if (search) search.addEventListener("input", renderTree);

        renderTrigger();
        return { el: root, get() { return multi ? value.slice() : value; }, set(v) { value = multi ? (v || []).slice() : v; renderTrigger(); }, open, close };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.treeSelect = treeSelect;
})();
