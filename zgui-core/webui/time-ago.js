// zgui-core/time-ago.js — a relative timestamp ("3m ago", "in 2h") that refreshes itself.
// Distinct from `eta` (a countdown) and `timeline` (an event list). window.ZGui.timeAgo.
//   ZGui.timeAgo(when, { tick?, suffix? }) -> { el, set(when), stop() }
//     `when`: Date | epoch-ms | ISO string.
(function () {
    "use strict";
    const UNITS = [
        ["y", 31536000000],
        ["mo", 2592000000],
        ["d", 86400000],
        ["h", 3600000],
        ["m", 60000],
        ["s", 1000],
    ];
    function toMs(w) {
        if (w == null) return Date.now();
        if (w instanceof Date) return w.getTime();
        if (typeof w === "number") return w;
        const p = Date.parse(w);
        return isNaN(p) ? Date.now() : p;
    }
    function phrase(ms, suffix) {
        const diff = Date.now() - ms;
        const abs = Math.abs(diff);
        if (abs < 5000) return "just now";
        let label = "0s";
        for (const [u, span] of UNITS) {
            if (abs >= span) { label = Math.floor(abs / span) + u; break; }
        }
        return diff >= 0 ? (label + (suffix === false ? "" : " ago")) : ("in " + label);
    }
    function timeAgo(when, opts) {
        opts = opts || {};
        let ms = toMs(when);
        const el = document.createElement("span");
        el.className = "zg-timeago";
        function render() { el.textContent = phrase(ms, opts.suffix); el.title = new Date(ms).toLocaleString(); }
        render();
        let timer = null;
        if (opts.tick !== false) timer = setInterval(render, (opts.tick || 30) * 1000);
        return {
            el,
            set: (w) => { ms = toMs(w); render(); },
            stop: () => { if (timer) clearInterval(timer); timer = null; },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.timeAgo = timeAgo;
})();
