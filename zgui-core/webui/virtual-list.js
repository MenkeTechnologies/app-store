// zgui-core/virtual-list.js — windowed rendering for huge lists (only the visible rows are in the
// DOM). Fixed row height. Handles the 17k-item lists across the suite without 17k DOM nodes.
// window.ZGui.virtualList.
//
//   ZGui.virtualList(container, { items, rowHeight, render(item,i)->Node, overscan }) -> { el, setItems(a), scrollTo(i), refresh() }
(function () {
    "use strict";
    function virtualList(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const rh = opts.rowHeight || 28, over = opts.overscan == null ? 6 : opts.overscan;
        let items = opts.items || [];
        host.classList.add("zg-vlist"); host.style.overflowY = "auto"; host.style.position = "relative";
        const spacer = document.createElement("div"); spacer.className = "zg-vlist-spacer";
        const win = document.createElement("div"); win.className = "zg-vlist-win"; win.style.position = "absolute"; win.style.left = "0"; win.style.right = "0";
        host.appendChild(spacer); host.appendChild(win);
        function draw() {
            spacer.style.height = (items.length * rh) + "px";
            const top = host.scrollTop, vh = host.clientHeight || 300;
            const first = Math.max(0, Math.floor(top / rh) - over);
            const last = Math.min(items.length, Math.ceil((top + vh) / rh) + over);
            win.style.top = (first * rh) + "px";
            win.innerHTML = "";
            for (let i = first; i < last; i++) {
                const node = opts.render ? opts.render(items[i], i) : document.createTextNode(String(items[i]));
                if (node.style) node.style.height = rh + "px";
                win.appendChild(node);
            }
        }
        host.addEventListener("scroll", draw);
        if (typeof ResizeObserver === "function") new ResizeObserver(draw).observe(host);
        draw();
        return { el: host, setItems(a) { items = a || []; host.scrollTop = 0; draw(); }, scrollTo(i) { host.scrollTop = i * rh; }, refresh: draw };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.virtualList = virtualList;
})();
