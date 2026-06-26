// zgui-core/toolbar.js — a toolbar row with left / spacer / right grouping + separators.
// window.ZGui.toolbar.
//   const tb = ZGui.toolbar(container); tb.add(node); tb.sep(); tb.add(node,'right');
(function () {
    "use strict";
    function el(t, c, p) { const e = document.createElement(t); if (c) e.className = c; if (p) p.appendChild(e); return e; }
    function toolbar(container) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        host.classList.add("zg-toolbar");
        const left = el("div", "zg-toolbar-group", host);
        const spacer = el("div", "zg-toolbar-spacer", host);
        const right = el("div", "zg-toolbar-group", host);
        return {
            el: host, left, right,
            add(node, side) { (side === "right" ? right : left).appendChild(node && node.el ? node.el : node); return node; },
            sep(side) { (side === "right" ? right : left).appendChild(el("span", "zg-toolbar-sep")); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.toolbar = toolbar;
})();
