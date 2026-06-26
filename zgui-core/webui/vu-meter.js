// zgui-core/vu-meter.js — an analog VU meter: a needle swinging over an arc scale with a red zone past
// 0 VU and proper ballistic smoothing (vs the digital peakMeter's bars). Host feeds the level in dB.
// window.ZGui.vuMeter.
//   ZGui.vuMeter(host, { min:-20, max:3, width, height, label:'VU' }) -> { el, canvas, set(db) }
(function () {
  "use strict";
  function vuMeter(host, opts) {
    opts = opts || {};
    const min = opts.min != null ? opts.min : -20, max = opts.max != null ? opts.max : 3, label = opts.label || "VU";
    const wrap = document.createElement("div"); wrap.className = "zg-vu";
    const cv = document.createElement("canvas"); cv.className = "zg-vu-canvas";
    cv.width = opts.width || 170; cv.height = opts.height || 110; wrap.appendChild(cv);
    if (host) host.appendChild(wrap);
    const ctx = cv.getContext("2d");
    let val = min, target = min, raf = null;
    const a0 = -Math.PI * 0.78, a1 = -Math.PI * 0.22;
    const ang = (db) => a0 + (a1 - a0) * ((db - min) / (max - min));

    function draw() {
      const W = cv.width, H = cv.height, cx = W / 2, cy = H * 0.94, R = H * 0.82;
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 2; ctx.strokeStyle = "rgba(122,139,168,0.55)";
      ctx.beginPath(); ctx.arc(cx, cy, R, a0, ang(0)); ctx.stroke();
      ctx.strokeStyle = "#ff2a6d"; ctx.beginPath(); ctx.arc(cx, cy, R, ang(0), a1); ctx.stroke();
      // ticks
      ctx.strokeStyle = "rgba(122,139,168,0.7)"; ctx.lineWidth = 1;
      for (let db = min; db <= max; db += (max - min) / 5) { const a = ang(db); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.lineTo(cx + Math.cos(a) * (R - 6), cy + Math.sin(a) * (R - 6)); ctx.stroke(); }
      // needle
      const a = ang(val);
      ctx.strokeStyle = "#05d9e8"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * 0.94, cy + Math.sin(a) * R * 0.94); ctx.stroke();
      ctx.fillStyle = "#05d9e8"; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(122,139,168,0.7)"; ctx.font = "9px 'Orbitron',sans-serif"; ctx.fillText(label, cx - 7, cy - R * 0.45);
    }
    function tick() { val += (target - val) * 0.15; draw(); raf = Math.abs(target - val) > 0.02 ? requestAnimationFrame(tick) : null; }
    draw();
    return { el: wrap, canvas: cv, set(db) { target = Math.max(min, Math.min(max, db)); if (!raf) raf = requestAnimationFrame(tick); } };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.vuMeter = vuMeter;
})();
