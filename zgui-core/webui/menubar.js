// zgui-core/menubar.js — a horizontal application menu bar; each top item opens a ZGui.contextMenu.
// window.ZGui.menubar.   ZGui.menubar(container, [{ label, items:[…ctxItems] }]) -> { el }
(function () {
    "use strict";
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    function menubar(container, menus) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        host.classList.add("zg-menubar");
        (menus || []).forEach((m) => {
            const b = el("button", "zg-menubar-item", host, m.label); b.type = "button";
            b.addEventListener("click", (e) => {
                const cm = window.ZGui && window.ZGui.contextMenu;
                const items = typeof m.items === "function" ? m.items() : m.items;
                if (cm) { const r = b.getBoundingClientRect(); cm.show({ clientX: r.left, clientY: r.bottom, preventDefault() {}, stopPropagation() {} }, items); }
            });
        });
        return { el: host };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.menubar = menubar;
})();
