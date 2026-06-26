// zgui-core/org-chart.js — a top-down organization chart: nodes laid out in levels with connector
// lines between parent and children; nodes with children collapse/expand. Ported behavior from
// PrimeReact's <OrganizationChart> (node{label,children,expanded,className}, selection, nodeTemplate).
// The classic nested <ul>/<li> + CSS-border connector technique. window.ZGui.orgChart.
//   ZGui.orgChart(container, { node:{label,children,expanded,className,key}, selectable,
//       onSelect(node), nodeRender(node)->html }) -> { el, set(node) }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function orgChart(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let rootNode = opts.node || null;
        let selectedKey = null;

        const root = document.createElement("div"); root.className = "zg-orgchart";
        host.appendChild(root);

        function nodeHtml(node) {
            if (typeof opts.nodeRender === "function") return opts.nodeRender(node);
            return esc(node.label != null ? node.label : "");
        }
        function render() {
            if (!rootNode) { root.innerHTML = ""; return; }
            root.innerHTML = "<ul>" + renderNode(rootNode) + "</ul>";
        }
        function renderNode(node) {
            const kids = node.children || [];
            const open = node.expanded !== false;
            const key = node.key != null ? node.key : (node.label || "");
            const hasKids = kids.length > 0;
            const cls = "zg-orgchart-node" + (node.className ? " " + node.className : "") + (selectedKey === key ? " selected" : "") + (hasKids ? " has-children" : "");
            const toggle = hasKids ? `<span class="zg-orgchart-toggle" data-key="${esc(key)}">${open ? "−" : "+"}</span>` : "";
            let html = `<li><div class="${cls}" data-key="${esc(key)}">${nodeHtml(node)}${toggle}</div>`;
            if (hasKids && open) html += "<ul>" + kids.map(renderNode).join("") + "</ul>";
            html += "</li>";
            return html;
        }
        function findNode(node, key) { if (!node) return null; const k = node.key != null ? node.key : node.label; if (String(k) === String(key)) return node; for (const c of (node.children || [])) { const f = findNode(c, key); if (f) return f; } return null; }

        root.addEventListener("click", (e) => {
            const tog = e.target.closest(".zg-orgchart-toggle");
            if (tog) { e.stopPropagation(); const n = findNode(rootNode, tog.dataset.key); if (n) { n.expanded = n.expanded === false; render(); } return; }
            const box = e.target.closest(".zg-orgchart-node");
            if (box && opts.selectable) { selectedKey = box.dataset.key; render(); if (typeof opts.onSelect === "function") opts.onSelect(findNode(rootNode, selectedKey)); }
        });

        render();
        return { el: root, set(n) { rootNode = n; render(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.orgChart = orgChart;
})();
