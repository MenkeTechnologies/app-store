// zgui-core/status-pill.js — a status pill colored by state (HTTP code / health). window.ZGui.statusPill.
//   ZGui.statusPill(code, { label }) -> <span>  (2xx green, 3xx cyan, 4xx yellow, 5xx red; or kind:'ok|warn|err|info')
(function () {
    "use strict";
    function kindFor(code) { if (typeof code === "string") return code; const n = +code; if (n >= 200 && n < 300) return "ok"; if (n >= 300 && n < 400) return "info"; if (n >= 400 && n < 500) return "warn"; if (n >= 500) return "err"; return "info"; }
    function statusPill(code, opts) {
        opts = opts || {};
        const e = document.createElement("span");
        e.className = "zg-status-pill zg-status-" + kindFor(opts.kind || code);
        e.textContent = opts.label != null ? opts.label : code;
        return e;
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.statusPill = statusPill;
})();
