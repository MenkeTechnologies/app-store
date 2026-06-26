// zgui-core/eq.js — a parametric EQ editor ("FFT with EQ"): a log-frequency response curve with
// draggable band nodes, drawn over an optional FFT spectrum fill. Ported from Audio-Haxor's
// parametric EQ (freqToX/gainToY/drawEqPanelGrid/drawEqSpectrumFill). The Web-Audio
// getFrequencyResponse coupling is replaced by JS RBJ-biquad magnitude, so it needs no engine.
// window.ZGui.parametricEq.   Pairs with eq.css.
//   ZGui.parametricEq({ bands:[{type:'lowshelf'|'peaking'|'highshelf', freq, gain, q}], freqMin=20,
//       freqMax=20000, gainMax=24, sampleRate=48000, onChange }) ->
//       { el, set(i,prop,v), setBands(arr), setSpectrum(u8, sampleRate, fftSize), get() }
//   drag a node: x = frequency (log), y = gain (dB). onChange(i, band).
(function () {
    "use strict";
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    // RBJ-cookbook biquad magnitude (dB) of one band at frequency f.
    function bandDb(band, f, SR) {
        const A = Math.pow(10, (band.gain || 0) / 40), w0 = 2 * Math.PI * band.freq / SR;
        const cw = Math.cos(w0), sw = Math.sin(w0), Q = band.q || 0.7, alpha = sw / (2 * Q);
        let b0, b1, b2, a0, a1, a2;
        if (band.type === "peaking") {
            b0 = 1 + alpha * A; b1 = -2 * cw; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cw; a2 = 1 - alpha / A;
        } else if (band.type === "lowshelf") {
            const s = 2 * Math.sqrt(A) * alpha;
            b0 = A * ((A + 1) - (A - 1) * cw + s); b1 = 2 * A * ((A - 1) - (A + 1) * cw); b2 = A * ((A + 1) - (A - 1) * cw - s);
            a0 = (A + 1) + (A - 1) * cw + s; a1 = -2 * ((A - 1) + (A + 1) * cw); a2 = (A + 1) + (A - 1) * cw - s;
        } else { // highshelf
            const s = 2 * Math.sqrt(A) * alpha;
            b0 = A * ((A + 1) + (A - 1) * cw + s); b1 = -2 * A * ((A - 1) + (A + 1) * cw); b2 = A * ((A + 1) + (A - 1) * cw - s);
            a0 = (A + 1) - (A - 1) * cw + s; a1 = 2 * ((A - 1) - (A + 1) * cw); a2 = (A + 1) - (A - 1) * cw - s;
        }
        const w = 2 * Math.PI * f / SR, cw1 = Math.cos(w), sw1 = Math.sin(w), cw2 = Math.cos(2 * w), sw2 = Math.sin(2 * w);
        const nRe = b0 + b1 * cw1 + b2 * cw2, nIm = -(b1 * sw1 + b2 * sw2);
        const dRe = a0 + a1 * cw1 + a2 * cw2, dIm = -(a1 * sw1 + a2 * sw2);
        return 20 * Math.log10(Math.hypot(nRe, nIm) / (Math.hypot(dRe, dIm) || 1e-9));
    }

    function parametricEq(opts) {
        opts = opts || {};
        const FMIN = opts.freqMin || 20, FMAX = opts.freqMax || 20000, GMAX = opts.gainMax || 24, SR = opts.sampleRate || 48000;
        const bands = (opts.bands || [
            { type: "lowshelf", freq: 120, gain: 0, q: 0.7 },
            { type: "peaking", freq: 1000, gain: 0, q: 1 },
            { type: "highshelf", freq: 6000, gain: 0, q: 0.7 },
        ]).map((b) => Object.assign({}, b));
        let spec = null;   // { data, sampleRate, fftSize }

        const el = document.createElement("div");
        el.className = "zg-eq";
        const cv = document.createElement("canvas");
        cv.className = "zg-eq-canvas"; cv.width = 480; cv.height = 180;
        el.appendChild(cv);
        const ctx = cv.getContext("2d");

        const W = () => cv.width, H = () => cv.height;
        const freqToX = (f) => (Math.log10(f / FMIN) / Math.log10(FMAX / FMIN)) * W();
        const xToFreq = (x) => FMIN * Math.pow(FMAX / FMIN, x / W());
        const gainToY = (g) => H() / 2 - (g / GMAX) * (H() / 2 - 10);
        const yToGain = (y) => -((y - H() / 2) / (H() / 2 - 10)) * GMAX;
        const totalDb = (f) => bands.reduce((s, b) => s + bandDb(b, f, SR), 0);

        function drawGrid() {
            ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1;
            for (const f of [100, 1000, 10000]) {
                if (f < FMIN || f > FMAX) continue;
                const x = freqToX(f);
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H()); ctx.stroke();
                ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.font = "9px sans-serif";
                ctx.fillText(f >= 1000 ? (f / 1000) + "k" : f, x + 2, H() - 3);
            }
            const zy = gainToY(0);
            ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.beginPath(); ctx.moveTo(0, zy); ctx.lineTo(W(), zy); ctx.stroke();
        }
        function drawSpectrum() {
            if (!spec || !spec.data) return;
            const w = W(), h = H(), N = 160;
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, "rgba(211,0,197,0.25)"); grad.addColorStop(0.5, "rgba(5,217,232,0.12)"); grad.addColorStop(1, "rgba(5,217,232,0.02)");
            ctx.beginPath(); ctx.moveTo(0, h);
            for (let i = 0; i < N; i++) {
                const f = FMIN * Math.pow(FMAX / FMIN, i / (N - 1)), x = freqToX(f);
                const bin = Math.round(f * spec.fftSize / spec.sampleRate);
                const mag = (spec.data[Math.max(0, Math.min(spec.data.length - 1, bin))] || 0) / 255;
                ctx.lineTo(x, h - mag * h);
            }
            ctx.lineTo(w, h); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
        }
        function drawCurve() {
            ctx.beginPath();
            for (let x = 0; x <= W(); x += 2) { const y = gainToY(clamp(totalDb(xToFreq(x)), -GMAX, GMAX)); x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
            ctx.strokeStyle = "rgba(5,217,232,0.95)"; ctx.lineWidth = 2; ctx.shadowBlur = 6; ctx.shadowColor = "rgba(5,217,232,0.6)"; ctx.stroke(); ctx.shadowBlur = 0;
        }
        function drawNodes() {
            bands.forEach((b) => {
                ctx.beginPath(); ctx.arc(freqToX(b.freq), gainToY(b.gain), 5, 0, 2 * Math.PI);
                ctx.fillStyle = "var(--accent)"; ctx.fillStyle = "#ff2a6d"; ctx.fill();
                ctx.strokeStyle = "#06060e"; ctx.lineWidth = 1.5; ctx.stroke();
            });
        }
        function draw() { ctx.clearRect(0, 0, W(), H()); drawGrid(); drawSpectrum(); drawCurve(); drawNodes(); }

        function nodeAt(px, py) {
            for (let i = 0; i < bands.length; i++) { if (Math.hypot(freqToX(bands[i].freq) - px, gainToY(bands[i].gain) - py) < 10) return i; }
            return -1;
        }
        function evt(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / (r.width || 1) * W(), y: (e.clientY - r.top) / (r.height || 1) * H() }; }
        let drag = -1;
        cv.addEventListener("pointerdown", (e) => { const p = evt(e); drag = nodeAt(p.x, p.y); if (drag >= 0) { try { cv.setPointerCapture(e.pointerId); } catch { /* */ } e.preventDefault(); } });
        cv.addEventListener("pointermove", (e) => {
            if (drag < 0) return;
            const p = evt(e), b = bands[drag];
            b.freq = clamp(xToFreq(p.x), FMIN, FMAX); b.gain = clamp(yToGain(p.y), -GMAX, GMAX);
            draw();
            if (typeof opts.onChange === "function") opts.onChange(drag, Object.assign({}, b));
        });
        const end = (e) => { drag = -1; try { cv.releasePointerCapture(e.pointerId); } catch { /* */ } };
        cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);

        draw();
        return {
            el,
            set(i, prop, v) { if (bands[i] && prop in bands[i]) { bands[i][prop] = v; draw(); } },
            setBands(arr) { if (arr) { bands.length = 0; arr.forEach((b) => bands.push(Object.assign({}, b))); draw(); } },
            setSpectrum(data, sampleRate, fftSize) { spec = { data, sampleRate: sampleRate || SR, fftSize: fftSize || 2048 }; draw(); },
            get() { return bands.map((b) => Object.assign({}, b)); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.parametricEq = parametricEq;
})();
