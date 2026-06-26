// zgui-core/wavetable.js — a wavetable display: the current single-cycle frame drawn prominently with
// faint ghosts of neighbouring frames behind it (pseudo-3D stack) and a position slider to scrub through
// the table. The signature wavetable-synth element (Serum / Vital / Ableton Wavetable). window.ZGui.wavetable.
//   ZGui.wavetable(container, { frames:[[…samples]], position:0, onScrub(pos), height:140,
//       color:'#05d9e8' }) -> { el, setPosition(p), setFrames(f), get() }
//   position is 0..1 across the table; frames default to a saw→sine→square morph if omitted.
(function () {
    "use strict";
    function defaultFrames() {
        const N = 8, L = 256, out = [];
        for (let f = 0; f < N; f++) { const t = f / (N - 1), frame = []; for (let i = 0; i < L; i++) { const ph = i / L; const saw = 2 * ph - 1; const sine = Math.sin(ph * 2 * Math.PI); const sq = ph < 0.5 ? 1 : -1; const v = t < 0.5 ? saw * (1 - t * 2) + sine * (t * 2) : sine * (1 - (t - 0.5) * 2) + sq * ((t - 0.5) * 2); frame.push(v); } out.push(frame); }
        return out;
    }
    function wavetable(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let frames = opts.frames && opts.frames.length ? opts.frames : defaultFrames();
        let pos = opts.position || 0;
        const color = opts.color || "#05d9e8";
        const H = opts.height || 140;

        const root = document.createElement("div"); root.className = "zg-wavetable";
        const cv = document.createElement("canvas"); cv.className = "zg-wavetable-canvas";
        const slider = document.createElement("input"); slider.type = "range"; slider.className = "zg-wavetable-pos"; slider.min = "0"; slider.max = "1000"; slider.value = String(pos * 1000);
        root.appendChild(cv); root.appendChild(slider); host.appendChild(root);
        const ctx = cv.getContext("2d");

        function frameAt(p) {
            const fp = p * (frames.length - 1), i = Math.floor(fp), frac = fp - i;
            const a = frames[i], b = frames[Math.min(frames.length - 1, i + 1)];
            return a.map((v, k) => v * (1 - frac) + b[k] * frac);
        }
        function drawWave(samples, x0, y0, w, h, stroke, alpha) {
            ctx.globalAlpha = alpha; ctx.strokeStyle = stroke; ctx.lineWidth = alpha < 1 ? 1 : 1.5; ctx.beginPath();
            for (let i = 0; i < samples.length; i++) { const x = x0 + (i / (samples.length - 1)) * w, y = y0 + h / 2 - samples[i] * (h / 2) * 0.86; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
            ctx.stroke(); ctx.globalAlpha = 1;
        }
        function fit() { const w = host.clientWidth || 320; if (cv.width !== w || cv.height !== H) { cv.width = w; cv.height = H; } draw(); }
        function draw() {
            ctx.clearRect(0, 0, cv.width, cv.height); ctx.fillStyle = "#070710"; ctx.fillRect(0, 0, cv.width, cv.height);
            // ghosts behind, offset up-right for a stacked look
            const ghosts = 4, gw = cv.width * 0.82, gh = cv.height * 0.5;
            for (let g = ghosts; g >= 1; g--) { const gp = Math.max(0, Math.min(1, pos + (g - ghosts / 2) * 0.12)); const ox = (cv.width - gw) * (g / ghosts), oy = (cv.height - gh) * (1 - g / ghosts) * 0.5; drawWave(frameAt(gp), ox, oy, gw, gh, color, 0.12 + 0.05 * (ghosts - g)); }
            drawWave(frameAt(pos), 6, cv.height * 0.22, cv.width - 12, cv.height * 0.6, color, 1);
        }
        slider.addEventListener("input", () => { pos = +slider.value / 1000; draw(); if (typeof opts.onScrub === "function") opts.onScrub(pos); });

        cv.style.width = "100%"; cv.style.height = H + "px"; cv.style.display = "block";
        requestAnimationFrame(fit);
        if (window.ResizeObserver) new ResizeObserver(fit).observe(host); else fit();
        return { el: root, setPosition(p) { pos = Math.max(0, Math.min(1, p)); slider.value = String(pos * 1000); draw(); }, setFrames(f) { if (f && f.length) { frames = f; draw(); } }, get() { return pos; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.wavetable = wavetable;
})();
