// zgui-core/pager.js — pagination control: prev / numbered pages / next. window.ZGui.pager.
//
//   const p = ZGui.pager(container, { page:1, pages:10, onPage(n) }); p.set(3); p.setPages(20);
(function () {
    "use strict";
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    function pager(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let page = opts.page || 1, pages = opts.pages || 1;
        function go(n) { n = Math.max(1, Math.min(pages, n)); if (n === page) return; page = n; render(); if (typeof opts.onPage === "function") opts.onPage(page); }
        function btn(label, n, dis, cur) {
            const b = el("button", "zg-pager-btn" + (cur ? " is-current" : ""), host, label); b.type = "button";
            if (dis) b.disabled = true; else b.addEventListener("click", () => go(n));
            return b;
        }
        function render() {
            host.className = "zg-pager"; host.innerHTML = "";
            btn("‹", page - 1, page <= 1);
            const win = 2, lo = Math.max(1, page - win), hi = Math.min(pages, page + win);
            if (lo > 1) { btn("1", 1); if (lo > 2) el("span", "zg-pager-gap", host, "…"); }
            for (let i = lo; i <= hi; i++) btn(String(i), i, false, i === page);
            if (hi < pages) { if (hi < pages - 1) el("span", "zg-pager-gap", host, "…"); btn(String(pages), pages); }
            btn("›", page + 1, page >= pages);
        }
        render();
        return { el: host, set: go, setPages(n) { pages = Math.max(1, n); if (page > pages) page = pages; render(); }, get page() { return page; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.pager = pager;
})();
