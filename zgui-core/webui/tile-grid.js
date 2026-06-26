// zgui-core/tile-grid.js — a panel-grid DASHBOARD: a grid of content tiles with a grid↔single mode
// toggle (single shows only the active tile), fullscreen, and the cyberpunk clip-path tile chrome.
// Distilled from Audio-Haxor's visualizer (.viz-grid/.viz-tile/.viz-mode-btn). Distinct from
// ZGui.tiles (a launcher catalog of clickable cards) — here each tile is a live panel the app fills.
// The app supplies tiles + a render(bodyEl) per tile; this owns layout, modes, fullscreen. ZGui.tileGrid.
//
//   ZGui.tileGrid(container, {
//       tiles: [{ key, title, render(bodyEl) }],
//       columns: 3, modes: true, fullscreen: true,
//       onModeChange(mode),     // 'all' (grid) or a tile key (single)
//   }) -> { el, setMode(mode), mode(), toggleFullscreen(), exitFullscreen(), tile(key), bodyOf(key) }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    const tr = (k, d) => (window.ZGui && window.ZGui.i18n) ? window.ZGui.i18n.t(d || k) : (d || k);
    function el(t, c, p) { const e = document.createElement(t); if (c) e.className = c; if (p) p.appendChild(e); return e; }

    function tileGrid(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const tiles = opts.tiles || [];
        let mode = "all";
        host.classList.add("zg-tilegrid");

        // toolbar (mode buttons + fullscreen)
        let toolbar = null;
        if (opts.modes !== false || opts.fullscreen !== false) {
            toolbar = el("div", "zg-tilegrid-toolbar", host);
            if (opts.modes !== false) {
                const btns = el("div", "zg-tilegrid-modes", toolbar);
                const mk = (key, label) => { const b = el("button", "zg-tilegrid-mode" + (key === "all" ? " active" : ""), btns); b.type = "button"; b.dataset.mode = key; b.textContent = label; };
                mk("all", tr("ui.all", "All"));
                tiles.forEach((t) => mk(t.key, t.title || t.key));
            }
            if (opts.fullscreen !== false) {
                const fs = el("button", "zg-tilegrid-fs", toolbar); fs.type = "button"; fs.dataset.action = "fullscreen";
                fs.title = tr("menu.toggle_fullscreen", "Fullscreen"); fs.innerHTML = "&#9974;";
            }
        }

        const grid = el("div", "zg-tilegrid-grid", host);
        if (opts.columns) grid.style.gridTemplateColumns = "repeat(" + opts.columns + ", 1fr)";
        const bodies = {};
        tiles.forEach((t) => {
            const tile = el("div", "zg-tilegrid-tile", grid);
            tile.dataset.tile = t.key;
            if (t.title) { const head = el("div", "zg-tilegrid-tile-head", tile); head.textContent = t.title; }
            const body = el("div", "zg-tilegrid-tile-body", tile);
            bodies[t.key] = body;
            if (typeof t.render === "function") t.render(body);
        });

        function setMode(m) {
            mode = m;
            if (toolbar) toolbar.querySelectorAll(".zg-tilegrid-mode").forEach((b) => b.classList.toggle("active", b.dataset.mode === m));
            if (m === "all") {
                grid.classList.remove("zg-tilegrid-single");
                grid.querySelectorAll(".zg-tilegrid-tile").forEach((t) => t.classList.remove("zg-tilegrid-tile-active"));
            } else {
                grid.classList.add("zg-tilegrid-single");
                grid.querySelectorAll(".zg-tilegrid-tile").forEach((t) => t.classList.toggle("zg-tilegrid-tile-active", t.dataset.tile === m));
            }
            if (typeof opts.onModeChange === "function") opts.onModeChange(m);
        }
        function toggleFullscreen() { host.classList.toggle("zg-tilegrid-fullscreen"); }
        function exitFullscreen() { host.classList.remove("zg-tilegrid-fullscreen"); }

        if (toolbar) toolbar.addEventListener("click", (e) => {
            const fs = e.target.closest('[data-action="fullscreen"]'); if (fs) { toggleFullscreen(); return; }
            const b = e.target.closest(".zg-tilegrid-mode"); if (b && b.dataset.mode) setMode(b.dataset.mode);
        });
        document.addEventListener("keydown", (e) => { if (e.key === "Escape" && host.classList.contains("zg-tilegrid-fullscreen")) exitFullscreen(); });

        return { el: host, setMode, mode: () => mode, toggleFullscreen, exitFullscreen, tile: (k) => grid.querySelector('[data-tile="' + k + '"]'), bodyOf: (k) => bodies[k] };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.tileGrid = tileGrid;
})();
