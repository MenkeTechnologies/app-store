// zgui-core/viz.js — audio VISUALIZER renderers, shared across the audio apps (Audio-Haxor, zpwr-daw,
// zpwr-synth/fx/midi-fx, zpwr-patch-core). The DRAWING math lives here (pure canvas renderers that take
// analysis data + options and paint a cyberpunk HUD); each app keeps its own DATA ACQUISITION (Web Audio
// AnalyserNode, engine spectrum, freeze/mode state) and just feeds the arrays in. So haxor's FFT and zpc's
// waterfall become one shared library both draw from. window.ZGui.viz.
//
//   ZGui.viz.hudBackdrop(ctx, w, h)                       // the neon grid backdrop every tile sits on
//   ZGui.viz.fft(ctx, w, h, freq, opts)                  // freq: Uint8Array (0..255); opts below
//   ZGui.viz.oscilloscope(ctx, w, h, time, opts)         // time: Float32Array (-1..1)
//   ZGui.viz.spectrogram(opts) -> { draw(ctx,w,h,freq), reset() }   // 2D scrolling heat (stateful)
//   ZGui.viz.triggerIndex(time) -> int                   // rising-zero-cross for a stable scope sweep
//
//   fft opts:  { logScale=false, sampleRate=44100, fftSize=2048, engineOffset=0, logFmax=20000, binF? }
//   osc opts:  { color='cyan'|'magenta'|'green', start=0 }   (start = trigger offset; see triggerIndex)
//   spectrogram opts: { speed=2 }   (px per history column)
(function () {
    "use strict";

    // ── shared cyberpunk drawing helpers (ported from Audio-Haxor _vizHudBackdrop/_vizNeonBarGradient/…) ──
    function hudBackdrop(ctx, w, h) {
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, "rgba(2,10,26,0.98)");
        bg.addColorStop(0.45, "rgba(6,4,18,0.96)");
        bg.addColorStop(1, "rgba(0,0,0,0.94)");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
        const step = Math.max(40, Math.floor(Math.min(w, h) / 10));
        ctx.strokeStyle = "rgba(5,217,232,0.055)";
        ctx.lineWidth = 1;
        for (let x = 0; x <= w; x += step) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke(); }
        for (let y = 0; y <= h; y += step) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }
        ctx.strokeStyle = "rgba(211,0,197,0.05)";
        ctx.beginPath(); ctx.moveTo(0, h * 0.5 + 0.5); ctx.lineTo(w, h * 0.5 + 0.5); ctx.stroke();
    }
    function neonBarGradient(ctx, x, y0, y1, t) {
        const g = ctx.createLinearGradient(x, y0, x, y1);
        const r = Math.floor(5 + t * 206), gg = Math.floor(217 - t * 167), b = Math.floor(232 - t * 35);
        g.addColorStop(0, `rgba(${r},${gg},${b},1)`);
        g.addColorStop(0.55, `rgba(${r},${gg},${b},0.88)`);
        g.addColorStop(1, `rgba(${Math.min(255, r + 30)},${gg},${b},0.45)`);
        return g;
    }
    function fillRoundTopBar(ctx, x, yTop, bw, bh, fillStyle) {
        if (bh <= 0.5 || bw <= 0) return;
        const r = Math.min(bh * 0.12, bw * 0.35, 6);
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.moveTo(x, yTop + bh);
        ctx.lineTo(x, yTop + r);
        ctx.quadraticCurveTo(x, yTop, x + r, yTop);
        ctx.lineTo(x + bw - r, yTop);
        ctx.quadraticCurveTo(x + bw, yTop, x + bw, yTop + r);
        ctx.lineTo(x + bw, yTop + bh);
        ctx.closePath();
        ctx.fill();
    }

    // ── FFT spectrum (ported from Audio-Haxor _drawFFT; log + linear branches) ──
    function fft(ctx, w, h, data, opts) {
        opts = opts || {};
        const bufLen = data.length;
        const sr = opts.sampleRate || 44100;
        const fftSize = opts.fftSize || (bufLen * 2);
        const engineOffset = opts.engineOffset || 0;
        hudBackdrop(ctx, w, h);
        if (opts.logScale) {
            const minF = 20, maxF = Math.min(sr / 2, opts.logFmax || 20000);
            const logMin = Math.log10(minF), logMax = Math.log10(maxF);
            const maxCols = Math.min(w, 4096), colW = w / maxCols;
            const binF = typeof opts.binF === "function" ? opts.binF : (f) => (f * fftSize) / sr - engineOffset;
            for (let c = 0; c < maxCols; c++) {
                const t = (c + 0.5) / maxCols;
                const freq = Math.pow(10, logMin + t * (logMax - logMin));
                const bin = Math.round(Math.max(0, Math.min(bufLen - 1, binF(freq))));
                const barH = (data[bin] / 255) * h;
                const x = c * colW, bw = Math.max(1, colW - 0.25);
                fillRoundTopBar(ctx, x, h - barH, bw, barH, neonBarGradient(ctx, x, h - barH, h, t));
            }
            ctx.fillStyle = "rgba(122,139,168,0.42)";
            ctx.font = `${Math.max(8, h / 40)}px "Share Tech Mono", ui-monospace, monospace`;
            ctx.textAlign = "center";
            [50, 100, 200, 500, 1000, 2000, 5000, 10000].forEach((f) => {
                const x = ((Math.log10(f) - logMin) / (logMax - logMin)) * w;
                ctx.fillText(f >= 1000 ? (f / 1000) + "k" : f + "", x, h - 2);
            });
        } else {
            const nyq = sr * 0.5;
            for (let i = 0; i < bufLen; i++) {
                const barH = (data[i] / 255) * h;
                const k0 = engineOffset ? i + 1 : i, k1 = engineOffset ? i + 2 : i + 1;
                const fL = Math.max(0, (k0 * sr) / fftSize), fR = Math.min(nyq, (k1 * sr) / fftSize);
                const x = (fL / nyq) * w, bw = Math.max(1, ((fR - fL) / nyq) * w - 0.5);
                const t = i / Math.max(1, bufLen - 1);
                fillRoundTopBar(ctx, x, h - barH, bw, barH, neonBarGradient(ctx, x, h - barH, h, t));
            }
        }
    }

    // rising-zero-cross trigger for a stable oscilloscope sweep (ported from _vizOscilloscopeTriggerIndex idea)
    function triggerIndex(data) {
        const n = data.length, half = n >> 1;
        for (let i = 1; i < half; i++) if (data[i - 1] <= 0 && data[i] > 0) return i;
        return 0;
    }

    // ── oscilloscope time-domain trace (ported from _drawOscilloscope) ──
    function oscilloscope(ctx, w, h, data, opts) {
        opts = opts || {};
        const bufLen = data.length;
        hudBackdrop(ctx, w, h);
        const start = opts.start || 0;
        const color = opts.color === "magenta" ? "rgba(211,0,197,0.92)" : opts.color === "green" ? "rgba(57,255,20,0.9)" : "rgba(5,217,232,0.92)";
        const glow = opts.color === "magenta" ? "rgba(211,0,197,0.35)" : opts.color === "green" ? "rgba(57,255,20,0.35)" : "rgba(5,217,232,0.4)";
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath();
        const sliceW = w / bufLen;
        for (let i = 0; i < bufLen; i++) {
            const idx = start ? (start + i) % bufLen : i;
            const x = i * sliceW, y = (0.5 - data[idx] * 0.5) * h;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.shadowColor = glow; ctx.shadowBlur = 10;
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(122,139,168,0.14)"; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = "rgba(122,139,168,0.08)";
        ctx.beginPath(); ctx.moveTo(0, h / 4); ctx.lineTo(w, h / 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, h * 3 / 4); ctx.lineTo(w, h * 3 / 4); ctx.stroke();
    }

    // ── 2D scrolling spectrogram (ported from _drawSpectrogram) — stateful ring buffer ──
    function spectrogram(opts) {
        opts = opts || {};
        const speed = opts.speed || 2;
        let cols = null, idx = 0, len = 0;
        function ensure(w, binLen) {
            const maxCols = Math.max(1, Math.floor(w / speed));
            if (!cols || cols.length !== maxCols || len !== binLen) {
                cols = new Array(maxCols);
                for (let i = 0; i < maxCols; i++) cols[i] = new Uint8Array(binLen);
                idx = 0; len = binLen;
            }
            return maxCols;
        }
        return {
            reset() { cols = null; idx = 0; len = 0; },
            draw(ctx, w, h, data, push) {
                const bufLen = data.length;
                const maxCols = ensure(w, bufLen);
                if (push !== false) { cols[idx].set(data); idx = (idx + 1) % maxCols; }
                hudBackdrop(ctx, w, h);
                const colW = w / maxCols, binStep = Math.max(1, Math.floor(bufLen / 256)), cw = Math.max(0.85, colW * 0.92);
                for (let col = 0; col < maxCols; col++) {
                    const cd = cols[(idx + col) % maxCols];
                    if (!cd) continue;
                    const x = col * colW + (colW - cw) * 0.5;
                    for (let bin = 0; bin < bufLen; bin += binStep) {
                        const mag = cd[bin] / 255;
                        if (mag < 0.012) continue;
                        const y = h - (bin / bufLen) * h;
                        const binH = Math.max(0.85, Math.ceil((h / bufLen) * binStep));
                        const r = Math.floor(mag * 211 + (1 - mag) * 5), g = Math.floor(mag * mag * 55), b = Math.floor(mag * 197 + (1 - mag) * 24);
                        ctx.fillStyle = `rgba(${r},${g},${b},${mag * 0.62 + 0.1})`;
                        ctx.fillRect(x, y - binH, cw, binH);
                    }
                }
            },
        };
    }

    // ── waveform (ported from Audio-Haxor renderWaveformData) — accepts {max,min}[] envelope OR number[] ──
    function waveform(ctx, w, h, peaks) {
        const mid = h / 2;
        ctx.clearRect(0, 0, w, h);
        if (!peaks || peaks.length === 0) {
            ctx.strokeStyle = "rgba(5,217,232,0.3)"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
            return;
        }
        if (typeof peaks[0] === "object") {
            const barW = w / peaks.length;
            ctx.beginPath(); ctx.moveTo(0, mid);
            for (let i = 0; i < peaks.length; i++) ctx.lineTo((i + 0.5) * barW, mid - peaks[i].max * mid * 0.92);
            for (let i = peaks.length - 1; i >= 0; i--) ctx.lineTo((i + 0.5) * barW, mid - peaks[i].min * mid * 0.92);
            ctx.closePath();
            const grad = ctx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, "rgba(5,217,232,0.5)"); grad.addColorStop(0.5, "rgba(108,108,232,0.5)"); grad.addColorStop(1, "rgba(211,0,197,0.5)");
            ctx.fillStyle = grad; ctx.fill();
            ctx.beginPath();
            for (let i = 0; i < peaks.length; i++) {
                const x = (i + 0.5) * barW, rms = (peaks[i].max - peaks[i].min) * 0.35;
                ctx.moveTo(x, mid - rms * mid); ctx.lineTo(x, mid + rms * mid);
            }
            const grad2 = ctx.createLinearGradient(0, 0, w, 0);
            grad2.addColorStop(0, "rgba(5,217,232,0.8)"); grad2.addColorStop(1, "rgba(211,0,197,0.8)");
            ctx.strokeStyle = grad2; ctx.lineWidth = 1; ctx.stroke();
        } else {
            const barW = w / peaks.length;
            for (let i = 0; i < peaks.length; i++) {
                const barH = peaks[i] * mid * 0.9, x = i * barW, t = i / peaks.length;
                const r = Math.round(5 + t * 250), g = Math.round(217 - t * 175), b = Math.round(232 - t * 23);
                ctx.fillStyle = `rgba(${r},${g},${b},0.6)`;
                ctx.fillRect(x, mid - barH, barW - 0.5, barH * 2);
            }
        }
    }

    // ── 3D Razor-style spectral waterfall (ported from zpwr-patch-core drawWaterfall) ──
    // hist: array of spectrum frames (newest last), each a number[] of dB-ish values; DEPTH front-to-back.
    function waterfall(ctx, w, h, hist, opts) {
        opts = opts || {};
        const DEPTH = opts.depth || 28, persp = opts.persp || 0.55, riseY = opts.riseY || 0.6, skewX = opts.skewX || 0.22;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#06060e"; ctx.fillRect(0, 0, w, h);
        for (let fr = hist.length - 1; fr >= 0; fr--) {
            const frame = hist[fr], n = frame.length, t = fr / DEPTH, scl = 1 - persp * t;
            const offX = t * w * skewX, offY = t * h * riseY, a = (1 - t) * 0.85 + 0.12;
            ctx.strokeStyle = "rgba(5,217,232," + a.toFixed(3) + ")"; ctx.lineWidth = Math.max(0.5, 1.1 - t);
            ctx.beginPath();
            for (let i = 0; i < n; i++) {
                const v = Math.max(0, (frame[i] + 100) / 100);
                const x = offX + (i / (n - 1)) * w * scl, y = (h - 2 - offY) - v * h * 0.78 * scl;
                if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
            }
            ctx.stroke();
        }
    }

    // ── stereo scope graphs (ported from Audio-Haxor audio-engine.js AE diagnostics) ──
    // The app feeds engine scope samples as scope = { l, r, n } (Uint8Array, centered at 128).
    function scopeBackdrop(ctx, w, h) {
        ctx.fillStyle = "rgba(6,8,22,0.88)"; ctx.fillRect(0, 0, w, h);
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "rgba(5,217,232,0.06)"); g.addColorStop(1, "rgba(211,0,197,0.04)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    function _scopePlaceholder(ctx, w, h) {
        ctx.fillStyle = "rgba(122,139,168,0.5)";
        ctx.font = `${Math.max(10, h / 22)}px "Share Tech Mono", ui-monospace, monospace`;
        ctx.textAlign = "center"; ctx.fillText("—", w / 2, h / 2);
    }

    // SHARED ANALYSIS MATH — Pearson L/R correlation [-1,1] + stereo width RMS(side)/RMS(mid).
    // This is the metric that was duplicated as inline JS per app; one copy here. Returns {corr, width}.
    function stereoMetrics(sl, sr, n) {
        if (n < 16 || !sl || !sr) return { corr: null, width: null };
        const step = Math.max(1, Math.floor(n / 420));
        let cnt = 0, sumL = 0, sumR = 0;
        for (let i = 0; i < n; i += step) { sumL += (sl[i] - 128) / 128; sumR += (sr[i] - 128) / 128; cnt++; }
        const meanL = sumL / cnt, meanR = sumR / cnt;
        let vL = 0, vR = 0, cLR = 0, sqMid = 0, sqSide = 0;
        for (let i = 0; i < n; i += step) {
            const l = (sl[i] - 128) / 128, r = (sr[i] - 128) / 128, dl = l - meanL, dr = r - meanR;
            vL += dl * dl; vR += dr * dr; cLR += dl * dr;
            const mid = (l + r) * 0.5, side = (l - r) * 0.5; sqMid += mid * mid; sqSide += side * side;
        }
        const den = Math.sqrt(vL * vR);
        const corr = den > 1e-12 ? Math.max(-1, Math.min(1, cLR / den)) : null;
        const rmsMid = Math.sqrt(sqMid / cnt), rmsSide = Math.sqrt(sqSide / cnt);
        return { corr, width: rmsMid > 1e-8 ? rmsSide / rmsMid : null };
    }

    // Lissajous (L→horizontal, R→vertical) — ported from aeDrawLissajousGraph.
    function lissajous(ctx, w, h, scope) {
        scope = scope || {};
        const n = scope.n || 0, sl = scope.l, sr = scope.r;
        scopeBackdrop(ctx, w, h);
        if (n < 16 || !sl || !sr) { _scopePlaceholder(ctx, w, h); return; }
        let pk = 1e-8;
        for (let i = 0; i < n; i++) { const a = Math.max(Math.abs((sl[i] - 128) / 128), Math.abs((sr[i] - 128) / 128)); if (a > pk) pk = a; }
        const cx = w * 0.5, cy = h * 0.5, scale = (Math.min(w, h) * 0.42) / Math.max(pk, 1e-6);
        ctx.strokeStyle = "rgba(122,139,168,0.12)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
        ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const x = cx + ((sl[i] - 128) / 128) * scale, y = cy - ((sr[i] - 128) / 128) * scale;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(180, 120, 255, 0.85)"; ctx.lineWidth = 1.35;
        ctx.shadowColor = "rgba(140, 90, 255, 0.25)"; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(122,139,168,0.55)";
        ctx.font = `${Math.max(8, h / 36)}px "Share Tech Mono", ui-monospace, monospace`;
        ctx.textAlign = "left"; ctx.fillText("L → horizontal · R → vertical", 6, 14);
    }

    // Goniometer (45°-rotated stereo vectorscope) — ported from aeDrawGoniometerGraph.
    function goniometer(ctx, w, h, scope) {
        scope = scope || {};
        const n = scope.n || 0, sl = scope.l, sr = scope.r;
        scopeBackdrop(ctx, w, h);
        if (n < 16 || !sl || !sr) { _scopePlaceholder(ctx, w, h); return; }
        const cx = w * 0.5, cy = h * 0.5, rad = Math.min(w, h) * 0.42;
        ctx.strokeStyle = "rgba(122,139,168,0.22)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, rad * 0.5, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([3, 5]); ctx.beginPath();
        ctx.moveTo(cx - rad * 1.05, cy); ctx.lineTo(cx + rad * 1.05, cy);
        ctx.moveTo(cx, cy - rad * 1.05); ctx.lineTo(cx, cy + rad * 1.05); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(cx - rad * 0.74, cy - rad * 0.74); ctx.lineTo(cx + rad * 0.74, cy + rad * 0.74);
        ctx.moveTo(cx - rad * 0.74, cy + rad * 0.74); ctx.lineTo(cx + rad * 0.74, cy - rad * 0.74); ctx.stroke();
        const step = Math.max(1, Math.floor(n / 720));
        ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath();
        let started = false;
        for (let i = 0; i < n; i += step) {
            const x = cx + ((sl[i] - 128) / 128) * rad * 0.95, y = cy - ((sr[i] - 128) / 128) * rad * 0.95;
            if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(255, 200, 120, 0.85)"; ctx.lineWidth = 1.35;
        ctx.shadowColor = "rgba(255, 200, 120, 0.3)"; ctx.shadowBlur = 7; ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(122,139,168,0.55)";
        ctx.font = `${Math.max(8, h / 36)}px "Share Tech Mono", ui-monospace, monospace`;
        ctx.textAlign = "left"; ctx.fillText("L → R ↑", 6, 14);
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.viz = {
        hudBackdrop, neonBarGradient, fillRoundTopBar, scopeBackdrop,
        fft, oscilloscope, spectrogram, waveform, waterfall,
        lissajous, goniometer, stereoMetrics, triggerIndex,
    };
})();
