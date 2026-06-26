// zgui-core/bipolar-slider.js — Serum mod-matrix AMOUNT slider. Two things on one control:
//   1. the SET AMOUNT — a capsule handle the user drags left (−) / right (+) from a center detent;
//   2. a live MODULATION CURSOR WATERFALL — every setMod() sample is pushed into a short history and the
//      trail is drawn scrolling upward with a fade, so the modulation source's recent trajectory streams
//      off the baseline like Serum's mod-cursor waterfall (a steady ramp draws a diagonal, an LFO snakes).
// Center-origin: right of center = cyan, left = magenta. Double-click recenters (0). window.ZGui.bipolarSlider.
//   ZGui.bipolarSlider(container, { value:0, min:-1, max:1, center:0, label, showValue:true, format,
//       trail:40, onChange(v) }) -> { el, get(), set(v), setMod(liveValue) }
//   call setMod(currentModulatedValue) every animation frame to feed the waterfall; omit it and the slider
//   is just the static amount handle.
(function () {
    "use strict";
    function bipolarSlider(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const min = opts.min == null ? -1 : opts.min, max = opts.max == null ? 1 : opts.max;
        const center = opts.center == null ? 0 : opts.center;
        let value = opts.value == null ? center : opts.value;
        let modVal = value;     // live modulated value (driven by setMod)
        const TRAIL = opts.trail || 40;
        const history = [];     // recent frac(modVal) samples, oldest→newest — the waterfall
        const fmt = typeof opts.format === "function" ? opts.format : (v) => (v > 0 ? "+" : "") + (Math.abs(max) <= 1 ? Math.round(v * 100) + "%" : v.toFixed(2));

        const root = document.createElement("div"); root.className = "zg-bislider";
        if (opts.label) { const l = document.createElement("span"); l.className = "zg-bislider-label"; l.textContent = opts.label; root.appendChild(l); }
        const track = document.createElement("div"); track.className = "zg-bislider-track";
        const cv = document.createElement("canvas"); cv.className = "zg-bislider-cv";
        const ball = document.createElement("div"); ball.className = "zg-bislider-ball";
        track.appendChild(cv); track.appendChild(ball);
        root.appendChild(track);
        let valEl = null;
        if (opts.showValue !== false) { valEl = document.createElement("span"); valEl.className = "zg-bislider-val"; root.appendChild(valEl); }
        host.appendChild(root);
        const ctx = cv.getContext("2d");

        const frac = (v) => (v - min) / (max - min);   // 0..1 across the track
        function fit() { const w = track.clientWidth || 120, h = track.clientHeight || 26; if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } draw(); }
        function draw() {
            const W = cv.width, H = cv.height, baseY = H - 8, cf = frac(center), cx = cf * W;
            ctx.clearRect(0, 0, W, H);
            const af = frac(value), ax = af * W;
            ball.style.left = (af * 100) + "%";
            const setNeg = value < center, setCol = setNeg ? "#ff2a6d" : "#05d9e8";
            // dialed-amount fill: a faint line along the baseline from center to the handle
            ctx.strokeStyle = setCol; ctx.lineWidth = 2; ctx.globalAlpha = 0.45;
            ctx.beginPath(); ctx.moveTo(cx, baseY); ctx.lineTo(ax, baseY); ctx.stroke();
            // modulation-cursor waterfall: newest sample at the baseline, older ones scroll upward + fade,
            // each at its own x — a steady ramp draws a diagonal, an LFO snakes.
            const n = history.length;
            if (n > 1) {
                ctx.lineWidth = 1.5;
                for (let i = 1; i < n; i++) {
                    const a0 = (n - 1 - (i - 1)) / TRAIL, a1 = (n - 1 - i) / TRAIL;   // age 0=newest
                    const x0 = cx + (history[i - 1] - cf) * W, y0 = baseY - a0 * (baseY - 2);
                    const x1 = cx + (history[i] - cf) * W, y1 = baseY - a1 * (baseY - 2);
                    const neg = history[i] < cf;
                    ctx.globalAlpha = Math.max(0, 1 - a1) * 0.9; ctx.strokeStyle = neg ? "#ff2a6d" : "#05d9e8";
                    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
                }
                // bright current cursor dot at the baseline
                const mf = history[n - 1], neg = mf < cf, col = neg ? "#ff2a6d" : "#05d9e8";
                ctx.globalAlpha = 1; ctx.shadowColor = neg ? "rgba(255,42,109,0.6)" : "rgba(5,217,232,0.6)"; ctx.shadowBlur = 6;
                ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx + (mf - cf) * W, baseY, 2.6, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
            }
            ctx.globalAlpha = 1;
            if (valEl) valEl.textContent = fmt(value);
        }
        function setFromX(clientX) { const r = track.getBoundingClientRect(); let f = (clientX - r.left) / (r.width || 1); f = Math.max(0, Math.min(1, f)); value = min + f * (max - min); modVal = value; draw(); if (typeof opts.onChange === "function") opts.onChange(value); }
        let drag = false;
        track.addEventListener("pointerdown", (e) => { drag = true; try { track.setPointerCapture(e.pointerId); } catch { /* */ } setFromX(e.clientX); e.preventDefault(); });
        track.addEventListener("pointermove", (e) => { if (drag) setFromX(e.clientX); });
        const end = (e) => { drag = false; try { track.releasePointerCapture(e.pointerId); } catch { /* */ } };
        track.addEventListener("pointerup", end); track.addEventListener("pointercancel", end);
        track.addEventListener("dblclick", () => { value = center; modVal = center; draw(); if (typeof opts.onChange === "function") opts.onChange(value); });

        requestAnimationFrame(fit);
        if (window.ResizeObserver) new ResizeObserver(fit).observe(track); else fit();
        return {
            el: root, get() { return value; },
            set(v) { value = Math.max(min, Math.min(max, v)); modVal = value; draw(); },
            setMod(v) { modVal = Math.max(min, Math.min(max, v == null ? value : v)); history.push(frac(modVal)); if (history.length > TRAIL) history.shift(); draw(); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.bipolarSlider = bipolarSlider;
})();
