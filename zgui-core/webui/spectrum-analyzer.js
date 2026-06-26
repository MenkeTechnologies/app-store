// zgui-core/spectrum-analyzer.js — a real-time FFT spectrum: frequency-bin bars (cyan→magenta gradient)
// with decaying peak-hold caps. Host pushes normalized magnitudes (0..1, low→high freq); the widget
// only renders. window.ZGui.spectrumAnalyzer.
//   ZGui.spectrumAnalyzer(host, { width, height, peakHold:true }) -> { el, canvas, push(mags) }
(function () {
  "use strict";
  function spectrumAnalyzer(host, opts) {
    opts = opts || {};
    const peaksOn = opts.peakHold !== false;
    const wrap = document.createElement("div"); wrap.className = "zg-spec";
    const cv = document.createElement("canvas"); cv.className = "zg-spec-canvas";
    cv.width = opts.width || 360; cv.height = opts.height || 140; wrap.appendChild(cv);
    if (host) host.appendChild(wrap);
    const ctx = cv.getContext("2d");
    let mags = [], peaks = [];

    function draw() {
      const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      const n = mags.length; if (!n) return;
      const bw = W / n;
      for (let i = 0; i < n; i++) {
        const m = Math.max(0, Math.min(1, mags[i])), bh = m * H;
        const g = ctx.createLinearGradient(0, H, 0, H - bh);
        g.addColorStop(0, "#05d9e8"); g.addColorStop(1, "#ff2a6d");
        ctx.fillStyle = g; ctx.fillRect(i * bw, H - bh, Math.max(1, bw - 1), bh);
        if (peaksOn) { const py = H - (peaks[i] || 0) * H; ctx.fillStyle = "#f9f002"; ctx.fillRect(i * bw, py, Math.max(1, bw - 1), 2); }
      }
    }
    draw();
    return {
      el: wrap, canvas: cv,
      push(m) { mags = m || []; if (peaksOn) for (let i = 0; i < mags.length; i++) peaks[i] = Math.max((peaks[i] || 0) - 0.02, mags[i] || 0); draw(); },
    };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.spectrumAnalyzer = spectrumAnalyzer;
})();
