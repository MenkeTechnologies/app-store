// zgui-core/liquidity-heatmap.js — a Bookmap-style liquidity heatmap: a price × time grid where each
// cell's brightness is the resting liquidity at that price/time. push() a new column to scroll left in
// real time; or setData() a full grid. Host feeds the numbers. window.ZGui.liquidityHeatmap.
//   ZGui.liquidityHeatmap(host, { rows:32, cols:120, width, height }) -> { el, canvas, push(colArray), setData(grid), clear() }
(function () {
  "use strict";
  function liquidityHeatmap(host, opts) {
    opts = opts || {};
    const rows = opts.rows || 32, cols = opts.cols || 120;
    const wrap = document.createElement("div"); wrap.className = "zg-liq";
    const cv = document.createElement("canvas"); cv.className = "zg-liq-canvas";
    cv.width = opts.width || 480; cv.height = opts.height || 200; wrap.appendChild(cv);
    if (host) host.appendChild(wrap);
    const ctx = cv.getContext("2d");
    let grid = Array.from({ length: cols }, () => new Array(rows).fill(0)); // grid[col][row]

    // dark navy -> cyan -> yellow -> white ramp (intensity 0..1)
    function color(t) {
      t = Math.max(0, Math.min(1, t));
      let r, g, b;
      if (t < 0.5) { const k = t / 0.5; r = 5 + k * 0; g = 8 + k * (217 - 8); b = 20 + k * (232 - 20); }
      else { const k = (t - 0.5) / 0.5; r = 5 + k * (255 - 5); g = 217 + k * (240 - 217); b = 232 - k * 232; }
      return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
    }
    function draw() {
      const W = cv.width, H = cv.height; const cw = W / cols, rh = H / rows;
      let max = 0; grid.forEach((c) => c.forEach((v) => { if (v > max) max = v; })); max = max || 1;
      ctx.fillStyle = "#05080d"; ctx.fillRect(0, 0, W, H);
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
        const v = grid[c][r]; if (!v) continue;
        ctx.fillStyle = color(v / max);
        ctx.fillRect(c * cw, r * rh, cw + 0.5, rh + 0.5);
      }
    }
    draw();
    return {
      el: wrap, canvas: cv,
      push(col) { grid.push((col || []).slice(0, rows)); if (grid.length > cols) grid.shift(); draw(); },
      setData(g) { grid = g || grid; draw(); },
      clear() { grid = Array.from({ length: cols }, () => new Array(rows).fill(0)); draw(); },
    };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.liquidityHeatmap = liquidityHeatmap;
})();
