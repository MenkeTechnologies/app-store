// zgui-core/osc-shape.js — an oscillator waveform preview + wave-type picker, ported from
// zpwr-patch-core's buildOscEditor (the oscWave DSP). 9 wave types, pulse-width + phase. Styled by
// graph.css. window.ZGui.oscShape.
//   ZGui.oscShape({ wave, pw, phase, onChange }) -> { el, set(name,value), setWave(i), get() }
//   wave: 0 sine · 1 saw · 2 square/PW · 3 tri · 4 ramp · 5 trapezoid · 6 rect-sine · 7 staircase · 8 soft-square
(function () {
    "use strict";
    const NS = "http://www.w3.org/2000/svg";
    const WAVES = ["Sine", "Saw", "Square / PW", "Triangle", "Ramp", "Trapezoid", "Rect Sine", "Staircase", "Soft Square"];
    function svg(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    function oscWave(w, t, pw) {
        t -= Math.floor(t);
        if (w === 0) return Math.sin(t * 2 * Math.PI);
        if (w === 1) return 2 * t - 1;                                            // saw
        if (w === 2) return t < pw ? 1 : -1;                                      // square / pulse (PW)
        if (w === 3) return 4 * Math.abs(t - 0.5) - 1;                            // tri
        if (w === 4) return 1 - 2 * t;                                            // ramp (down saw)
        if (w === 5) return clamp(8 * Math.abs(t - 0.5) - 2, -1, 1);              // trapezoid
        if (w === 6) return 2 * Math.abs(Math.sin(t * 2 * Math.PI)) - 1;          // full-wave rectified sine
        if (w === 7) return Math.floor(t * 4) / 1.5 - 1;                          // 4-step staircase
        return Math.tanh(4 * Math.sin(t * 2 * Math.PI));                          // soft square
    }

    function oscShape(opts) {
        opts = opts || {};
        const V = { wave: opts.wave || 0, pw: opts.pw != null ? opts.pw : 0.5, phase: opts.phase || 0 };
        const VBW = 320, VBH = 120, pad = 6, mid = VBH / 2, amp = (VBH - 16) / 2, CYCLES = 2, N = 240;

        const el = document.createElement("div");
        el.className = "zg-graph";
        const head = document.createElement("div");
        head.className = "zg-graph-head";
        const title = document.createElement("div");
        title.className = "zg-graph-title";
        title.textContent = opts.title || "OSC WAVE";
        head.appendChild(title);
        const sel = document.createElement("select");
        sel.className = "zg-graph-sel";
        WAVES.forEach((n, i) => { const o = document.createElement("option"); o.value = i; o.textContent = n; sel.appendChild(o); });
        sel.value = String(V.wave);
        sel.addEventListener("change", () => setWave(+sel.value));
        head.appendChild(sel);
        el.appendChild(head);

        const s = svg("svg", { viewBox: "0 0 " + VBW + " " + VBH, class: "zg-graph-svg", preserveAspectRatio: "none" }, el);
        svg("rect", { x: 0, y: 0, width: VBW, height: VBH, class: "zg-graph-bg" }, s);
        svg("line", { x1: 0, y1: mid, x2: VBW, y2: mid, class: "zg-graph-grid" }, s);
        const wavePath = svg("polyline", { class: "zg-graph-line", points: "" }, s);

        function draw() {
            let pts = "";
            for (let i = 0; i <= N; i++) { const u = i / N; pts += (pad + u * (VBW - 2 * pad)).toFixed(1) + "," + (mid - clamp(oscWave(V.wave, u * CYCLES + V.phase, V.pw), -1, 1) * amp).toFixed(1) + " "; }
            wavePath.setAttribute("points", pts.trim());
        }
        function setWave(w) { V.wave = w; sel.value = String(w); draw(); if (typeof opts.onChange === "function") opts.onChange("wave", w, Object.assign({}, V)); }
        draw();
        return {
            el,
            set(name, value) { if (name in V) { V[name] = value; if (name === "wave") setWave(value); else draw(); } },
            setWave,
            get() { return Object.assign({}, V); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.oscShape = oscShape;
})();
