// zgui-core/chart.js — a lightweight canvas chart (line / area / bar, multi-series, auto-scale,
// grid + axes). Built clean (traderview's chart wraps a 3rd-party lib; this has no dependency).
// window.ZGui.chart.
//
//   ZGui.chart(container, {
//       series: [{ data:[y,…]|[{x,y}], color, type:'line'|'area'|'bar', width }],
//       height, padding, grid:true, axes:true, yMin, yMax,
//   }) -> { el, setSeries(list), redraw() }
(function () {
    "use strict";
    function cssVar(name, fb) { try { const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; } catch { return fb; } }
    function norm(s) { return (s.data || []).map((d, i) => typeof d === "number" ? { x: i, y: d } : d); }
    function chart(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        host.classList.add("zg-chart");
        let series = (opts.series || []).map((s) => ({ ...s, pts: norm(s) }));
        const canvas = document.createElement("canvas");
        host.appendChild(canvas);
        const pad = opts.padding || { l: 34, r: 8, t: 8, b: 18 };
        function redraw() {
            const dpr = window.devicePixelRatio || 1;
            const w = host.clientWidth || 300, h = opts.height || host.clientHeight || 160;
            canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + "px"; canvas.style.height = h + "px";
            const ctx = canvas.getContext("2d"); if (!ctx) return;
            ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, h);
            const all = series.flatMap((s) => s.pts);
            if (!all.length) return;
            const xs = all.map((p) => p.x), ys = all.map((p) => p.y);
            const xmin = Math.min(...xs), xmax = Math.max(...xs);
            const ymin = opts.yMin != null ? opts.yMin : Math.min(...ys), ymax = opts.yMax != null ? opts.yMax : Math.max(...ys);
            const X = (x) => pad.l + (xmax === xmin ? 0.5 : (x - xmin) / (xmax - xmin)) * (w - pad.l - pad.r);
            const Y = (y) => h - pad.b - (ymax === ymin ? 0.5 : (y - ymin) / (ymax - ymin)) * (h - pad.t - pad.b);
            const border = cssVar("--border", "#1a1a3e"), dim = cssVar("--text-dim", "#7a8ba8");
            if (opts.grid !== false) { ctx.strokeStyle = border; ctx.lineWidth = 1; for (let g = 0; g <= 4; g++) { const yy = pad.t + g / 4 * (h - pad.t - pad.b); ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(w - pad.r, yy); ctx.stroke(); } }
            if (opts.axes !== false) { ctx.fillStyle = dim; ctx.font = "9px monospace"; ctx.textAlign = "right"; for (let g = 0; g <= 4; g++) { const val = ymax - g / 4 * (ymax - ymin); ctx.fillText(val.toFixed(val > 99 || val < -99 ? 0 : 1), pad.l - 4, pad.t + g / 4 * (h - pad.t - pad.b) + 3); } }
            series.forEach((s) => {
                const col = s.color || cssVar("--cyan", "#05d9e8");
                if (s.type === "bar") {
                    const bw = Math.max(1, (w - pad.l - pad.r) / s.pts.length * 0.7);
                    ctx.fillStyle = col; s.pts.forEach((p) => { const y0 = Y(Math.max(0, ymin)); ctx.fillRect(X(p.x) - bw / 2, Math.min(Y(p.y), y0), bw, Math.abs(Y(p.y) - y0)); });
                } else {
                    ctx.strokeStyle = col; ctx.lineWidth = s.width || 1.5; ctx.beginPath();
                    s.pts.forEach((p, i) => { const px = X(p.x), py = Y(p.y); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
                    ctx.stroke();
                    if (s.type === "area") { ctx.lineTo(X(s.pts[s.pts.length - 1].x), Y(ymin)); ctx.lineTo(X(s.pts[0].x), Y(ymin)); ctx.closePath(); ctx.globalAlpha = 0.18; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1; }
                }
            });
        }
        redraw();
        if (typeof ResizeObserver === "function") new ResizeObserver(redraw).observe(host);
        return { el: host, setSeries(list) { series = (list || []).map((s) => ({ ...s, pts: norm(s) })); redraw(); }, redraw };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.chart = chart;
})();
