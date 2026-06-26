// zgui-core/split-pane.js — a resizable two-pane split with a draggable divider, persisting the
// ratio. The need recurs across the suite (dual-pane file managers, list/detail, request/response);
// distilled from the pane-resizer pattern in zpwr-file-browser. window.ZGui.splitPane.
//
//   ZGui.splitPane.create(container, {
//       direction: 'h',     // 'h' = side-by-side (vertical divider) | 'v' = stacked
//       ratio: 0.5,         // initial fraction for the FIRST pane (0..1)
//       min: 80,            // min px per pane
//       prefsKey: 'split',  // persist the ratio
//       onResize: (ratio) => {},
//   }) -> { el, ratio(), setRatio(r) }
//
// `container` must already hold exactly two child elements (the two panes); the divider is
// inserted between them. Host may define window.prefs.
(function () {
    "use strict";

    const prefs = window.prefs || (window.prefs = {
        getItem(k) { try { return localStorage.getItem(k); } catch { return null; } },
        setItem(k, v) { try { localStorage.setItem(k, v); } catch { /* quota */ } },
    });

    function create(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const horizontal = (opts.direction || "h") !== "v";
        const min = opts.min || 80;
        const prefsKey = opts.prefsKey || "";
        const panes = [...host.children].filter((n) => n.nodeType === 1);
        if (panes.length < 2) return null;
        const a = panes[0], b = panes[1];

        let ratio = (function () {
            const saved = prefsKey ? parseFloat(prefs.getItem(prefsKey)) : NaN;
            if (!isNaN(saved) && saved > 0 && saved < 1) return saved;
            return typeof opts.ratio === "number" ? opts.ratio : 0.5;
        })();

        host.classList.add("zg-split", horizontal ? "zg-split-h" : "zg-split-v");
        const divider = document.createElement("div");
        divider.className = "zg-split-divider";
        host.insertBefore(divider, b);

        function apply() {
            a.style.flex = `0 0 ${(ratio * 100).toFixed(3)}%`;
            b.style.flex = "1 1 0";
            if (typeof opts.onResize === "function") opts.onResize(ratio);
        }
        apply();

        let dragging = false;
        divider.addEventListener("mousedown", (e) => {
            e.preventDefault();
            dragging = true;
            document.body.style.userSelect = "none";
            document.body.style.cursor = horizontal ? "col-resize" : "row-resize";
        });
        document.addEventListener("mousemove", (e) => {
            if (!dragging) return;
            const rect = host.getBoundingClientRect();
            const total = horizontal ? rect.width : rect.height;
            const pos = horizontal ? e.clientX - rect.left : e.clientY - rect.top;
            let r = pos / total;
            // clamp so each pane keeps `min` px
            const minR = min / total, maxR = 1 - min / total;
            r = Math.max(minR, Math.min(maxR, r));
            if (isFinite(r)) { ratio = r; a.style.flex = `0 0 ${(ratio * 100).toFixed(3)}%`; }
        });
        document.addEventListener("mouseup", () => {
            if (!dragging) return;
            dragging = false;
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
            if (prefsKey) prefs.setItem(prefsKey, String(ratio));
            if (typeof opts.onResize === "function") opts.onResize(ratio);
        });

        return {
            el: host,
            ratio() { return ratio; },
            setRatio(r) { if (r > 0 && r < 1) { ratio = r; apply(); if (prefsKey) prefs.setItem(prefsKey, String(r)); } },
        };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.splitPane = { create: create };
})();
