// zgui-core/footprint.js — an order-flow footprint chart: each candle is a column of price cells, and
// each cell is shaded by traded volume and tinted by bid/ask imbalance (green = buy-dominant, red =
// sell-dominant). Host feeds candles as aligned price rows. window.ZGui.footprint.
//   ZGui.footprint(host, { candles:[{ rows:[{price,bid,ask}] }], width, height }) -> { el, canvas, setData(candles) }
(function () {
  "use strict";
  function footprint(host, opts) {
    opts = opts || {};
    const wrap = document.createElement("div"); wrap.className = "zg-fp";
    const cv = document.createElement("canvas"); cv.className = "zg-fp-canvas";
    cv.width = opts.width || 420; cv.height = opts.height || 200; wrap.appendChild(cv);
    if (host) host.appendChild(wrap);
    const ctx = cv.getContext("2d");
    let candles = opts.candles || [];

    function draw() {
      const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      if (!candles.length) return;
      // shared price axis from the union of all rows
      let lo = Infinity, hi = -Infinity, maxVol = 0;
      candles.forEach((c) => c.rows.forEach((r) => { lo = Math.min(lo, r.price); hi = Math.max(hi, r.price); maxVol = Math.max(maxVol, (r.bid || 0) + (r.ask || 0)); }));
      const prices = []; for (let p = hi; p >= lo; p--) prices.push(p);
      const nC = candles.length, cw = W / nC, rh = H / prices.length;
      candles.forEach((c, ci) => {
        const map = {}; c.rows.forEach((r) => { map[r.price] = r; });
        prices.forEach((p, ri) => {
          const r = map[p]; if (!r) return;
          const vol = (r.bid || 0) + (r.ask || 0), inten = Math.min(1, vol / (maxVol || 1));
          const buyDom = (r.bid || 0) >= (r.ask || 0);
          ctx.fillStyle = (buyDom ? "rgba(57,255,20," : "rgba(255,42,109,") + (0.12 + inten * 0.7) + ")";
          ctx.fillRect(ci * cw + 1, ri * rh + 0.5, cw - 2, Math.max(1, rh - 1));
        });
      });
    }
    draw();
    return { el: wrap, canvas: cv, setData(c) { candles = c || []; draw(); } };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.footprint = footprint;
})();
