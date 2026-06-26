// zgui-core/euclid-wheel.js — concentric Euclidean/polyrhythm rings: each ring has `steps` slots around
// a circle with `pulses` evenly distributed (Euclidean), a rotation offset, and a sweeping play cursor;
// the rings phase against each other. Click a slot to toggle it. window.ZGui.euclidWheel.
//   ZGui.euclidWheel(container, { rings:[{steps,pulses,rotation,color,mask}], size:220, onChange(rings),
//       playStep:{ringIndex:step} }) -> { el, set(rings), setStep(map), get() }
(function () {
    "use strict";
    // even pulse distribution (bucket method — same result as Bjorklund for our purposes)
    function euclid(steps, pulses) {
        const out = new Array(steps).fill(false);
        if (pulses <= 0) return out; if (pulses >= steps) return out.fill(true);
        let bucket = 0; for (let i = 0; i < steps; i++) { bucket += pulses; if (bucket >= steps) { bucket -= steps; out[i] = true; } }
        return out;
    }
    function euclidWheel(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const size = opts.size || 220;
        let rings = (opts.rings || []).map((r) => ({ steps: r.steps, pulses: r.pulses, rotation: r.rotation || 0, color: r.color || "#05d9e8", mask: r.mask ? r.mask.slice() : euclid(r.steps, r.pulses) }));
        let play = opts.playStep || {};

        const cv = document.createElement("canvas"); cv.className = "zg-euclid"; cv.width = size; cv.height = size; cv.style.width = size + "px"; cv.style.height = size + "px";
        host.appendChild(cv);
        const ctx = cv.getContext("2d");
        const cx = size / 2, cy = size / 2;
        const ringGap = (size / 2 - 14) / Math.max(1, rings.length);

        function draw() {
            ctx.clearRect(0, 0, size, size); ctx.fillStyle = "#05050a"; ctx.fillRect(0, 0, size, size);
            rings.forEach((ring, ri) => {
                const radius = 14 + (ri + 0.5) * ringGap;
                const cur = play[ri];
                ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, 2 * Math.PI); ctx.stroke();
                for (let s = 0; s < ring.steps; s++) {
                    const ang = -Math.PI / 2 + ((s + ring.rotation) / ring.steps) * 2 * Math.PI;
                    const x = cx + Math.cos(ang) * radius, y = cy + Math.sin(ang) * radius;
                    const on = ring.mask[s], isCur = cur === s;
                    ctx.beginPath(); ctx.arc(x, y, on ? 5 : 3, 0, 2 * Math.PI);
                    if (on) { ctx.fillStyle = ring.color; ctx.shadowColor = ring.color; ctx.shadowBlur = isCur ? 12 : 5; ctx.fill(); ctx.shadowBlur = 0; }
                    else { ctx.strokeStyle = isCur ? ring.color : "rgba(255,255,255,0.2)"; ctx.stroke(); }
                    if (isCur) { ctx.strokeStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 7, 0, 2 * Math.PI); ctx.stroke(); }
                }
            });
        }
        cv.addEventListener("pointerdown", (e) => {
            const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) / (r.width || 1) * size, my = (e.clientY - r.top) / (r.height || 1) * size;
            const dist = Math.hypot(mx - cx, my - cy), ri = Math.floor((dist - 14) / ringGap);
            if (ri < 0 || ri >= rings.length) return;
            const ring = rings[ri]; let ang = Math.atan2(my - cy, mx - cx) + Math.PI / 2; if (ang < 0) ang += 2 * Math.PI;
            const s = (Math.round((ang / (2 * Math.PI)) * ring.steps) - ring.rotation % ring.steps + ring.steps) % ring.steps;
            ring.mask[s] = !ring.mask[s]; draw(); if (typeof opts.onChange === "function") opts.onChange(rings);
        });
        draw();
        return { el: cv, set(r) { rings = (r || []).map((x) => ({ steps: x.steps, pulses: x.pulses, rotation: x.rotation || 0, color: x.color || "#05d9e8", mask: x.mask ? x.mask.slice() : euclid(x.steps, x.pulses) })); draw(); }, setStep(map) { play = map || {}; draw(); }, get() { return rings; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.euclidWheel = euclidWheel;
})();
