// zgui-core/aspect-ratio.js — a box that holds a fixed aspect ratio (for media/canvas). window.ZGui.aspectRatio.
//   ZGui.aspectRatio(content?, { ratio=16/9 }) -> { el, body }
(function () {
    "use strict";
    function aspectRatio(content, opts) {
        opts = opts || {};
        const el = document.createElement("div");
        el.className = "zg-aspect";
        el.style.setProperty("--zg-aspect", String(opts.ratio || (16 / 9)));
        const body = document.createElement("div");
        body.className = "zg-aspect-body";
        if (content != null) { if (typeof content === "string") body.innerHTML = content; else body.appendChild(content); }
        el.appendChild(body);
        return { el, body };
    }
    window.ZGui = window.ZGui || {}; window.ZGui.aspectRatio = aspectRatio;
})();
