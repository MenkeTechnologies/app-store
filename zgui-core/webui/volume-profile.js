// zgui-core/volume-profile.js — a volume-by-price histogram (horizontal bars per price bin) with the
// Point of Control (highest-volume price) highlighted and an optional value-area band. Host feeds the
// bins. window.ZGui.volumeProfile.
//   ZGui.volumeProfile(host, { bins:[{price,volume,buy?,sell?}], width, height, valueArea:0.7 }) -> { el, canvas, setData(bins) }
(function () {
  "use strict";
  function volumeProfile(host, opts) {
    opts = opts || {};
    const wrap = document.createElement("div"); wrap.className = "zg-vprof";
    const cv = document.createElement("canvas"); cv.className = "zg-vprof-canvas";
    cv.width = opts.width || 200; cv.height = opts.height || 200; wrap.appendChild(cv);
    if (host) host.appendChild(wrap);
    const ctx = cv.getContext("2d");
    const vaPct = opts.valueArea || 0.7;
    let bins = opts.bins || [];

    function draw() {
      const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      if (!bins.length) return;
      const maxV = Math.max.apply(null, bins.map((b) => b.volume)) || 1;
      const total = bins.reduce((a, b) => a + b.volume, 0) || 1;
      const poc = bins.reduce((m, b) => (b.volume > m.volume ? b : m), bins[0]);
      // value area: expand from POC until vaPct of volume covered
      const sorted = bins.slice().sort((a, b) => b.volume - a.volume);
      let acc = 0; const va = new Set();
      for (const b of sorted) { va.add(b); acc += b.volume; if (acc / total >= vaPct) break; }
      const bh = H / bins.length;
      bins.forEach((b, i) => {
        const w = (b.volume / maxV) * W, y = i * bh;
        const inVa = va.has(b), isPoc = b === poc;
        ctx.fillStyle = isPoc ? "#f9f002" : inVa ? "rgba(0,229,255,0.55)" : "rgba(0,229,255,0.22)";
        ctx.fillRect(0, y + 0.5, w, Math.max(1, bh - 1));
      });
    }
    draw();
    return { el: wrap, canvas: cv, setData(b) { bins = b || []; draw(); } };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.volumeProfile = volumeProfile;
})();
