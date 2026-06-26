// zgui-core/minimap.js — a compact arrangement overview: every track's clips drawn as colored blocks on
// one strip, with a draggable viewport rectangle showing/scrubbing the visible window. Core DAW overview.
// window.ZGui.minimap.
//   ZGui.minimap(container, { tracks:[{color,clips:[{start,length}]}], total, view:{start,end},
//       height:60, onScrub({start,end}) }) -> { el, setView(s,e), set(tracks) }
(function () {
    "use strict";
    function minimap(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let tracks = opts.tracks || [];
        const total = opts.total || 1;
        let view = opts.view ? { start: opts.view.start, end: opts.view.end } : { start: 0, end: total };
        const H = opts.height || 60;

        const cv = document.createElement("canvas"); cv.className = "zg-minimap";
        host.appendChild(cv);
        const ctx = cv.getContext("2d");

        function fit() { const w = host.clientWidth || 600; if (cv.width !== w || cv.height !== H) { cv.width = w; cv.height = H; } draw(); }
        function draw() {
            ctx.clearRect(0, 0, cv.width, cv.height);
            ctx.fillStyle = "#06060e"; ctx.fillRect(0, 0, cv.width, cv.height);
            const n = Math.max(1, tracks.length), rh = cv.height / n, sx = cv.width / total;
            tracks.forEach((t, i) => {
                ctx.fillStyle = t.color || "#05d9e8";
                (t.clips || []).forEach((c) => { ctx.fillRect(c.start * sx, i * rh + 1, Math.max(1, c.length * sx - 1), rh - 2); });
            });
            // viewport
            const vx = view.start * sx, vw = (view.end - view.start) * sx;
            ctx.fillStyle = "rgba(5,217,232,0.12)"; ctx.fillRect(vx, 0, vw, cv.height);
            ctx.strokeStyle = "#05d9e8"; ctx.lineWidth = 1; ctx.strokeRect ? ctx.strokeRect(vx + 0.5, 0.5, vw - 1, cv.height - 1) : (() => { ctx.beginPath(); ctx.rect(vx + 0.5, 0.5, vw - 1, cv.height - 1); ctx.stroke(); })();
        }
        function posAt(clientX) { const r = cv.getBoundingClientRect(); return Math.max(0, Math.min(total, ((clientX - r.left) / (r.width || 1)) * total)); }
        let drag = false;
        cv.addEventListener("pointerdown", (e) => { drag = true; try { cv.setPointerCapture(e.pointerId); } catch { /* */ } const p = posAt(e.clientX), half = (view.end - view.start) / 2; view = { start: Math.max(0, p - half), end: Math.min(total, p + half) }; draw(); if (typeof opts.onScrub === "function") opts.onScrub({ start: view.start, end: view.end }); });
        cv.addEventListener("pointermove", (e) => { if (!drag) return; const p = posAt(e.clientX), half = (view.end - view.start) / 2; view = { start: Math.max(0, p - half), end: Math.min(total, p + half) }; draw(); if (typeof opts.onScrub === "function") opts.onScrub({ start: view.start, end: view.end }); });
        cv.addEventListener("pointerup", (e) => { drag = false; try { cv.releasePointerCapture(e.pointerId); } catch { /* */ } });

        cv.style.width = "100%"; cv.style.height = H + "px"; cv.style.display = "block";
        requestAnimationFrame(fit);
        if (window.ResizeObserver) new ResizeObserver(fit).observe(host); else fit();
        return { el: cv, setView(s, e) { view = { start: s, end: e }; draw(); }, set(t) { tracks = t || []; draw(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.minimap = minimap;
})();
