// zgui-core/gain-reduction.js — a compressor gain-reduction meter: a bar that grows DOWN from 0 dB by
// the amount of reduction, plus a scrolling history trace. Host feeds the GR amount in dB. Ballistic
// smoothing. window.ZGui.gainReduction.
//   ZGui.gainReduction(host, { maxDb:20, width, height }) -> { el, canvas, set(db) }
(function () {
  "use strict";
  function gainReduction(host, opts) {
    opts = opts || {};
    const maxDb = opts.maxDb || 20;
    const wrap = document.createElement("div"); wrap.className = "zg-gr";
    const cv = document.createElement("canvas"); cv.className = "zg-gr-canvas";
    cv.width = opts.width || 70; cv.height = opts.height || 140; wrap.appendChild(cv);
    if (host) host.appendChild(wrap);
    const ctx = cv.getContext("2d");
    let val = 0, target = 0, raf = null; const hist = [];

    function draw() {
      const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      const bw = W * 0.42;
      ctx.strokeStyle = "rgba(122,139,168,0.25)"; ctx.lineWidth = 1; ctx.font = "8px monospace"; ctx.fillStyle = "rgba(122,139,168,0.7)";
      for (let d = 0; d <= maxDb; d += 5) { const y = (d / maxDb) * H; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); if (d) ctx.fillText("-" + d, W - 16, y - 1); }
      const bh = Math.min(1, val / maxDb) * H;
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#ff2a6d"); g.addColorStop(1, "#f9f002");
      ctx.fillStyle = g; ctx.fillRect(0, 0, bw, bh);
      // history trace
      ctx.strokeStyle = "rgba(0,229,255,0.6)"; ctx.lineWidth = 1; ctx.beginPath();
      hist.forEach((v, i) => { const x = bw + 4 + i, y = Math.min(1, v / maxDb) * H; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    }
    function tick() { val += (target - val) * 0.3; hist.push(val); if (hist.length > cv.width - 30) hist.shift(); draw(); raf = Math.abs(target - val) > 0.01 ? requestAnimationFrame(tick) : null; }
    draw();
    return { el: wrap, canvas: cv, set(db) { target = Math.max(0, db); if (!raf) raf = requestAnimationFrame(tick); } };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.gainReduction = gainReduction;
})();
