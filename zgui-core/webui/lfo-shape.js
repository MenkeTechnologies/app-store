// zgui-core/lfo-shape.js — an LFO waveform preview + shape picker (sine/triangle/saw/square) with an
// animated playhead, ported from zpwr-patch-core's buildLfoEditor. Generic: pass the LFO params, react
// to onChange — the waveform math (lfoWave), SVG polyline + the rate-driven playhead live here.
// window.ZGui.lfoShape.   Pairs with lfo-shape.css.
//   ZGui.lfoShape({ shape, rate, depth, bias, width, phase, animated, onChange }) ->
//       { el, set(name,value), setShape(i), get(), stop() }
//   shape: 0 sine · 1 triangle · 2 saw · 3 square.  rate in Hz drives the animated playhead.
(function () {
    "use strict";
    const NS = "http://www.w3.org/2000/svg";
    const GLYPH = ["∿", "△", "◺", "⊓"], NAME = ["Sine", "Triangle", "Saw", "Square"];
    function svg(tag, attrs, parent) {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    }
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    function lfoWave(shape, ph, width) {
        ph -= Math.floor(ph);
        if (shape === 0) return Math.sin(ph * 2 * Math.PI);
        if (shape === 1) return 4 * Math.abs(ph - 0.5) - 1;
        if (shape === 2) return 2 * ph - 1;
        return ph < width ? 1 : -1;
    }

    function lfoShape(opts) {
        opts = opts || {};
        const V = {
            shape: opts.shape != null ? opts.shape : 0,
            rate: opts.rate != null ? opts.rate : 1,
            depth: opts.depth != null ? opts.depth : 1,
            bias: opts.bias != null ? opts.bias : 0,
            width: opts.width != null ? opts.width : 0.5,
            phase: opts.phase != null ? opts.phase : 0,
        };
        const VBW = 320, VBH = 120, pad = 6, mid = VBH / 2, amp = (VBH - 16) / 2, CYCLES = 2, N = 160;

        const el = document.createElement("div");
        el.className = "zg-lfo";
        const head = document.createElement("div");
        head.className = "zg-lfo-head";
        const title = document.createElement("div");
        title.className = "zg-lfo-title";
        title.textContent = opts.title || "LFO";
        head.appendChild(title);
        const picker = document.createElement("div");
        picker.className = "zg-lfo-shapes";
        const shapeBtns = GLYPH.map((glyph, sh) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "zg-lfo-shape" + (V.shape === sh ? " on" : "");
            b.textContent = glyph;
            b.title = NAME[sh];
            b.addEventListener("click", () => setShape(sh));
            picker.appendChild(b);
            return b;
        });
        head.appendChild(picker);
        el.appendChild(head);

        const s = svg("svg", { viewBox: "0 0 " + VBW + " " + VBH, class: "zg-lfo-svg", preserveAspectRatio: "none" }, el);
        svg("rect", { x: 0, y: 0, width: VBW, height: VBH, class: "zg-lfo-bg" }, s);
        svg("line", { x1: 0, y1: mid, x2: VBW, y2: mid, class: "zg-lfo-grid" }, s);
        const wavePath = svg("polyline", { class: "zg-lfo-line", points: "" }, s);
        const playhead = svg("line", { class: "zg-lfo-playhead", x1: pad, y1: 8, x2: pad, y2: VBH - 8 }, s);
        const dot = svg("circle", { r: 4, class: "zg-lfo-dot" }, s);

        function yFor(ph) { return mid - clamp(lfoWave(V.shape, ph, V.width) * V.depth + V.bias, -1, 1) * amp; }
        function drawWave() {
            let pts = "";
            for (let i = 0; i <= N; i++) { const u = i / N; pts += (pad + u * (VBW - 2 * pad)).toFixed(1) + "," + yFor(u * CYCLES + V.phase).toFixed(1) + " "; }
            wavePath.setAttribute("points", pts.trim());
        }
        function setShape(sh) {
            V.shape = sh;
            shapeBtns.forEach((b, i) => b.classList.toggle("on", i === sh));
            drawWave();
            if (typeof opts.onChange === "function") opts.onChange("shape", sh, Object.assign({}, V));
        }
        drawWave();

        // animated playhead — JS-side phase advancing at `rate` Hz so the LFO visibly moves.
        let ph = 0, last = null, raf = null;
        function tick(t) {
            if (last !== null) { ph += V.rate * (t - last) / 1000; ph -= Math.floor(ph); }
            last = t;
            const x = pad + ph * (VBW - 2 * pad);
            playhead.setAttribute("x1", x.toFixed(1)); playhead.setAttribute("x2", x.toFixed(1));
            dot.setAttribute("cx", x.toFixed(1)); dot.setAttribute("cy", yFor(ph * CYCLES + V.phase).toFixed(1));
            raf = requestAnimationFrame(tick);
        }
        function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }
        if (opts.animated !== false && typeof requestAnimationFrame === "function") raf = requestAnimationFrame(tick);

        return {
            el,
            set(name, value) { if (name in V) { V[name] = value; if (name === "shape") setShape(value); else drawWave(); } },
            setShape,
            get() { return Object.assign({}, V); },
            stop,
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.lfoShape = lfoShape;
})();
