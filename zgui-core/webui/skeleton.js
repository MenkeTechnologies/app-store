// zgui-core/skeleton.js — animated shimmer loading placeholders. window.ZGui.skeleton.
//   ZGui.skeleton(container, { variant:'line'|'block'|'circle', count, width, height, gap }) -> { el, remove() }
(function () {
    "use strict";
    function skeleton(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const variant = opts.variant || "line", count = opts.count || 1;
        const made = [];
        for (let i = 0; i < count; i++) {
            const s = document.createElement("div");
            s.className = "zg-skeleton zg-skeleton-" + variant;
            if (opts.width) s.style.width = typeof opts.width === "number" ? opts.width + "px" : opts.width;
            if (opts.height) s.style.height = typeof opts.height === "number" ? opts.height + "px" : opts.height;
            if (opts.gap && i) s.style.marginTop = (typeof opts.gap === "number" ? opts.gap + "px" : opts.gap);
            host.appendChild(s); made.push(s);
        }
        return { el: host, remove() { made.forEach((s) => s.remove()); } };
    }
    window.ZGui = window.ZGui || {}; window.ZGui.skeleton = skeleton;
})();
