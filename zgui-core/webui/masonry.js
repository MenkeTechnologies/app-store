// zgui-core/masonry.js — a masonry layout: blocks of equal width / variable height packed into N
// columns, each item added to the SHORTEST column (MUI Masonry's algorithm), or left-to-right when
// `sequential`. Ported behavior from MUI's <Masonry> (columns / spacing / sequential). window.ZGui.masonry.
//   ZGui.masonry(container, { columns:3, gap:12, sequential:false, items:[node…] }) ->
//       { el, add(node), set(nodes), clear(), relayout(), setColumns(n) }
(function () {
    "use strict";
    function masonry(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let cols = opts.columns || 3;
        const gap = opts.gap == null ? 12 : opts.gap;
        const sequential = !!opts.sequential;
        const items = [];

        const root = document.createElement("div");
        root.className = "zg-masonry";
        root.style.gap = gap + "px";
        host.appendChild(root);
        let colEls = [];

        function buildCols() {
            root.innerHTML = "";
            colEls = [];
            for (let i = 0; i < cols; i++) { const c = document.createElement("div"); c.className = "zg-masonry-col"; c.style.gap = gap + "px"; root.appendChild(c); colEls.push(c); }
        }
        function shortest() {
            // pick the column with the least rendered height (offsetHeight). Falls back to round-robin
            // before layout resolves (offsetHeight 0 for all → index 0, evened out on relayout()).
            let best = 0, min = Infinity;
            for (let i = 0; i < colEls.length; i++) { const h = colEls[i].offsetHeight; if (h < min) { min = h; best = i; } }
            return best;
        }
        function place(node, i) {
            const c = sequential ? colEls[i % cols] : colEls[shortest()];
            c.appendChild(node);
        }
        function relayout() { buildCols(); items.forEach((n, i) => place(n, i)); }

        buildCols();
        (opts.items || []).forEach((n) => { if (n) { items.push(n.el || n); } });
        items.forEach((n, i) => place(n, i));

        return {
            el: root,
            add(node) { const n = node && (node.el || node); if (!n) return; items.push(n); place(n, items.length - 1); },
            set(nodes) { items.length = 0; (nodes || []).forEach((n) => { if (n) items.push(n.el || n); }); relayout(); },
            clear() { items.length = 0; buildCols(); },
            setColumns(n) { cols = Math.max(1, n | 0); relayout(); },
            relayout,
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.masonry = masonry;
})();
