// zgui-core/tree.js — a data-driven collapsible tree, distilled from the PATTERN behind zreq's
// collection tree (caret + icon + label + row actions + nested children). Generic: the consumer
// passes a node tree, the core renders/toggles/selects it. Reusable for collection trees, file
// trees, mailbox folders, nested JSON, container hierarchies. window.ZGui.tree.
//
//   node: { id?, label, icon?, expanded?, selectable?, children?, actions?: [{icon,title,onClick(node)}], data? }
//
//   ZGui.tree.render(container, nodes, {
//       getChildren: (node) => node.children,   // override how children are read
//       defaultExpanded: true,
//       onSelect: (node, rowEl) => {},
//       onToggle: (node, open) => {},
//   }) -> { el, expandAll(), collapseAll(), refresh(nodes?) }
(function () {
    "use strict";

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }

    function render(container, nodes, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const getChildren = opts.getChildren || function (n) { return n.children; };
        const defaultExpanded = opts.defaultExpanded !== false;
        let selectedRow = null;

        function select(node, row) {
            if (selectedRow) selectedRow.classList.remove("selected");
            selectedRow = row;
            row.classList.add("selected");
            if (typeof opts.onSelect === "function") opts.onSelect(node, row);
        }

        function nodeEl(node, depth) {
            const wrap = el("div", "zg-tree-node");
            const row = el("div", "zg-tree-row");
            const kids = getChildren(node) || [];
            const hasKids = kids.length > 0;
            let open = node.expanded != null ? !!node.expanded : defaultExpanded;

            const caret = el("span", "zg-tree-caret", hasKids ? (open ? "▾" : "▸") : "");
            const icon = el("span", "zg-tree-icon", node.icon || (hasKids ? "▸" : "•"));
            if (node.icon) icon.textContent = node.icon;
            else if (!hasKids) icon.textContent = "•";
            else icon.textContent = "";
            const label = el("span", "zg-tree-label", node.label != null ? node.label : "");
            row.append(caret, icon, label);

            (node.actions || []).forEach(function (a) {
                const act = el("span", "zg-tree-act", a.icon || "•");
                if (a.title) act.title = a.title;
                act.addEventListener("click", function (e) { e.stopPropagation(); if (typeof a.onClick === "function") a.onClick(node); });
                row.append(act);
            });

            wrap.append(row);

            let childBox = null;
            if (hasKids) {
                childBox = el("div", "zg-tree-children");
                childBox.style.display = open ? "block" : "none";
                kids.forEach(function (child) { childBox.append(nodeEl(child, depth + 1)); });
                wrap.append(childBox);
            }

            function toggle() {
                if (!hasKids) return;
                open = !open;
                childBox.style.display = open ? "block" : "none";
                caret.textContent = open ? "▾" : "▸";
                if (typeof opts.onToggle === "function") opts.onToggle(node, open);
            }
            caret.addEventListener("click", function (e) { e.stopPropagation(); toggle(); });
            row.addEventListener("click", function () {
                if (node.selectable !== false) select(node, row);
                else toggle();
            });

            wrap._setOpen = function (v) { if (hasKids && open !== v) toggle(); kids.forEach(function (c, i) { const ce = childBox.children[i]; if (ce && ce._setOpen) ce._setOpen(v); }); };
            return wrap;
        }

        function draw(list) {
            host.innerHTML = "";
            host.classList.add("zg-tree");
            (list || []).forEach(function (n) { host.append(nodeEl(n, 0)); });
        }
        draw(nodes);

        return {
            el: host,
            expandAll() { [...host.children].forEach(function (c) { if (c._setOpen) c._setOpen(true); }); },
            collapseAll() { [...host.children].forEach(function (c) { if (c._setOpen) c._setOpen(false); }); },
            refresh(next) { draw(next || nodes); },
        };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.tree = { render: render };
})();
