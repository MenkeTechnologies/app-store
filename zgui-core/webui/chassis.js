// zgui-core/chassis.js — builds the synth/effects RACK structure from zpwr-patch-core: a brushed-metal
// chassis pane (chassis.png) framed by neon rack-ear light bars, with a module grid inside. Returns the
// grid (`panel`) to append ZGui.module({bezel:true}) cards into. Wires chassis.png; see chassis.css.
// window.ZGui.chassis.
//
//   ZGui.chassis(container, { blockWidth:238 }) -> { el, rack, panel }   // append modules to .panel
(function () {
    "use strict";
    function el(t, c, p) { const e = document.createElement(t); if (c) e.className = c; if (p) p.appendChild(e); return e; }
    function chassis(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        host.classList.add("zg-chassis");
        if (opts.blockWidth) host.style.setProperty("--zg-block-w", opts.blockWidth + "px");
        const rack = el("div", "zg-rack", host);
        el("div", "zg-rack-ear", rack);
        const panel = el("div", "zg-synth-panel", rack);
        const earR = el("div", "zg-rack-ear zg-rack-ear-right", rack);
        void earR;
        return { el: host, rack: rack, panel: panel };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.chassis = chassis;
})();
