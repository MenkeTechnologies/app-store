// zgui-core/morph-path.js — a 2D pad where you draw a trajectory (a recorded path through an XY morph
// space); playing it back animates a cursor along the path so the path itself becomes a modulation source.
// window.ZGui.morphPath.
//   ZGui.morphPath(container, { points:[{x,y}], size:200, labels:{x,y}, onChange(points),
//       onPlay(x,y,t) }) -> { el, set(points), play(durationMs), stop(), setPos(t), clear() }
//   points are 0..1. drag on the pad to draw a new path; play() animates a cursor (calls onPlay).
(function () {
    "use strict";
    function morphPath(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const size = opts.size || 200;
        let pts = (opts.points || []).slice();
        let cursor = null, raf = null;

        const cv = document.createElement("canvas"); cv.className = "zg-morphpath"; cv.width = size; cv.height = size; cv.style.width = size + "px"; cv.style.height = size + "px";
        host.appendChild(cv);
        const ctx = cv.getContext("2d");
        const X = (x) => x * size, Y = (y) => (1 - y) * size;

        function draw() {
            ctx.clearRect(0, 0, size, size); ctx.fillStyle = "#070710"; ctx.fillRect(0, 0, size, size);
            ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.beginPath(); ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size); ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2); ctx.stroke();
            if (pts.length > 1) { ctx.strokeStyle = "#05d9e8"; ctx.lineWidth = 2; ctx.shadowColor = "rgba(5,217,232,0.5)"; ctx.shadowBlur = 6; ctx.beginPath(); pts.forEach((p, i) => { const x = X(p.x), y = Y(p.y); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke(); ctx.shadowBlur = 0; ctx.lineWidth = 1; }
            pts.forEach((p, i) => { ctx.fillStyle = i === 0 ? "#39ff14" : i === pts.length - 1 ? "#ff2a6d" : "rgba(5,217,232,0.5)"; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 2.5, 0, 7); ctx.fill(); });
            if (cursor) { ctx.fillStyle = "#fff"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(X(cursor.x), Y(cursor.y), 4, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
        }
        function pt(e) { const r = cv.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / (r.width || 1))), y: Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / (r.height || 1))) }; }
        let drawing = false;
        cv.addEventListener("pointerdown", (e) => { drawing = true; pts = [pt(e)]; try { cv.setPointerCapture(e.pointerId); } catch { /* */ } draw(); });
        cv.addEventListener("pointermove", (e) => { if (!drawing) return; const p = pt(e), last = pts[pts.length - 1]; if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.02) { pts.push(p); draw(); } });
        cv.addEventListener("pointerup", (e) => { drawing = false; try { cv.releasePointerCapture(e.pointerId); } catch { /* */ } if (typeof opts.onChange === "function") opts.onChange(pts.slice()); });

        function at(t) { if (pts.length < 2) return pts[0] || { x: 0.5, y: 0.5 }; const f = t * (pts.length - 1), i = Math.floor(f), fr = f - i, a = pts[i], b = pts[Math.min(pts.length - 1, i + 1)]; return { x: a.x + (b.x - a.x) * fr, y: a.y + (b.y - a.y) * fr }; }
        function setPos(t) { cursor = at(Math.max(0, Math.min(1, t))); draw(); if (typeof opts.onPlay === "function") opts.onPlay(cursor.x, cursor.y, t); }
        function play(dur) { stop(); dur = dur || 2000; const t0 = (window.performance ? performance.now() : 0); function step(now) { const t = ((now - t0) % dur) / dur; setPos(t); raf = requestAnimationFrame(step); } raf = requestAnimationFrame(step); }
        function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } cursor = null; draw(); }

        draw();
        return { el: cv, set(p) { pts = (p || []).slice(); draw(); }, play, stop, setPos, clear() { pts = []; cursor = null; draw(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.morphPath = morphPath;
})();
