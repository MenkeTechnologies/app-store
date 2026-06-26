// zgui-core/geo-morph.js — a parametric geometric-morph oscillator waveform view (Order / Teeth),
// ported from zpwr-patch-core's geoMorphSample + buildGeoMorphView (the Zebra-style geometric osc).
// Read-only waveform that redraws as Order/Teeth change. Styled by graph.css. window.ZGui.geoMorph.
//   ZGui.geoMorph({ order, teeth, onChange }) -> { el, set(name,value), get() }
//   order: 2..16 (polygon sides) · teeth: 0..1 (skew).
(function () {
    "use strict";
    const NS = "http://www.w3.org/2000/svg";
    function svg(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    function geoMorphSample(phi, order, teeth) {
        phi -= Math.floor(phi);
        const n = clamp(order, 2, 16), P = Math.PI / n, t = clamp(teeth, 0, 1) * P;
        const fr = phi * n - Math.floor(phi * n);
        let denom = Math.cos(2 * P * fr - P + t);
        if (Math.abs(denom) < 0.05) denom = denom < 0 ? -0.05 : 0.05;
        return clamp((Math.cos(P) / denom) * Math.cos(2 * Math.PI * phi), -1.5, 1.5);
    }

    function geoMorph(opts) {
        opts = opts || {};
        const V = { order: opts.order != null ? opts.order : 5, teeth: opts.teeth != null ? opts.teeth : 0 };
        const VBW = 320, VBH = 120, pad = 6, mid = VBH / 2, amp = (VBH - 16) / 2, CYCLES = 2, N = 320;

        const el = document.createElement("div");
        el.className = "zg-graph";
        const t = document.createElement("div");
        t.className = "zg-graph-title";
        t.textContent = opts.title || "GEO WAVE";
        el.appendChild(t);
        const s = svg("svg", { viewBox: "0 0 " + VBW + " " + VBH, class: "zg-graph-svg", preserveAspectRatio: "none" }, el);
        svg("rect", { x: 0, y: 0, width: VBW, height: VBH, class: "zg-graph-bg" }, s);
        svg("line", { x1: 0, y1: mid, x2: VBW, y2: mid, class: "zg-graph-grid" }, s);
        const wavePath = svg("polyline", { class: "zg-graph-line", points: "" }, s);

        function draw() {
            let pts = "";
            for (let i = 0; i <= N; i++) { const u = i / N; pts += (pad + u * (VBW - 2 * pad)).toFixed(1) + "," + (mid - geoMorphSample(u * CYCLES, V.order, V.teeth) / 1.5 * amp).toFixed(1) + " "; }
            wavePath.setAttribute("points", pts.trim());
        }
        draw();
        return {
            el,
            set(name, value) { if (name in V) { V[name] = value; draw(); if (typeof opts.onChange === "function") opts.onChange(name, value, Object.assign({}, V)); } },
            get() { return Object.assign({}, V); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.geoMorph = geoMorph;
})();
