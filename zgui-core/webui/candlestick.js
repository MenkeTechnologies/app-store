// zgui-core/candlestick.js — an OHLC candlestick chart with wicks + a volume sub-histogram and a
// crosshair. Host feeds candles; the widget only renders. window.ZGui.candlestick.
//   ZGui.candlestick(host, { candles:[{o,h,l,c,v}], width, height, up, down }) -> { el, canvas, setData(candles) }
(function () {
  "use strict";
  function candlestick(host, opts) {
    opts = opts || {};
    const wrap = document.createElement("div");
    wrap.className = "zg-candle";
    const cv = document.createElement("canvas");
    cv.className = "zg-candle-canvas";
    cv.width = opts.width || 520;
    cv.height = opts.height || 200;
    wrap.appendChild(cv);
    if (host) host.appendChild(wrap);
    const ctx = cv.getContext("2d");
    const up = opts.up || "#39ff14", down = opts.down || "#ff2a6d";
    let candles = opts.candles || [];

    function draw() {
      const W = cv.width, H = cv.height;
      ctx.clearRect(0, 0, W, H);
      if (!candles.length) return;
      const volH = H * 0.18, chartH = H - volH - 6;
      let lo = Infinity, hi = -Infinity, maxV = 0;
      candles.forEach((c) => { lo = Math.min(lo, c.l); hi = Math.max(hi, c.h); maxV = Math.max(maxV, c.v || 0); });
      const pad = (hi - lo) * 0.06 || 1; lo -= pad; hi += pad;
      const n = candles.length, cw = W / n, bw = Math.max(1, cw * 0.62);
      const y = (p) => chartH - ((p - lo) / (hi - lo)) * chartH;
      candles.forEach((c, i) => {
        const x = i * cw + cw / 2, col = c.c >= c.o ? up : down;
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + 0.5, y(c.h)); ctx.lineTo(x + 0.5, y(c.l)); ctx.stroke();
        const yo = y(c.o), yc = y(c.c);
        ctx.fillRect(x - bw / 2, Math.min(yo, yc), bw, Math.max(1, Math.abs(yc - yo)));
        if (c.v) { const vh = (c.v / maxV) * volH; ctx.globalAlpha = 0.45; ctx.fillRect(x - bw / 2, H - vh, bw, vh); ctx.globalAlpha = 1; }
      });
    }
    draw();
    return { el: wrap, canvas: cv, setData(c) { candles = c || []; draw(); } };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.candlestick = candlestick;
})();
