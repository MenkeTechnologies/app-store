// zgui-core/popover.js — a floating panel anchored to a trigger element (custom content; distinct
// from tooltip/contextMenu/select). Viewport-aware; closes on outside click / Esc. window.ZGui.popover.
//
//   const p = ZGui.popover({ anchor, content, placement:'bottom', onClose }); p.open(); p.close(); p.toggle();
(function () {
    "use strict";
    function popover(opts) {
        opts = opts || {};
        const anchor = typeof opts.anchor === "string" ? document.querySelector(opts.anchor) : opts.anchor;
        let panel = null;
        function place() {
            if (!panel || !anchor) return;
            const r = anchor.getBoundingClientRect(), pw = panel.offsetWidth, ph = panel.offsetHeight;
            const vw = window.innerWidth, vh = window.innerHeight, gap = 6;
            let top = r.bottom + gap, left = r.left;
            if (opts.placement === "top" || top + ph > vh - 4) top = Math.max(4, r.top - ph - gap);
            if (left + pw > vw - 4) left = Math.max(4, vw - pw - 4);
            panel.style.top = top + "px"; panel.style.left = left + "px";
        }
        function onDocDown(e) { if (panel && !panel.contains(e.target) && e.target !== anchor && !(anchor && anchor.contains(e.target))) close(); }
        function onKey(e) { if (e.key === "Escape") close(); }
        function open() {
            if (panel) return;
            panel = document.createElement("div");
            panel.className = "zg-popover" + (opts.cls ? " " + opts.cls : "");
            if (opts.content != null) { if (typeof opts.content === "string") panel.innerHTML = opts.content; else panel.appendChild(opts.content); }
            document.body.appendChild(panel);
            place();
            setTimeout(() => { document.addEventListener("pointerdown", onDocDown, true); document.addEventListener("keydown", onKey, true); window.addEventListener("resize", place); window.addEventListener("scroll", place, true); }, 0);
        }
        function close() {
            if (!panel) return;
            document.removeEventListener("pointerdown", onDocDown, true); document.removeEventListener("keydown", onKey, true);
            window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true);
            if (panel.parentNode) panel.parentNode.removeChild(panel); panel = null;
            if (typeof opts.onClose === "function") opts.onClose();
        }
        return { open, close, toggle() { panel ? close() : open(); }, get el() { return panel; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.popover = popover;
})();
