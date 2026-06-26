// zgui-core/thumbnail-rail.js — a vertical (or horizontal) strip of page/slide thumbnails with index
// labels and an active highlight; click or arrow-keys to select, auto-scrolls the active one into view.
// Generic page navigator (PDF readers, slide decks, image galleries). Extracted from zpdf's page sidebar.
// window.ZGui.thumbnailRail.
//   ZGui.thumbnailRail(container, { items:[{label,src,render(canvas|el)}], active:0, horizontal:false,
//       showLabels:true, onSelect(index) }) -> { el, set(items), select(i), getActive() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function thumbnailRail(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let items = opts.items || [];
        let active = opts.active || 0;

        const root = document.createElement("div"); root.className = "zg-thumbrail" + (opts.horizontal ? " horizontal" : "");
        host.appendChild(root);

        function render() {
            root.innerHTML = "";
            items.forEach((it, i) => {
                const cell = document.createElement("div");
                cell.className = "zg-thumbrail-item" + (i === active ? " active" : "");
                cell.tabIndex = 0; cell.dataset.i = i;
                const frame = document.createElement("div"); frame.className = "zg-thumbrail-frame";
                if (it.src) { const img = document.createElement("img"); img.className = "zg-thumbrail-img"; img.src = it.src; img.alt = ""; frame.appendChild(img); }
                else if (typeof it.render === "function") it.render(frame);
                cell.appendChild(frame);
                if (opts.showLabels !== false) { const lbl = document.createElement("div"); lbl.className = "zg-thumbrail-label"; lbl.textContent = it.label != null ? it.label : (i + 1); cell.appendChild(lbl); }
                root.appendChild(cell);
            });
            scrollActiveIntoView();
        }
        function scrollActiveIntoView() { const a = root.querySelector(".zg-thumbrail-item.active"); if (a && a.scrollIntoView) a.scrollIntoView({ block: "nearest", inline: "nearest" }); }
        function select(i) { if (i < 0 || i >= items.length) return; active = i; root.querySelectorAll(".zg-thumbrail-item").forEach((c, idx) => c.classList.toggle("active", idx === i)); scrollActiveIntoView(); if (typeof opts.onSelect === "function") opts.onSelect(i); }

        root.addEventListener("click", (e) => { const c = e.target.closest(".zg-thumbrail-item"); if (c) select(+c.dataset.i); });
        root.addEventListener("keydown", (e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); select(Math.min(items.length - 1, active + 1)); const n = root.querySelector(".zg-thumbrail-item.active"); if (n) n.focus(); }
            else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); select(Math.max(0, active - 1)); const n = root.querySelector(".zg-thumbrail-item.active"); if (n) n.focus(); }
            else if (e.key === "Enter") { e.preventDefault(); if (typeof opts.onSelect === "function") opts.onSelect(active); }
        });

        render();
        return { el: root, set(n) { items = n || []; if (active >= items.length) active = Math.max(0, items.length - 1); render(); }, select, getActive() { return active; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.thumbnailRail = thumbnailRail;
})();
