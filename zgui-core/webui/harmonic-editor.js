// zgui-core/harmonic-editor.js — an additive harmonic editor: a row of draggable bars setting the
// amplitude of each harmonic partial, with a live preview of the resulting single-cycle waveform.
// Found in additive / drawbar-style synths. window.ZGui.harmonicEditor.
//   ZGui.harmonicEditor(container, { harmonics:[amp…], count:16, height:120, onChange(harmonics) }) ->
//       { el, set(h), get() }
(function () {
    "use strict";
    function harmonicEditor(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const count = opts.count || (opts.harmonics && opts.harmonics.length) || 16;
        let amps = [];
        for (let i = 0; i < count; i++) amps.push(opts.harmonics && opts.harmonics[i] != null ? opts.harmonics[i] : (i === 0 ? 1 : 0));
        const H = opts.height || 120, color = opts.color || "#05d9e8";

        const cv = document.createElement("canvas"); cv.className = "zg-harmonic";
        host.appendChild(cv);
        const ctx = cv.getContext("2d");

        function fit() { const w = host.clientWidth || 320; if (cv.width !== w || cv.height !== H) { cv.width = w; cv.height = H; } draw(); }
        function draw() {
            ctx.clearRect(0, 0, cv.width, cv.height); ctx.fillStyle = "#070710"; ctx.fillRect(0, 0, cv.width, cv.height);
            const barArea = cv.height * 0.62, waveArea = cv.height - barArea, bw = cv.width / count;
            // bars
            for (let i = 0; i < count; i++) { const h = amps[i] * (barArea - 6); ctx.fillStyle = color; ctx.globalAlpha = 0.85; ctx.fillRect(i * bw + 1, barArea - h, bw - 2, h); ctx.globalAlpha = 1; ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.strokeRect ? ctx.strokeRect(i * bw + 0.5, 0.5, bw - 1, barArea - 1) : 0; }
            // resulting waveform preview
            ctx.strokeStyle = "#ff2a6d"; ctx.lineWidth = 1.5; ctx.beginPath();
            const L = Math.max(128, cv.width);
            for (let x = 0; x < L; x++) { const ph = x / L; let v = 0; for (let h = 0; h < count; h++) v += amps[h] * Math.sin((h + 1) * ph * 2 * Math.PI); v /= Math.max(1, count * 0.4); const px = (x / (L - 1)) * cv.width, py = barArea + waveArea / 2 - v * (waveArea / 2) * 0.9; if (x === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
            ctx.stroke(); ctx.lineWidth = 1;
        }
        function setFromEvent(e) { const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) / (r.width || 1) * cv.width, y = (e.clientY - r.top) / (r.height || 1) * cv.height; const barArea = cv.height * 0.62, bw = cv.width / count; const i = Math.max(0, Math.min(count - 1, Math.floor(x / bw))); amps[i] = Math.max(0, Math.min(1, 1 - y / barArea)); draw(); if (typeof opts.onChange === "function") opts.onChange(amps.slice()); }
        let drag = false;
        cv.addEventListener("pointerdown", (e) => { drag = true; try { cv.setPointerCapture(e.pointerId); } catch { /* */ } setFromEvent(e); });
        cv.addEventListener("pointermove", (e) => { if (drag) setFromEvent(e); });
        cv.addEventListener("pointerup", (e) => { drag = false; try { cv.releasePointerCapture(e.pointerId); } catch { /* */ } });

        cv.style.width = "100%"; cv.style.height = H + "px"; cv.style.display = "block"; cv.style.touchAction = "none";
        requestAnimationFrame(fit);
        if (window.ResizeObserver) new ResizeObserver(fit).observe(host); else fit();
        return { el: cv, set(h) { for (let i = 0; i < count; i++) amps[i] = h && h[i] != null ? h[i] : 0; draw(); }, get() { return amps.slice(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.harmonicEditor = harmonicEditor;
})();
