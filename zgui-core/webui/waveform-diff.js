// zgui-core/waveform-diff.js — overlay two waveforms (A / B) and shade only the delta between them: an
// A/B render compare for audio (mastering before/after, codec compare). window.ZGui.waveformDiff.
//   ZGui.waveformDiff(container, { a:peaks, b:peaks, height:90, labelA:'A', labelB:'B' }) ->
//       { el, set(a,b) }
//   peaks: {min,max}[] or number[]; A drawn cyan, B magenta, the difference filled.
(function () {
    "use strict";
    function norm(p) { return (p || []).map((s) => (typeof s === "object" ? s : { min: -Math.abs(s), max: Math.abs(s) })); }
    function waveformDiff(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let a = norm(opts.a), b = norm(opts.b);
        const H = opts.height || 90;
        const root = document.createElement("div"); root.className = "zg-wfdiff";
        const cv = document.createElement("canvas"); cv.className = "zg-wfdiff-cv";
        const legend = document.createElement("div"); legend.className = "zg-wfdiff-legend";
        legend.innerHTML = `<span class="zg-wfdiff-a">■ ${opts.labelA || "A"}</span><span class="zg-wfdiff-b">■ ${opts.labelB || "B"}</span><span class="zg-wfdiff-d">▨ delta</span>`;
        root.appendChild(cv); root.appendChild(legend); host.appendChild(root);
        const ctx = cv.getContext("2d");

        function fit() { const w = host.clientWidth || 360; if (cv.width !== w || cv.height !== H) { cv.width = w; cv.height = H; } draw(); }
        function lane(p, i, n, w) { const idx = Math.floor((i / w) * (n || 1)); return p[Math.min(p.length - 1, Math.max(0, idx))] || { min: 0, max: 0 }; }
        function draw() {
            const w = cv.width, h = cv.height, mid = h / 2;
            ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#06060e"; ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
            // delta band (where A and B envelopes differ)
            ctx.fillStyle = "rgba(249,240,2,0.18)";
            for (let x = 0; x < w; x++) { const sa = lane(a, x, a.length, w), sb = lane(b, x, b.length, w); const ay0 = mid - sa.max * mid, ay1 = mid - sa.min * mid, by0 = mid - sb.max * mid, by1 = mid - sb.min * mid; const top = Math.min(ay0, by0), bot = Math.max(ay1, by1), inTop = Math.max(ay0, by0), inBot = Math.min(ay1, by1); if (inTop > top) ctx.fillRect(x, top, 1, inTop - top); if (bot > inBot) ctx.fillRect(x, inBot, 1, bot - inBot); }
            // A
            ctx.strokeStyle = "rgba(5,217,232,0.85)"; ctx.beginPath(); for (let x = 0; x < w; x++) { const s = lane(a, x, a.length, w); ctx.moveTo(x + 0.5, mid - s.max * mid); ctx.lineTo(x + 0.5, mid - s.min * mid); } ctx.stroke();
            // B
            ctx.strokeStyle = "rgba(255,42,109,0.7)"; ctx.beginPath(); for (let x = 0; x < w; x++) { const s = lane(b, x, b.length, w); ctx.moveTo(x + 0.5, mid - s.max * mid); ctx.lineTo(x + 0.5, mid - s.min * mid); } ctx.stroke();
        }
        cv.style.width = "100%"; cv.style.height = H + "px"; cv.style.display = "block";
        requestAnimationFrame(fit);
        if (window.ResizeObserver) new ResizeObserver(fit).observe(host); else fit();
        return { el: root, set(na, nb) { a = norm(na); b = norm(nb); draw(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.waveformDiff = waveformDiff;
})();
