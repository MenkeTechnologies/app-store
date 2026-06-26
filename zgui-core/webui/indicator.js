// zgui-core/indicator.js — overlay a small dot or count badge on a corner of a target element (an
// avatar's online dot, a bell's unread count). Ported behavior from Mantine's <Indicator>.
// window.ZGui.indicator.
//   ZGui.indicator(child, { label, dot:false, color:'red', position:'top-end', processing:false,
//       size, offset }) -> { el, set(label), show(), hide() }
//   position ∈ top-start|top-end|bottom-start|bottom-end
(function () {
    "use strict";
    function indicator(child, opts) {
        const inner = child && (child.el || child);
        opts = opts || {};
        const root = document.createElement("span"); root.className = "zg-indicator";
        if (inner) root.appendChild(inner);
        const dot = document.createElement("span");
        dot.className = "zg-indicator-mark zg-indicator-" + (opts.position || "top-end") + (opts.dot ? " is-dot" : "") + (opts.processing ? " is-processing" : "");
        dot.dataset.color = opts.color || "red";
        if (opts.size) { dot.style.minWidth = opts.size + "px"; dot.style.height = opts.size + "px"; }
        if (opts.offset) dot.style.margin = opts.offset + "px";
        if (!opts.dot && opts.label != null) dot.textContent = opts.label;
        root.appendChild(dot);
        return {
            el: root,
            set(label) { if (!opts.dot) dot.textContent = label == null ? "" : label; },
            show() { dot.style.display = ""; },
            hide() { dot.style.display = "none"; },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.indicator = indicator;
})();
