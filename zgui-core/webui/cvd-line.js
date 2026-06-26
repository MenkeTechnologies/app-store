// zgui-core/cvd-line.js — Cumulative Volume Delta: a running line of net (buy − sell) volume, segment-
// coloured green while rising and red while falling, with a zero baseline. push() a per-bar delta to
// stream it, or setData() the cumulative series. window.ZGui.cvdLine.
//   ZGui.cvdLine(host, { max:120, width, height, data:[] }) -> { el, canvas, push(delta), setData(cumArr), clear() }
(function () {
  "use strict";
  function cvdLine(host, opts) {
    opts = opts || {};
    const max = opts.max || 120;
    const wrap = document.createElement("div"); wrap.className = "zg-cvd";
    const cv = document.createElement("canvas"); cv.className = "zg-cvd-canvas";
    cv.width = opts.width || 420; cv.height = opts.height || 120; wrap.appendChild(cv);
    if (host) host.appendChild(wrap);
    const ctx = cv.getContext("2d");
    let data = (opts.data || []).slice();
    let cum = data.length ? data[data.length - 1] : 0;

    function draw() {
      const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      if (data.length < 2) return;
      let lo = Math.min.apply(null, data), hi = Math.max.apply(null, data);
      const pad = (hi - lo) * 0.1 || 1; lo -= pad; hi += pad;
      const x = (i) => (i / (data.length - 1)) * W;
      const y = (v) => H - ((v - lo) / (hi - lo)) * H;
      // zero baseline
      if (lo < 0 && hi > 0) { ctx.strokeStyle = "rgba(122,139,168,0.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y(0)); ctx.lineTo(W, y(0)); ctx.stroke(); }
      for (let i = 1; i < data.length; i++) {
        ctx.strokeStyle = data[i] >= data[i - 1] ? "#39ff14" : "#ff2a6d";
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x(i - 1), y(data[i - 1])); ctx.lineTo(x(i), y(data[i])); ctx.stroke();
      }
    }
    draw();
    return {
      el: wrap, canvas: cv,
      push(d) { cum += d; data.push(cum); if (data.length > max) data.shift(); draw(); },
      setData(a) { data = (a || []).slice(); cum = data.length ? data[data.length - 1] : 0; draw(); },
      clear() { data = []; cum = 0; draw(); },
    };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.cvdLine = cvdLine;
})();
