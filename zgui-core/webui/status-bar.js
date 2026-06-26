// zgui-core/status-bar.js — a bottom status strip with left / center / right slots + item helper.
// window.ZGui.statusBar.
//
//   const sb = ZGui.statusBar(container); sb.left.append(sb.item('CPU','8')); sb.set('right', node);
(function () {
    "use strict";
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    function statusBar(container) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        host.classList.add("zg-statusbar");
        const left = el("div", "zg-statusbar-left", host);
        const center = el("div", "zg-statusbar-center", host);
        const right = el("div", "zg-statusbar-right", host);
        return {
            el: host, left, center, right,
            item(label, value) { const i = el("span", "zg-statusbar-item"); if (label != null) el("span", "zg-statusbar-lbl", i, label); el("span", "zg-statusbar-val", i, value != null ? value : ""); return i; },
            set(slot, node) { const s = { left, center, right }[slot]; if (s) { s.innerHTML = ""; if (node) s.appendChild(node); } },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.statusBar = statusBar;
})();
