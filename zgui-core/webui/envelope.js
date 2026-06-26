// zgui-core/envelope.js — an interactive ADSR envelope editor (SVG curve + draggable handles + time
// grid), ported from zpwr-patch-core's buildEnvEditor. Generic: the consumer passes plain ADSR values
// (+ per-stage maxima) and reacts to onChange — the curve math, exponential analog segments, time
// gridlines and handle dragging live here. window.ZGui.envelope.   Pairs with envelope.css.
//   ZGui.envelope({ attack, decay, sustain, release, gain?, max:{attack,decay,release}, unit?, onChange })
//     -> { el, set(name,value), setAll(vals), get() }
//   times in seconds (or ms if unit:'ms'); sustain/gain are 0..1. onChange(name, value, allValues).
(function () {
    "use strict";
    const NS = "http://www.w3.org/2000/svg";
    function svg(tag, attrs, parent) {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    }
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    function envelope(opts) {
        opts = opts || {};
        const V = {
            attack: opts.attack != null ? opts.attack : 0.1,
            decay: opts.decay != null ? opts.decay : 0.2,
            sustain: opts.sustain != null ? opts.sustain : 0.6,
            release: opts.release != null ? opts.release : 0.3,
            gain: opts.gain != null ? opts.gain : 1,
        };
        const MAX = Object.assign({ attack: 2, decay: 2, release: 2 }, opts.max || {});
        const ms = opts.unit === "ms";

        const VBW = 320, VBH = 120, pad = 14, top = 14, base = VBH - 14, gap = (VBW - 2 * pad) * 0.16;
        const scaleDen = MAX.attack + MAX.decay + MAX.release;
        const scale = (VBW - 2 * pad - gap) / Math.max(0.0001, scaleDen);
        const levelY = (L) => top + (1 - clamp(L, 0, 1)) * (base - top);

        const el = document.createElement("div");
        el.className = "zg-env";
        const title = document.createElement("div");
        title.className = "zg-env-title";
        title.textContent = opts.title || "ENVELOPE";
        el.appendChild(title);
        const s = svg("svg", { viewBox: "0 0 " + VBW + " " + VBH, class: "zg-env-svg", preserveAspectRatio: "none" }, el);
        svg("rect", { x: 0, y: 0, width: VBW, height: VBH, class: "zg-env-bg" }, s);
        for (let g = 1; g < 4; g++) svg("line", { x1: 0, y1: base - g * (base - top) / 4, x2: VBW, y2: base - g * (base - top) / 4, class: "zg-env-grid" }, s);
        // vertical TIME gridlines + second labels (Serum/Sylenth style), fixed from the time scale.
        const totalSec = scaleDen * (ms ? 0.001 : 1), pxPerSec = scale * (ms ? 1000 : 1);
        const tstep = totalSec > 4 ? 1 : totalSec > 2 ? 0.5 : totalSec > 0.8 ? 0.25 : 0.1;
        for (let t = tstep; t < totalSec - 1e-6; t += tstep) {
            const tx = pad + t * pxPerSec; if (tx > VBW - pad) break;
            svg("line", { x1: tx.toFixed(1), y1: top - 2, x2: tx.toFixed(1), y2: base, class: "zg-env-tgrid" }, s);
            const lb = svg("text", { x: (tx + 2).toFixed(1), y: (base - 3).toFixed(1), class: "zg-env-tlabel" }, s);
            lb.textContent = t >= 1 ? (Number.isInteger(t) ? t + " s" : t.toFixed(1) + " s") : Math.round(t * 1000) + " ms";
        }
        const area = svg("path", { class: "zg-env-fill", d: "" }, s);
        const curve = svg("path", { class: "zg-env-line", d: "" }, s);
        const handAtk = svg("circle", { r: 5, class: "zg-env-handle" }, s);
        const handDec = svg("circle", { r: 5, class: "zg-env-handle" }, s);
        const handRel = svg("circle", { r: 5, class: "zg-env-handle" }, s);

        // each segment is an exponential "fast then level" curve, like a real analog ADSR.
        const SEG = 18;
        function seg(x0, y0, x1, y1) {
            let str = "";
            for (let k = 1; k <= SEG; k++) { const u = k / SEG, e = Math.pow(u, 0.42); str += " L" + (x0 + (x1 - x0) * u).toFixed(1) + "," + (y0 + (y1 - y0) * e).toFixed(1); }
            return str;
        }
        function draw() {
            const a = V.attack, dc = V.decay, su = V.sustain, r = V.release, g = clamp(V.gain, 0, 1);
            const p0 = [pad, base], p1 = [pad + a * scale, levelY(g)];
            const p2 = [p1[0] + dc * scale, levelY(g * su)], p3 = [p2[0] + gap, levelY(g * su)], p4 = [p3[0] + r * scale, base];
            let dP = "M" + p0[0].toFixed(1) + "," + p0[1].toFixed(1);
            dP += seg(p0[0], p0[1], p1[0], p1[1]);                  // attack rise
            dP += seg(p1[0], p1[1], p2[0], p2[1]);                  // decay to sustain
            dP += " L" + p3[0].toFixed(1) + "," + p3[1].toFixed(1); // sustain (flat)
            dP += seg(p3[0], p3[1], p4[0], p4[1]);                  // release to zero
            curve.setAttribute("d", dP);
            area.setAttribute("d", dP + " L" + p4[0].toFixed(1) + "," + base + " L" + pad.toFixed(1) + "," + base + " Z");
            handAtk.setAttribute("cx", p1[0]); handAtk.setAttribute("cy", p1[1]);
            handDec.setAttribute("cx", p2[0]); handDec.setAttribute("cy", p2[1]);
            handRel.setAttribute("cx", p4[0]); handRel.setAttribute("cy", p4[1]);
        }
        function emit(name) { if (typeof opts.onChange === "function") opts.onChange(name, V[name], Object.assign({}, V)); }
        function setP(name, v, hi) { V[name] = clamp(v, name === "sustain" || name === "gain" ? 0 : 0, hi != null ? hi : 1); draw(); emit(name); }
        // map a pointer event to the svg's internal viewBox coordinates.
        function svgPt(ev) {
            const r = s.getBoundingClientRect();
            return { x: (ev.clientX - r.left) / (r.width || 1) * VBW, y: (ev.clientY - r.top) / (r.height || 1) * VBH };
        }
        function dragHandle(handle, onMove) {
            handle.addEventListener("pointerdown", (e) => {
                e.preventDefault(); e.stopPropagation();
                const move = (ev) => onMove(svgPt(ev));
                const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
                window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
            });
        }
        dragHandle(handAtk, (pt) => setP("attack", (pt.x - pad) / scale, MAX.attack));
        dragHandle(handDec, (pt) => {
            setP("decay", (pt.x - (pad + V.attack * scale)) / scale, MAX.decay);
            setP("sustain", 1 - (pt.y - top) / (base - top), 1);
        });
        dragHandle(handRel, (pt) => {
            const relStart = pad + V.attack * scale + V.decay * scale + gap;
            setP("release", (pt.x - relStart) / scale, MAX.release);
        });
        draw();
        return {
            el,
            set(name, value) { if (name in V) { V[name] = value; draw(); } },
            setAll(vals) { Object.keys(vals || {}).forEach((k) => { if (k in V) V[k] = vals[k]; }); draw(); },
            get() { return Object.assign({}, V); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.envelope = envelope;
})();
