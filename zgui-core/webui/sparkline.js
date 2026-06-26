// zgui-core/sparkline.js — a tiny inline canvas chart (line or bar), no axes. window.ZGui.sparkline.
//   ZGui.sparkline(container, [y,…], { type:'line'|'bar', color, width:80, height:20 }) -> { el, set(data) }
(function () {
    "use strict";
    function cssVar(n, fb) { try { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb; } catch { return fb; } }
    function sparkline(container, data, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const W = opts.width || 80, H = opts.height || 20;
        const canvas = document.createElement("canvas"); canvas.className = "zg-sparkline";
        host.appendChild(canvas);
        let d = data || [];
        function draw() {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + "px"; canvas.style.height = H + "px";
            const ctx = canvas.getContext("2d"); if (!ctx || !d.length) return; ctx.scale(dpr, dpr); ctx.clearRect(0, 0, W, H);
            const mn = Math.min(...d), mx = Math.max(...d), col = opts.color || cssVar("--cyan", "#05d9e8");
            const X = (i) => d.length === 1 ? W / 2 : i / (d.length - 1) * (W - 2) + 1;
            const Y = (v) => mx === mn ? H / 2 : H - 1 - (v - mn) / (mx - mn) * (H - 2);
            if (opts.type === "bar") { const bw = Math.max(1, (W / d.length) * 0.7); ctx.fillStyle = col; d.forEach((v, i) => ctx.fillRect(X(i) - bw / 2, Y(v), bw, H - 1 - Y(v))); }
            else { ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.beginPath(); d.forEach((v, i) => i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))); ctx.stroke(); }
        }
        draw();
        return { el: canvas, set(nd) { d = nd || []; draw(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.sparkline = sparkline;
})();
