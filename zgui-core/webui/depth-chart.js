// zgui-core/depth-chart.js — market depth: cumulative bid (green, left) and ask (red, right) curves
// filled to the axis, meeting at mid-price. Host feeds {bids,asks} (best-first). window.ZGui.depthChart.
//   ZGui.depthChart(host, { bids:[{price,size}], asks:[{price,size}], width, height }) -> { el, canvas, setData({bids,asks}) }
(function () {
  "use strict";
  function depthChart(host, opts) {
    opts = opts || {};
    const wrap = document.createElement("div"); wrap.className = "zg-depth";
    const cv = document.createElement("canvas"); cv.className = "zg-depth-canvas";
    cv.width = opts.width || 360; cv.height = opts.height || 160; wrap.appendChild(cv);
    if (host) host.appendChild(wrap);
    const ctx = cv.getContext("2d");
    let bids = opts.bids || [], asks = opts.asks || [];

    function cum(list) { let a = 0; return list.map((l) => ({ price: l.price, depth: (a += l.size) })); }
    function draw() {
      const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      if (!bids.length || !asks.length) return;
      const b = cum(bids), a = cum(asks);
      const prices = b.concat(a).map((p) => p.price);
      const lo = Math.min.apply(null, prices), hi = Math.max.apply(null, prices);
      const maxD = Math.max(b[b.length - 1].depth, a[a.length - 1].depth) || 1;
      const x = (p) => ((p - lo) / (hi - lo || 1)) * W;
      const y = (d) => H - (d / maxD) * (H - 4);
      function curve(arr, color, fillColor) {
        ctx.beginPath();
        arr.slice().sort((p, q) => p.price - q.price).forEach((p, i) => { const px = x(p.price), py = y(p.depth); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
        ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.lineTo(x(arr[0].price > arr[arr.length - 1].price ? arr[0].price : arr[arr.length - 1].price), H);
        ctx.lineTo(x(arr[0].price > arr[arr.length - 1].price ? arr[arr.length - 1].price : arr[0].price), H);
        ctx.closePath(); ctx.fillStyle = fillColor; ctx.fill();
      }
      curve(b, "#39ff14", "rgba(57,255,20,0.12)");
      curve(a, "#ff2a6d", "rgba(255,42,109,0.12)");
    }
    draw();
    return { el: wrap, canvas: cv, setData(d) { d = d || {}; bids = d.bids || []; asks = d.asks || []; draw(); } };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.depthChart = depthChart;
})();
