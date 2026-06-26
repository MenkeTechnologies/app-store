// zgui-core/floating-dock.js — make a widget RELOCATABLE between docking zones by dragging it (a
// Trello-style ghost follows the cursor; eligible zones outline on hover; the chosen zone persists).
// Ported from Audio-Haxor's initFloatingElement (drag-reorder.js). Distinct from ZGui.drag (reorder
// within ONE list) and ZGui.modalDrag (move a floating modal): this moves a button-group / stat /
// toolbar item BETWEEN containers, with position-aware insertion at the drop point. window.ZGui.floatingDock.
//
//   ZGui.floatingDock(elementOrId, {
//       prefsKey,                          // persist which zone the widget lives in
//       zones: ['.toolbar', '.header'],    // dockable containers (drop targets)
//       slots: ['.btn', '.stat'],          // child selectors for position-aware insertion (optional)
//       onRelocate(zoneEl),                // fired after a successful move (optional)
//   })
(function () {
    "use strict";
    const prefs = window.prefs || {
        getItem(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
        setItem(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
    };
    function floatingDock(elementOrId, opts) {
        const el = typeof elementOrId === "string" ? (document.getElementById(elementOrId) || document.querySelector(elementOrId)) : elementOrId;
        if (!el) return;
        opts = opts || {};
        const zones = (opts.zones && opts.zones.length) ? opts.zones : [".toolbar"];
        const zoneSel = zones.join(", ");
        const slotSel = (opts.slots && opts.slots.length) ? opts.slots.join(", ") : null;
        const prefsKey = opts.prefsKey;

        // restore saved dock
        if (prefsKey) {
            const saved = prefs.getItem(prefsKey);
            if (saved) {
                const target = document.getElementById(saved) || document.querySelector(saved.charAt(0).match(/[.#\[]/) ? saved : "." + saved);
                if (target && target !== el.parentElement) target.appendChild(el);
            }
        }

        el.addEventListener("mousedown", (e) => {
            if (e.button !== 0 || (e.target.closest && e.target.closest("input, select, textarea"))) return;
            const rect = el.getBoundingClientRect();
            const startX = e.clientX, startY = e.clientY;
            const offsetX = e.clientX - rect.left, offsetY = e.clientY - rect.top;
            let dragging = false, ghost = null;

            const clearOutlines = () => document.querySelectorAll(zoneSel).forEach((c) => { c.style.outline = ""; });
            const onMove = (ev) => {
                if (!dragging && (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5)) {
                    dragging = true;
                    document.body.style.userSelect = "none";
                    document.body.style.cursor = "grabbing";
                    ghost = el.cloneNode(true);
                    ghost.classList.add("trello-ghost");
                    ghost.style.cssText = "position:fixed;z-index:20000;width:" + rect.width + "px;left:" + rect.left + "px;top:" + rect.top + "px;pointer-events:none;opacity:0.9;transform:rotate(2deg) scale(1.05);box-shadow:0 8px 32px rgba(0,0,0,0.5),0 0 20px rgba(5,217,232,0.3);border:2px solid var(--cyan);border-radius:4px;background:var(--bg-primary);padding:4px 8px;";
                    document.body.appendChild(ghost);
                    el.style.opacity = "0.3";
                }
                if (!dragging) return;
                ghost.style.left = (ev.clientX - offsetX) + "px";
                ghost.style.top = (ev.clientY - offsetY) + "px";
                ghost.style.display = "none";
                const under = document.elementFromPoint(ev.clientX, ev.clientY);
                ghost.style.display = "";
                const dropTarget = under && under.closest(zoneSel);
                clearOutlines();
                if (dropTarget) dropTarget.style.outline = "2px dashed var(--cyan)";
            };
            const cleanup = () => {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
                document.removeEventListener("contextmenu", cleanup);
                window.removeEventListener("blur", cleanup);
            };
            const onUp = (ev) => {
                cleanup();
                if (!dragging) return;
                document.body.style.userSelect = "";
                document.body.style.cursor = "";
                el.style.opacity = "";
                if (ghost) { ghost.remove(); ghost = null; }
                clearOutlines();
                const under = document.elementFromPoint(ev.clientX, ev.clientY);
                const dropTarget = under && under.closest(zoneSel);
                if (!dropTarget) return;
                const sibling = slotSel && under ? under.closest(slotSel) : null;
                if (sibling && sibling !== el && dropTarget.contains(sibling)) {
                    try {
                        const r = sibling.getBoundingClientRect();
                        const ref = ev.clientX < (r.left + r.width / 2) ? sibling : sibling.nextSibling;
                        if (ref === null || dropTarget.contains(ref)) dropTarget.insertBefore(el, ref);
                    } catch (_) { /* node moved */ }
                } else {
                    dropTarget.appendChild(el);
                }
                if (prefsKey) prefs.setItem(prefsKey, dropTarget.id || dropTarget.className.split(" ")[0]);
                if (typeof opts.onRelocate === "function") opts.onRelocate(dropTarget);
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
            document.addEventListener("contextmenu", cleanup);
            window.addEventListener("blur", cleanup);
        });
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.floatingDock = floatingDock;
})();
