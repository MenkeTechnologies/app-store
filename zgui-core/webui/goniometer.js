// zgui-core/goniometer.js — a stereo vectorscope / goniometer: plots left-vs-right sample pairs rotated
// 45° (mid up, side across) as a glowing Lissajous trace with phosphor-style fade. Shows stereo width,
// mono compatibility and phase. Feed it sample frames via push(). window.ZGui.goniometer.
//   ZGui.goniometer(container, { size:180, color:'#39ff14', fade:0.18 }) ->
//       { el, push(leftArray, rightArray), clear() }
(function () {
    "use strict";
    const SQRT1_2 = Math.SQRT1_2;
    function goniometer(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const size = opts.size || 180, color = opts.color || "#39ff14", fade = opts.fade == null ? 0.18 : opts.fade;

        const cv = document.createElement("canvas"); cv.className = "zg-goniometer"; cv.width = size; cv.height = size;
        cv.style.width = size + "px"; cv.style.height = size + "px";
        host.appendChild(cv);
        const ctx = cv.getContext("2d");
        function bg() { ctx.fillStyle = "#05050a"; ctx.fillRect(0, 0, size, size); grid(); }
        function grid() {
            ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(size / 2, 4); ctx.lineTo(size / 2, size - 4); ctx.moveTo(4, size / 2); ctx.lineTo(size - 4, size / 2); ctx.stroke();
            ctx.save(); ctx.translate(size / 2, size / 2); ctx.rotate(Math.PI / 4); ctx.strokeStyle = "rgba(255,255,255,0.05)";
            ctx.beginPath(); ctx.moveTo(-size / 2, 0); ctx.lineTo(size / 2, 0); ctx.moveTo(0, -size / 2); ctx.lineTo(0, size / 2); ctx.stroke(); ctx.restore();
        }
        bg();

        function push(left, right) {
            // phosphor fade: dim what's there, then plot the new trace
            ctx.fillStyle = "rgba(5,5,10," + fade + ")"; ctx.fillRect(0, 0, size, size);
            grid();
            const n = Math.min(left.length, right.length), r = size / 2 - 4;
            ctx.strokeStyle = color; ctx.globalAlpha = 0.85; ctx.lineWidth = 1; ctx.beginPath();
            for (let i = 0; i < n; i++) {
                const l = left[i], rr = right[i];
                // rotate 45°: x = (L - R)/√2 (side), y = (L + R)/√2 (mid, up)
                const x = size / 2 + (l - rr) * SQRT1_2 * r;
                const y = size / 2 - (l + rr) * SQRT1_2 * r;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke(); ctx.globalAlpha = 1;
        }
        return { el: cv, push, clear() { bg(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.goniometer = goniometer;
})();
