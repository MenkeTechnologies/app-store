// zgui-core/neon-frame.js — wrap content in an animated neon clip-path frame. window.ZGui.neonFrame.
//   ZGui.neonFrame(content?, { color?, pulse? }) -> { el, body }   (content: Node|string|undefined)
(function () {
    "use strict";
    function neonFrame(content, opts) {
        opts = opts || {};
        const el = document.createElement("div");
        el.className = "zg-neon-frame" + (opts.pulse ? " zg-neon-pulse" : "");
        if (opts.color) el.style.setProperty("--zg-neon", opts.color);
        const body = document.createElement("div");
        body.className = "zg-neon-frame-body";
        if (content != null) { if (typeof content === "string") body.innerHTML = content; else body.appendChild(content); }
        el.appendChild(body);
        return { el, body };
    }
    window.ZGui = window.ZGui || {}; window.ZGui.neonFrame = neonFrame;
})();
