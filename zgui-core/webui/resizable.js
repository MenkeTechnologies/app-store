// zgui-core/resizable.js — make any element 8-way resizable, ported from Audio-Haxor's similar-panel
// resize (audio.js initSimilarPanelDrag). Injects 8 edge/corner handles (n/s/e/w + 4 corners) with
// the right cursors and runs the faithful resize math: corner-anchored sizing with min clamps, size
// persisted per id. modal-drag.js does this for modals only — this is the standalone version for any
// floating panel, tool window, or inspector. window.ZGui.resizable.
//
//   ZGui.resizable(elementOrId, {
//       minWidth:240, minHeight:150,
//       persist:'myPanel',        // persist width/height under this key (optional)
//       onResize(w, h),           // fired during resize (optional)
//   }) -> { el, destroy() }
(function () {
    "use strict";
    const EDGES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
    const CURSOR = { n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize" };
    const prefs = window.prefs || {
        getItem(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
        setItem(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
    };

    function ensureHandles(panel) {
        if (panel.querySelector(":scope > [data-zg-resize]")) return;
        EDGES.forEach((edge) => {
            const h = document.createElement("div");
            h.className = "zg-resize zg-resize-" + edge;
            h.setAttribute("data-zg-resize", edge);
            panel.appendChild(h);
        });
    }

    function resizable(elementOrId, opts) {
        const panel = typeof elementOrId === "string" ? (document.getElementById(elementOrId) || document.querySelector(elementOrId)) : elementOrId;
        if (!panel) return null;
        opts = opts || {};
        const minW = opts.minWidth == null ? 240 : opts.minWidth;
        const minH = opts.minHeight == null ? 150 : opts.minHeight;
        if (getComputedStyle(panel).position === "static") panel.style.position = "absolute";
        ensureHandles(panel);

        // restore persisted size
        if (opts.persist) {
            const w = prefs.getItem(opts.persist + ".w"), h = prefs.getItem(opts.persist + ".h");
            if (w) panel.style.width = parseInt(w, 10) + "px";
            if (h) panel.style.height = parseInt(h, 10) + "px";
        }

        let resizing = null;
        function onDown(e) {
            const handle = e.target.closest("[data-zg-resize]");
            if (!handle || !panel.contains(handle)) return;
            e.preventDefault(); e.stopPropagation();
            const rect = panel.getBoundingClientRect();
            panel.style.left = rect.left + "px"; panel.style.top = rect.top + "px";
            panel.style.right = "auto"; panel.style.bottom = "auto";
            panel.style.width = rect.width + "px"; panel.style.height = rect.height + "px";
            document.body.style.userSelect = "none";
            document.body.style.cursor = CURSOR[handle.dataset.zgResize] || "";
            resizing = { edge: handle.dataset.zgResize, startX: e.clientX, startY: e.clientY, origLeft: rect.left, origTop: rect.top, origW: rect.width, origH: rect.height };
        }
        function onMove(e) {
            if (!resizing) return;
            const s = resizing, dx = e.clientX - s.startX, dy = e.clientY - s.startY;
            let l = s.origLeft, t = s.origTop, w = s.origW, h = s.origH;
            if (s.edge.includes("e")) w = Math.max(minW, s.origW + dx);
            if (s.edge.includes("w")) { w = Math.max(minW, s.origW - dx); l = s.origLeft + s.origW - w; }
            if (s.edge.includes("s")) h = Math.max(minH, s.origH + dy);
            if (s.edge.includes("n")) { h = Math.max(minH, s.origH - dy); t = s.origTop + s.origH - h; }
            panel.style.left = l + "px"; panel.style.top = t + "px"; panel.style.width = w + "px"; panel.style.height = h + "px";
            if (typeof opts.onResize === "function") opts.onResize(w, h);
        }
        function onUp() {
            if (!resizing) return;
            const rect = panel.getBoundingClientRect();
            if (opts.persist) { prefs.setItem(opts.persist + ".w", String(Math.round(rect.width))); prefs.setItem(opts.persist + ".h", String(Math.round(rect.height))); }
            resizing = null;
            document.body.style.userSelect = ""; document.body.style.cursor = "";
        }
        panel.addEventListener("mousedown", onDown);
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);

        return { el: panel, destroy() { panel.removeEventListener("mousedown", onDown); document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.resizable = resizable;
})();
