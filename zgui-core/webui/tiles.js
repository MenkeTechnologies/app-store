// zgui-core/tiles.js — the generic launcher/tile-grid, distilled from Audio-Haxor's
// dashboard.js (itself ported from traderview's launcher.js): a prepopulated, categorized,
// searchable grid of clickable cards. Each tile activates a consumer callback; per-category
// order is drag-reorderable (via ZGui.drag) and persisted. window.ZGui.tiles.
//
//   ZGui.tiles.render(host, sections, {
//       onActivate(id, tile),     // required: fired on click / Enter
//       title: '// TILES',        // header label
//       placeholder: 'filter…',
//       search: true,             // show the filter input
//       dragPrefix: 'tilesOrder', // persist per-cat order under `${dragPrefix}_${cat}`
//   })
//
//   section: { cat, label, tiles: [{ id, label, desc, glyph }] }
//
// Returns a controller: { rerender(), setQuery(q), get query() }.
(function () {
    "use strict";

    const esc = window.escapeHtml || function (s) {
        const d = document.createElement("div");
        d.textContent = s == null ? "" : String(s);
        return d.innerHTML;
    };

    function matches(tile, q) {
        if (!q) return true;
        const hay = `${tile.label || ""} ${tile.desc || ""} ${tile.id || ""}`.toLowerCase();
        return hay.includes(q.toLowerCase());
    }

    function renderTile(tile) {
        return `<button class="zs-tile" data-tile="${esc(tile.id)}" tabindex="0" title="${esc(tile.desc || "")}">
            <span class="zs-tile-glyph">${tile.glyph || "&#9656;"}</span>
            <span class="zs-tile-body">
                <span class="zs-tile-label">${esc(tile.label)}</span>
                ${tile.desc ? `<span class="zs-tile-desc">${esc(tile.desc)}</span>` : ""}
            </span>
        </button>`;
    }

    function render(host, sections, opts) {
        opts = opts || {};
        const root = typeof host === "string" ? document.getElementById(host) : host;
        if (!root) return null;
        const showSearch = opts.search !== false;
        const tileById = new Map();
        (sections || []).forEach((sec) => (sec.tiles || []).forEach((t) => tileById.set(String(t.id), t)));
        let query = "";

        root.innerHTML = `
            <div class="zs-tiles">
                <div class="zs-tiles-head">
                    <h1 class="zs-tiles-title">${esc(opts.title || "// TILES")}</h1>
                    ${showSearch ? `<input class="zs-tiles-search" type="text" placeholder="${esc(opts.placeholder || "filter…")}" autocomplete="off" spellcheck="false">` : ""}
                </div>
                <div class="zs-tiles-grid"></div>
            </div>`;
        const grid = root.querySelector(".zs-tiles-grid");
        const search = root.querySelector(".zs-tiles-search");

        function activate(id) {
            if (typeof opts.onActivate === "function") opts.onActivate(id, tileById.get(String(id)));
        }

        function rerender() {
            let html = "";
            for (const sec of sections || []) {
                const tiles = (sec.tiles || []).filter((t) => matches(t, query));
                if (!tiles.length) continue;
                html += `<section class="zs-tiles-cat" data-cat="${esc(sec.cat)}">
                    <h2 class="zs-tiles-cat-head">${esc(sec.label)}</h2>
                    <div class="zs-tiles-row" data-cat="${esc(sec.cat)}">${tiles.map(renderTile).join("")}</div>
                </section>`;
            }
            grid.innerHTML = html || `<div class="zs-tiles-empty">No tiles match the filter.</div>`;

            grid.querySelectorAll(".zs-tile[data-tile]").forEach((el) => {
                el.addEventListener("click", () => activate(el.dataset.tile));
                el.addEventListener("keydown", (e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(el.dataset.tile); }
                });
            });

            // Per-category drag-reorder, only while unfiltered (so saved order isn't
            // derived from a partial list). Reuses the shared engine.
            const drag = window.ZGui && window.ZGui.drag;
            if (!query && opts.dragPrefix && drag) {
                grid.querySelectorAll(".zs-tiles-row[data-cat]").forEach((container) => {
                    container._trelloDragInit = false;
                    drag.init(container, ".zs-tile", `${opts.dragPrefix}_${container.dataset.cat}`, {
                        direction: "horizontal",
                        getKey: (el) => el.dataset.tile,
                        toastKey: "toast.reordered",
                    });
                });
            }
        }

        if (search) {
            search.addEventListener("input", () => { query = search.value.trim(); rerender(); });
            search.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    const first = grid.querySelector(".zs-tile[data-tile]");
                    if (first) activate(first.dataset.tile);
                }
            });
        }
        rerender();

        return {
            rerender,
            setQuery(q) { query = (q || "").trim(); if (search) search.value = query; rerender(); },
            get query() { return query; },
        };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.tiles = { render: render };
})();
