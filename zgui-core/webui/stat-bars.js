// zgui-core/stat-bars.js — labeled horizontal stat bars: label · proportional colored fill · value.
// Ported from Audio-Haxor's .hm-bar-row/.hm-bar-track/.hm-bar-fill (the format/size/BPM breakdowns).
// For any "category → magnitude" dashboard (distribution, counts, usage). Proportional to the max row
// (or an explicit max). Distinct from ZGui.progress (single 0..1 bar). window.ZGui.statBars.
//
//   ZGui.statBars(container, [{ label, value, display?, color? }], { max?, color:'cyan' }) -> { el, set(rows) }
//   color ∈ cyan | magenta | green | yellow | orange (per-row `color` overrides the default)
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    const COLORS = { cyan: 1, magenta: 1, green: 1, yellow: 1, orange: 1 };
    function statBars(container, rows, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const defColor = COLORS[opts.color] ? opts.color : "cyan";
        host.classList.add("zg-statbars");
        function set(list) {
            list = list || [];
            const max = opts.max != null ? opts.max : Math.max(1, ...list.map((r) => Number(r.value) || 0));
            if (!list.length) { host.innerHTML = '<div class="zg-statbar-empty">—</div>'; return; }
            host.innerHTML = list.map((r) => {
                const pct = Math.max(0, Math.min(100, (Number(r.value) || 0) / max * 100));
                const color = COLORS[r.color] ? r.color : defColor;
                const display = r.display != null ? r.display : (r.value == null ? "" : r.value);
                return '<div class="zg-statbar-row">'
                    + '<span class="zg-statbar-label">' + esc(r.label || "") + "</span>"
                    + '<span class="zg-statbar-track"><span class="zg-statbar-fill zg-statbar-' + color + '" style="width:' + pct.toFixed(1) + '%"></span></span>'
                    + '<span class="zg-statbar-val">' + esc(display) + "</span></div>";
            }).join("");
        }
        set(rows);
        return { el: host, set: set };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.statBars = statBars;
})();
