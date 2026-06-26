// zgui-core/correlation-meter.js — a stereo phase-correlation meter: a −1…+1 scale (red→yellow→green)
// with a smoothed marker and a numeric readout. +1 = mono-compatible, 0 = wide, −1 = out of phase.
// Host feeds the measured correlation. window.ZGui.correlationMeter.
//   ZGui.correlationMeter(host, { width, height }) -> { el, canvas, set(value) }
(function () {
  "use strict";
  function correlationMeter(host, opts) {
    opts = opts || {};
    const wrap = document.createElement("div"); wrap.className = "zg-corr";
    const cv = document.createElement("canvas"); cv.className = "zg-corr-canvas";
    cv.width = opts.width || 240; cv.height = opts.height || 44; wrap.appendChild(cv);
    if (host) host.appendChild(wrap);
    const ctx = cv.getContext("2d");
    let val = 0, target = 0, raf = null;

    function draw() {
      const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, "#ff2a6d"); g.addColorStop(0.5, "#f9f002"); g.addColorStop(1, "#39ff14");
      ctx.fillStyle = g; ctx.fillRect(0, H - 12, W, 7);
      const x = ((val + 1) / 2) * W;
      ctx.fillStyle = "#fff"; ctx.fillRect(x - 1, H - 17, 2, 17);
      ctx.fillStyle = "rgba(122,139,168,0.8)"; ctx.font = "9px monospace";
      ctx.fillText("-1", 2, 11); ctx.fillText("0", W / 2 - 3, 11); ctx.fillText("+1", W - 14, 11);
      ctx.fillStyle = "#05d9e8"; ctx.font = "12px 'Share Tech Mono',monospace";
      ctx.fillText(val.toFixed(2), W / 2 - 13, 26);
    }
    function tick() { val += (target - val) * 0.2; draw(); raf = Math.abs(target - val) > 0.001 ? requestAnimationFrame(tick) : null; }
    draw();
    return { el: wrap, canvas: cv, set(v) { target = Math.max(-1, Math.min(1, v)); if (!raf) raf = requestAnimationFrame(tick); } };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.correlationMeter = correlationMeter;
})();
