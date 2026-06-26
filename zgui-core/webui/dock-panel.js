// zgui-core/dock-panel.js — drag a floating panel by its toolbar; on release it SNAPS to the nearest
// screen quadrant (top-left / top-right / bottom-left / bottom-right) and stays docked there. Ported
// from Audio-Haxor's similar-panel drag (audio.js initSimilarPanelDrag) — the same dock-tl/tr/bl/br
// pattern its terminal pane, now-playing bar, and similar panel all share. Completes the floating-panel
// trio: distinct from floatingDock (relocate between containers, no snap) and modalDrag (free move, no
// snap); pairs with ZGui.resizable for 8-way sizing. window.ZGui.dockPanel.
//
//   ZGui.dockPanel(panelOrId, {
//       handle:'.zg-dock-toolbar',   // the drag grip (default), e.g. the panel's titlebar
//       ignore:'.zg-dock-actions',   // descendant whose clicks should NOT start a drag (buttons)
//       persist:'similarDock',       // persist the chosen corner under this key
//       onDock(corner),              // 'tl'|'tr'|'bl'|'br' after a snap (optional)
//   }) -> { el, dock(corner), destroy() }
(function () {
    "use strict";
    const CORNERS = { tl: "zg-dock-tl", tr: "zg-dock-tr", bl: "zg-dock-bl", br: "zg-dock-br" };
    const prefs = window.prefs || {
        getItem(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
        setItem(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
    };
    function nearestCorner(x, y) {
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        if (x < cx && y < cy) return "tl";
        if (x >= cx && y < cy) return "tr";
        if (x < cx && y >= cy) return "bl";
        return "br";
    }
    function dockPanel(panelOrId, opts) {
        const panel = typeof panelOrId === "string" ? (document.getElementById(panelOrId) || document.querySelector(panelOrId)) : panelOrId;
        if (!panel) return null;
        opts = opts || {};
        const handle = panel.querySelector(opts.handle || ".zg-dock-toolbar") || panel;
        const ignoreSel = opts.ignore || ".zg-dock-actions";

        function applyDock(corner) {
            Object.values(CORNERS).forEach((c) => panel.classList.remove(c));
            panel.style.left = ""; panel.style.top = ""; panel.style.right = ""; panel.style.bottom = "";
            panel.classList.add(CORNERS[corner] || CORNERS.br);
            if (opts.persist) prefs.setItem(opts.persist, corner);
            if (typeof opts.onDock === "function") opts.onDock(corner);
        }
        // restore persisted corner
        if (opts.persist) { const saved = prefs.getItem(opts.persist); if (saved && CORNERS[saved]) applyDock(saved); }

        let dragging = false, startX = 0, startY = 0, origX = 0, origY = 0;
        function onDown(e) {
            if (e.button !== 0) return;
            if (ignoreSel && e.target.closest && e.target.closest(ignoreSel)) return;
            e.preventDefault();
            dragging = true;
            const rect = panel.getBoundingClientRect();
            startX = e.clientX; startY = e.clientY; origX = rect.left; origY = rect.top;
            Object.values(CORNERS).forEach((c) => panel.classList.remove(c));
            panel.style.left = origX + "px"; panel.style.top = origY + "px";
            panel.style.right = "auto"; panel.style.bottom = "auto";
            panel.classList.add("zg-dock-dragging");
            document.body.style.userSelect = "none";
        }
        function onMove(e) {
            if (!dragging) return;
            panel.style.left = (origX + e.clientX - startX) + "px";
            panel.style.top = (origY + e.clientY - startY) + "px";
        }
        function onUp(e) {
            if (!dragging) return;
            dragging = false;
            panel.classList.remove("zg-dock-dragging");
            document.body.style.userSelect = "";
            applyDock(nearestCorner(e.clientX, e.clientY));
        }
        handle.addEventListener("mousedown", onDown);
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);

        return {
            el: panel,
            dock: applyDock,
            destroy() { handle.removeEventListener("mousedown", onDown); document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.dockPanel = dockPanel;
})();
