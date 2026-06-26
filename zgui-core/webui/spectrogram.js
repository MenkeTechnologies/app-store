// zgui-core/spectrogram.js — a scrolling spectrogram: frequency (vertical) over time (horizontal),
// each column a slice of FFT magnitudes coloured by intensity (a classic black→purple→cyan→yellow→white
// ramp). push() a magnitude column to scroll it left in real time. window.ZGui.spectrogram.
//   ZGui.spectrogram(host, { bins:96, cols:240, width, height }) -> { el, canvas, push(mags), clear() }
(function () {
  "use strict";
  function spectrogram(host, opts) {
    opts = opts || {};
    const bins = opts.bins || 96, cols = opts.cols || 240;
    const wrap = document.createElement("div"); wrap.className = "zg-sgram";
    const cv = document.createElement("canvas"); cv.className = "zg-sgram-canvas";
    cv.width = opts.width || 420; cv.height = opts.height || 180; wrap.appendChild(cv);
    if (host) host.appendChild(wrap);
    const ctx = cv.getContext("2d");
    let grid = []; // array of columns (each: magnitudes low→high)

    function color(t) {
      t = Math.max(0, Math.min(1, t));
      const stops = [[5, 5, 16], [60, 10, 90], [5, 217, 232], [249, 240, 2], [255, 255, 255]];
      const f = t * (stops.length - 1), i = Math.floor(f), k = f - i;
      const a = stops[i], b = stops[Math.min(i + 1, stops.length - 1)];
      return "rgb(" + ((a[0] + (b[0] - a[0]) * k) | 0) + "," + ((a[1] + (b[1] - a[1]) * k) | 0) + "," + ((a[2] + (b[2] - a[2]) * k) | 0) + ")";
    }
    function draw() {
      const W = cv.width, H = cv.height, cw = W / cols, rh = H / bins;
      ctx.fillStyle = "#05050a"; ctx.fillRect(0, 0, W, H);
      const start = cols - grid.length;
      grid.forEach((colMags, ci) => {
        for (let r = 0; r < bins; r++) {
          const v = colMags[r] || 0; if (v <= 0.01) continue;
          ctx.fillStyle = color(v);
          ctx.fillRect((start + ci) * cw, H - (r + 1) * rh, cw + 0.5, rh + 0.5); // low freq at bottom
        }
      });
    }
    draw();
    return {
      el: wrap, canvas: cv,
      push(mags) { grid.push((mags || []).slice(0, bins)); if (grid.length > cols) grid.shift(); draw(); },
      clear() { grid = []; draw(); },
    };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.spectrogram = spectrogram;
})();
