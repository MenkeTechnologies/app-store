// zgui-core/gauge.js — a radial arc gauge (270° sweep, like the knob ring but read-only). SVG.
// window.ZGui.gauge.   ZGui.gauge({ value, min, max, label, color }) -> { el, set(v) }
(function () {
    "use strict";
    const NS = "http://www.w3.org/2000/svg";
    function svg(t, a, p) { const e = document.createElementNS(NS, t); for (const k in (a || {})) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
    function arc(cx, cy, r, a0, a1) { const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); const large = (a1 - a0) > Math.PI ? 1 : 0; return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`; }
    function gauge(opts) {
        opts = opts || {};
        const min = opts.min == null ? 0 : opts.min, max = opts.max == null ? 1 : opts.max;
        const wrap = document.createElement("div"); wrap.className = "zg-gauge";
        const s = svg("svg", { viewBox: "0 0 100 80", class: "zg-gauge-svg" }, wrap);
        const start = Math.PI * 0.75, end = Math.PI * 2.25; // 270°, bottom gap
        svg("path", { d: arc(50, 45, 36, start, end), fill: "none", stroke: "var(--border)", "stroke-width": "8", "stroke-linecap": "round" }, s);
        const val = svg("path", { fill: "none", stroke: opts.color || "var(--cyan)", "stroke-width": "8", "stroke-linecap": "round", filter: "drop-shadow(0 0 3px var(--cyan-glow))" }, s);
        const txt = svg("text", { x: 50, y: 50, "text-anchor": "middle", class: "zg-gauge-val" }, s);
        const lbl = opts.label != null ? svg("text", { x: 50, y: 66, "text-anchor": "middle", class: "zg-gauge-lbl" }, s) : null;
        if (lbl) lbl.textContent = opts.label;
        function set(v) { const t = Math.max(0, Math.min(1, (v - min) / (max - min))); val.setAttribute("d", arc(50, 45, 36, start, start + t * (end - start))); txt.textContent = Math.round(v); }
        set(opts.value == null ? min : opts.value);
        return { el: wrap, set };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.gauge = gauge;
})();
