// zgui-core/scroll-area.js — apply the cyberpunk neon scrollbar to a scroll container. window.ZGui.scrollArea.
//   ZGui.scrollArea(container, { maxHeight?, horizontal? }) -> { el }
(function () {
    "use strict";
    function scrollArea(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        host.classList.add("zg-scroll");
        if (opts.horizontal) host.classList.add("zg-scroll-x");
        if (opts.maxHeight) host.style.maxHeight = typeof opts.maxHeight === "number" ? opts.maxHeight + "px" : opts.maxHeight;
        return { el: host };
    }
    window.ZGui = window.ZGui || {}; window.ZGui.scrollArea = scrollArea;
})();
