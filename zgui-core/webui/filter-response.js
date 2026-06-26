// zgui-core/filter-response.js — a filter frequency-response display: draws the magnitude curve of a
// biquad (lowpass / highpass / bandpass / notch) over a log-frequency axis, with a draggable node where
// x = cutoff and y = resonance. Optional FFT spectrum behind it. Found in every modern synth filter
// section. window.ZGui.filterResponse.   Magnitude via the RBJ cookbook biquad (no Web Audio).
//   ZGui.filterResponse(container, { type:'lowpass', cutoff:0.5, resonance:0.3, sampleRate:48000,
//       height:140, onChange({cutoff,resonance,freq}) }) -> { el, set({type,cutoff,resonance}), setSpectrum(u8,sr,fft) }
(function () {
    "use strict";
    const FMIN = 20, FMAX = 20000;
    function filterResponse(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const SR = opts.sampleRate || 48000, H = opts.height || 140;
        const st = { type: opts.type || "lowpass", cutoff: opts.cutoff == null ? 0.5 : opts.cutoff, resonance: opts.resonance == null ? 0.3 : opts.resonance };
        let spectrum = null, specSr = SR, specFft = 2048;

        const cv = document.createElement("canvas"); cv.className = "zg-filterresp";
        host.appendChild(cv);
        const ctx = cv.getContext("2d");

        const cutoffHz = () => FMIN * Math.pow(FMAX / FMIN, st.cutoff);
        const Q = () => 0.5 + st.resonance * 11.5;            // 0.5 .. 12
        const fToX = (f, w) => (Math.log(f / FMIN) / Math.log(FMAX / FMIN)) * w;
        const xToCut = (x, w) => Math.log((FMIN * Math.pow(FMAX / FMIN, x / w)) / FMIN) / Math.log(FMAX / FMIN);

        // RBJ biquad coeffs for the current type
        function coeffs() {
            const w0 = 2 * Math.PI * cutoffHz() / SR, cw = Math.cos(w0), sw = Math.sin(w0), alpha = sw / (2 * Q());
            let b0, b1, b2, a0, a1, a2;
            switch (st.type) {
                case "highpass": b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; break;
                case "bandpass": b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; break;
                case "notch": b0 = 1; b1 = -2 * cw; b2 = 1; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; break;
                default: b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; break; // lowpass
            }
            return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
        }
        function magDb(f, c) {
            const w = 2 * Math.PI * f / SR, cosw = Math.cos(w), sinw = Math.sin(w), cos2 = Math.cos(2 * w), sin2 = Math.sin(2 * w);
            const nr = c[0] + c[1] * cosw + c[2] * cos2, ni = -(c[1] * sinw + c[2] * sin2);
            const dr = 1 + c[3] * cosw + c[4] * cos2, di = -(c[3] * sinw + c[4] * sin2);
            const num = Math.sqrt(nr * nr + ni * ni), den = Math.sqrt(dr * dr + di * di) || 1e-9;
            return 20 * Math.log10(num / den);
        }
        function fit() { const w = host.clientWidth || 320; if (cv.width !== w || cv.height !== H) { cv.width = w; cv.height = H; } draw(); }
        function draw() {
            const w = cv.width, h = cv.height, GMAX = 24;
            ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#070710"; ctx.fillRect(0, 0, w, h);
            const dbToY = (db) => h / 2 - (db / GMAX) * (h / 2) * 0.9;
            // spectrum
            if (spectrum) { ctx.fillStyle = "rgba(255,42,109,0.18)"; ctx.beginPath(); ctx.moveTo(0, h); for (let i = 1; i < spectrum.length; i++) { const f = i * specSr / specFft; if (f < FMIN || f > FMAX) continue; const x = fToX(f, w), y = h - (spectrum[i] / 255) * h; ctx.lineTo(x, y); } ctx.lineTo(w, h); ctx.closePath(); ctx.fill(); }
            // grid line at 0 dB
            ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.beginPath(); ctx.moveTo(0, dbToY(0)); ctx.lineTo(w, dbToY(0)); ctx.stroke();
            // response curve
            const c = coeffs();
            ctx.strokeStyle = "#05d9e8"; ctx.lineWidth = 2; ctx.beginPath();
            for (let x = 0; x <= w; x += 2) { const f = FMIN * Math.pow(FMAX / FMIN, x / w); const y = dbToY(Math.max(-GMAX, Math.min(GMAX, magDb(f, c)))); if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
            ctx.stroke(); ctx.lineWidth = 1;
            // node at cutoff
            const nx = fToX(cutoffHz(), w), ny = h - st.resonance * h;
            ctx.fillStyle = "#fff"; ctx.strokeStyle = "#05d9e8"; ctx.beginPath(); ctx.arc(nx, Math.max(6, Math.min(h - 6, ny)), 5, 0, 7); ctx.fill(); ctx.stroke();
        }
        function pt(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / (r.width || 1) * cv.width, y: (e.clientY - r.top) / (r.height || 1) * cv.height }; }
        let drag = false;
        cv.addEventListener("pointerdown", (e) => { drag = true; try { cv.setPointerCapture(e.pointerId); } catch { /* */ } move(e); });
        cv.addEventListener("pointermove", (e) => { if (drag) move(e); });
        cv.addEventListener("pointerup", (e) => { drag = false; try { cv.releasePointerCapture(e.pointerId); } catch { /* */ } });
        function move(e) { const p = pt(e); st.cutoff = Math.max(0, Math.min(1, xToCut(p.x, cv.width))); st.resonance = Math.max(0, Math.min(1, 1 - p.y / cv.height)); draw(); if (typeof opts.onChange === "function") opts.onChange({ cutoff: st.cutoff, resonance: st.resonance, freq: cutoffHz() }); }

        cv.style.width = "100%"; cv.style.height = H + "px"; cv.style.display = "block"; cv.style.touchAction = "none";
        requestAnimationFrame(fit);
        if (window.ResizeObserver) new ResizeObserver(fit).observe(host); else fit();
        return { el: cv, set(o) { Object.assign(st, o || {}); draw(); }, setSpectrum(u8, sr, fft) { spectrum = u8; if (sr) specSr = sr; if (fft) specFft = fft; draw(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.filterResponse = filterResponse;
})();
