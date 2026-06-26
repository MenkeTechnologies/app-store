// zgui-core/timeline.js — a vertical event timeline (dots on a rail + time/title/desc). window.ZGui.timeline.
//   ZGui.timeline(container, [{ time, title, desc, color, icon }]) -> { el, set(items) }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    function timeline(container, items) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        host.classList.add("zg-timeline");
        function draw(list) {
            host.innerHTML = "";
            (list || []).forEach((it) => {
                const row = el("div", "zg-tl-item", host);
                const dot = el("span", "zg-tl-dot", row); if (it.color) dot.style.background = it.color;
                if (it.icon) dot.textContent = it.icon;
                const c = el("div", "zg-tl-content", row);
                const head = el("div", "zg-tl-head", c);
                el("span", "zg-tl-title", head).innerHTML = esc(it.title);
                if (it.time != null) el("span", "zg-tl-time", head, it.time);
                if (it.desc != null) { el("div", "zg-tl-desc", c).innerHTML = esc(it.desc); }
            });
        }
        draw(items);
        return { el: host, set: draw };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.timeline = timeline;
})();
