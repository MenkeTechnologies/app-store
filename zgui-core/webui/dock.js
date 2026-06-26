// zgui-core/dock.js — drag a floating panel to snap into one of the four screen corners, with a
// preview overlay during the drag. Distilled from the dock logic Audio-Haxor copied 3× (player,
// similar-panel, terminal). The GENERIC engine — the panel + its drag handle are the consumer's.
// window.ZGui.dock.
//
//   ZGui.dock.make({
//       panel: '#myPanel',          // the floating panel (gets .zg-dockable + .zg-dock-<corner>)
//       handle: '.drag-handle',     // element(s) that start the drag (string | Element | Element[])
//       prefsKey: 'myPanelDock',    // persist the chosen corner
//       defaultCorner: 'br',        // tl | tr | bl | br
//       skip: '.toolbar-actions',   // selector: don't start a drag from these (buttons etc.)
//       onDock: (corner) => {},     // optional
//   }) -> { setDock(corner), restore(), current() }
//
// The overlay (#zg-dock-overlay + 4 zones) is auto-injected. Pairs with dock.css. Host may define
// window.prefs and window.showToast.
(function () {
    "use strict";

    const prefs = window.prefs || (window.prefs = {
        getItem(k) { try { return localStorage.getItem(k); } catch { return null; } },
        setItem(k, v) { try { localStorage.setItem(k, v); } catch { /* quota */ } },
    });
    const CORNERS = ["tl", "tr", "bl", "br"];

    function overlay() {
        let o = document.getElementById("zg-dock-overlay");
        if (!o) {
            o = document.createElement("div");
            o.id = "zg-dock-overlay";
            o.className = "zg-dock-overlay";
            o.innerHTML = CORNERS.map((c) => `<div class="zg-dock-zone" data-corner="${c}"></div>`).join("");
            document.body.appendChild(o);
        }
        return o;
    }
    function zoneEl(o, corner) { return o.querySelector(`.zg-dock-zone[data-corner="${corner}"]`); }

    function nearestCorner(x, y) {
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        if (x < cx && y < cy) return "tl";
        if (x >= cx && y < cy) return "tr";
        if (x < cx && y >= cy) return "bl";
        return "br";
    }

    function make(opts) {
        opts = opts || {};
        const panel = typeof opts.panel === "string" ? document.querySelector(opts.panel) : opts.panel;
        if (!panel) return null;
        panel.classList.add("zg-dockable");
        const handles = (function () {
            const h = opts.handle;
            if (!h) return [panel];
            if (typeof h === "string") return [...panel.querySelectorAll(h), ...document.querySelectorAll(h)].filter((e, i, a) => a.indexOf(e) === i);
            return Array.isArray(h) ? h : [h];
        })();
        const prefsKey = opts.prefsKey || "";
        const skip = opts.skip || null;
        let dragging = false, startX = 0, startY = 0, origX = 0, origY = 0;

        function current() {
            for (const c of CORNERS) if (panel.classList.contains("zg-dock-" + c)) return c;
            return opts.defaultCorner || "br";
        }
        function setDock(corner) {
            if (!CORNERS.includes(corner)) corner = "br";
            CORNERS.forEach((c) => panel.classList.remove("zg-dock-" + c));
            panel.classList.add("zg-dock-" + corner);
            if (prefsKey) prefs.setItem(prefsKey, corner);
            if (typeof opts.onDock === "function") opts.onDock(corner);
        }
        function restore() {
            const saved = prefsKey ? prefs.getItem(prefsKey) : null;
            setDock(CORNERS.includes(saved) ? saved : (opts.defaultCorner || "br"));
        }

        function positionZones(o) {
            const vw = window.innerWidth, vh = window.innerHeight, gap = 4;
            const zw = Math.floor(vw / 2 - gap * 1.5) + "px";
            const zh = Math.floor(vh / 2 - gap * 1.5) + "px";
            const mid = Math.ceil(vw / 2 + gap / 2) + "px";
            const midY = Math.ceil(vh / 2 + gap / 2) + "px";
            const g = gap + "px";
            zoneEl(o, "tl").style.cssText = `top:${g};left:${g};width:${zw};height:${zh}`;
            zoneEl(o, "tr").style.cssText = `top:${g};left:${mid};width:${zw};height:${zh}`;
            zoneEl(o, "bl").style.cssText = `top:${midY};left:${g};width:${zw};height:${zh}`;
            zoneEl(o, "br").style.cssText = `top:${midY};left:${mid};width:${zw};height:${zh}`;
        }
        function highlight(o, corner) {
            o.querySelectorAll(".zg-dock-zone").forEach((z) => z.classList.toggle("active", z.dataset.corner === corner));
        }

        function onDragStart(e) {
            if (e.button !== 0) return;
            if (skip && e.target.closest(skip)) return;
            e.preventDefault();
            e.stopPropagation();
            dragging = true;
            startX = e.clientX; startY = e.clientY;
            const rect = panel.getBoundingClientRect();
            origX = rect.left; origY = rect.top;
            CORNERS.forEach((c) => panel.classList.remove("zg-dock-" + c));
            panel.style.left = origX + "px";
            panel.style.top = origY + "px";
            panel.style.right = "auto";
            panel.style.bottom = "auto";
            panel.classList.add("zg-dock-dragging");
            const o = overlay();
            positionZones(o);
            o.classList.add("visible");
        }

        handles.forEach((h) => h && h.addEventListener("mousedown", onDragStart, true));

        document.addEventListener("mousemove", function (e) {
            if (!dragging) return;
            panel.style.left = (origX + e.clientX - startX) + "px";
            panel.style.top = (origY + e.clientY - startY) + "px";
            highlight(overlay(), nearestCorner(e.clientX, e.clientY));
        });
        document.addEventListener("mouseup", function (e) {
            if (!dragging) return;
            dragging = false;
            panel.classList.remove("zg-dock-dragging");
            const o = overlay();
            o.classList.remove("visible");
            o.querySelectorAll(".zg-dock-zone").forEach((z) => z.classList.remove("active"));
            const savedW = panel.style.width, savedH = panel.style.height;
            panel.style.left = panel.style.top = panel.style.right = panel.style.bottom = "";
            panel.style.width = savedW; panel.style.height = savedH;
            panel.classList.add("zg-dock-snapping");
            setDock(nearestCorner(e.clientX, e.clientY));
            if (typeof window.showToast === "function") window.showToast("Panel docked");
            setTimeout(() => panel.classList.remove("zg-dock-snapping"), 300);
        });

        return { setDock: setDock, restore: restore, current: current };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.dock = { make: make };
})();
