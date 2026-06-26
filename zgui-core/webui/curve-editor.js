// zgui-core/curve-editor.js — a "draw your own" multi-point curve editor, ported from
// zpwr-patch-core's buildCurveEditor (the MSEG / XY-path / transfer-curve / PZ-filter graph). Drag
// points, double-click to add/remove, the polyline follows. Generic: the consumer passes the points
// and reacts to onChange — the dragging / add-remove / sorting live here. Styled by graph.css.
// window.ZGui.curveEditor.
//   ZGui.curveEditor({ points:[{x,y}], closed?, sorted?, title?, onChange }) -> { el, get(), set(points) }
//   points are normalized 0..1 each. closed: connect last→first (XY path). sorted: keep x-sorted (MSEG).
(function () {
    "use strict";
    const NS = "http://www.w3.org/2000/svg";
    function svg(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
    const clamp01 = (v) => Math.min(1, Math.max(0, v));

    function curveEditor(opts) {
        opts = opts || {};
        const closed = !!opts.closed;
        const sorted = opts.sorted !== false && !closed;   // MSEG sorts by x; an XY path does not
        let pts = (opts.points && opts.points.length >= 2 ? opts.points : [{ x: 0, y: 0 }, { x: 0.1, y: 1 }, { x: 0.5, y: 0.6 }, { x: 1, y: 0 }]).map((p) => ({ x: clamp01(p.x), y: clamp01(p.y) }));

        const VBW = 320, VBH = 150, pad = 14, top = 14, base = VBH - 14;
        const X = (x) => pad + clamp01(x) * (VBW - 2 * pad);
        const Y = (y) => base - clamp01(y) * (base - top);
        const invX = (px) => clamp01((px - pad) / (VBW - 2 * pad));
        const invY = (py) => clamp01((base - py) / (base - top));

        const el = document.createElement("div");
        el.className = "zg-graph";
        const t = document.createElement("div");
        t.className = "zg-graph-title";
        t.textContent = (opts.title || "CURVE") + " — drag points · double-click to add/remove";
        el.appendChild(t);
        const s = svg("svg", { viewBox: "0 0 " + VBW + " " + VBH, class: "zg-graph-svg tall", preserveAspectRatio: "none" }, el);
        svg("rect", { x: 0, y: 0, width: VBW, height: VBH, class: "zg-graph-bg" }, s);
        for (let g = 1; g < 4; g++) svg("line", { x1: 0, y1: top + g * (base - top) / 4, x2: VBW, y2: top + g * (base - top) / 4, class: "zg-graph-grid" }, s);
        const poly = svg("polyline", { class: "zg-graph-line", points: "", fill: "none" }, s);
        let handles = [];

        function svgPt(ev) { const r = s.getBoundingClientRect(); return { x: (ev.clientX - r.left) / (r.width || 1) * VBW, y: (ev.clientY - r.top) / (r.height || 1) * VBH }; }
        const order = () => closed ? pts : pts.slice().sort((a, b) => a.x - b.x);
        function drawLine() {
            const seq = order().map((p) => X(p.x).toFixed(1) + "," + Y(p.y).toFixed(1));
            if (closed && seq.length) seq.push(seq[0]);
            poly.setAttribute("points", seq.join(" "));
        }
        function emit() { if (typeof opts.onChange === "function") opts.onChange(pts.map((p) => ({ x: p.x, y: p.y }))); }
        function draw() {
            if (sorted) pts.sort((a, b) => a.x - b.x);
            drawLine();
            handles.forEach((h) => h.remove()); handles = [];
            pts.forEach((p, i) => {
                const h = svg("circle", { r: 5, cx: X(p.x), cy: Y(p.y), class: "zg-graph-handle" }, s);
                h.addEventListener("pointerdown", (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const move = (ev) => { const q = svgPt(ev); p.x = invX(q.x); p.y = invY(q.y); h.setAttribute("cx", X(p.x)); h.setAttribute("cy", Y(p.y)); drawLine(); };
                    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); draw(); emit(); };
                    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
                });
                h.addEventListener("dblclick", (e) => { e.preventDefault(); e.stopPropagation(); if (pts.length > 2) { pts.splice(i, 1); draw(); emit(); } });
                handles.push(h);
            });
        }
        s.addEventListener("dblclick", (e) => { const q = svgPt(e); pts.push({ x: invX(q.x), y: invY(q.y) }); draw(); emit(); });
        draw();
        return {
            el,
            get() { return pts.map((p) => ({ x: p.x, y: p.y })); },
            set(points) { if (points && points.length >= 2) { pts = points.map((p) => ({ x: clamp01(p.x), y: clamp01(p.y) })); draw(); } },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.curveEditor = curveEditor;
})();
