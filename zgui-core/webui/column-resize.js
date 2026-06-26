// zgui-core/column-resize.js — draggable column resizing with per-table % persistence, ported from
// Audio-Haxor's columns.js (the GENERIC core; haxor's col-actions min-width clamp becomes a
// configurable per-<th> `data-min-width` instead of a hardcoded class). Drag a `thead .col-resize`
// handle to steal width from the next column; widths persist as percentages (survive table resize)
// keyed by table id, versioned so a column-set change discards stale layouts. window.ZGui.columnResize.
//
//   ZGui.columnResize.init(table, { version=1, minWidth=40 })   // wire handles + restore widths
//   ZGui.columnResize.save(table)                               // persist current widths
//
// A column may set `data-min-width="152"` on its <th> to enforce a larger floor (e.g. action buttons).
(function () {
    "use strict";
    const prefs = window.prefs || {
        getObject(k, f) { try { const v = localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (_) { return f; } },
        setItem(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (_) {} },
    };
    function thMin(th, dflt) { const m = th && th.dataset ? parseInt(th.dataset.minWidth, 10) : NaN; return isNaN(m) ? dflt : m; }

    function save(table, version) {
        if (!table || !table.id) return;
        const w = table.offsetWidth;
        if (w <= 0) return;
        const ths = Array.from(table.querySelectorAll("thead th"));
        const keys = ths.map((th) => (th.dataset && th.dataset.key) || th.className || "");
        const pcts = ths.map((th) => +(th.offsetWidth / w * 100).toFixed(2));
        try {
            const all = prefs.getObject("columnWidths", {});
            all[table.id] = { v: version == null ? 1 : version, keys: keys, pcts: pcts };
            prefs.setItem("columnWidths", all);
        } catch (_) { /* quota */ }
    }
    function load(table, version) {
        try {
            const all = prefs.getObject("columnWidths", {});
            const entry = all[table.id];
            if (!entry || Array.isArray(entry)) return null;           // old plain-array format → discard
            if (entry.v !== (version == null ? 1 : version)) return null; // version mismatch → discard
            return entry.pcts || null;
        } catch (_) { return null; }
    }

    function init(table, opts) {
        if (!table) return;
        opts = opts || {};
        const version = opts.version == null ? 1 : opts.version;
        const minWidth = opts.minWidth == null ? 40 : opts.minWidth;
        requestAnimationFrame(function () {
            const ths = Array.from(table.querySelectorAll("thead th"));
            const tableWidth = table.offsetWidth;
            if (tableWidth > 0) {
                const saved = load(table, version);
                if (saved && saved.length === ths.length && saved.every((w) => w > 0)) {
                    ths.forEach((th, i) => { th.style.width = (saved[i] / 100 * tableWidth) + "px"; });
                } else {
                    ths.forEach((th) => { th.style.width = th.offsetWidth + "px"; });
                }
            }
            table.querySelectorAll("thead .col-resize").forEach(function (handle) {
                handle.addEventListener("mousedown", function (e) {
                    e.preventDefault(); e.stopPropagation();
                    const th = handle.closest("th");
                    const nextTh = th.nextElementSibling;
                    if (!nextTh) return;
                    const startX = e.clientX;
                    const startWidth = th.offsetWidth;
                    const nextStartWidth = nextTh.offsetWidth;
                    const nextMin = thMin(nextTh, minWidth);
                    handle.classList.add("resizing");
                    document.body.classList.add("col-resizing");
                    function onMove(ev) {
                        const delta = ev.clientX - startX;
                        const newW = Math.max(minWidth, startWidth + delta);
                        const newNext = Math.max(nextMin, nextStartWidth - delta);
                        if (newW >= minWidth && newNext >= nextMin) {
                            th.style.width = newW + "px";
                            nextTh.style.width = newNext + "px";
                        }
                    }
                    function onUp() {
                        handle.classList.remove("resizing");
                        document.body.classList.remove("col-resizing");
                        document.removeEventListener("mousemove", onMove);
                        document.removeEventListener("mouseup", onUp);
                        save(table, version);
                    }
                    document.addEventListener("mousemove", onMove);
                    document.addEventListener("mouseup", onUp);
                });
            });
        });
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.columnResize = { init: init, save: save };
})();
