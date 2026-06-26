// zgui-core/dom-ladder.js — a Depth-of-Market price ladder: one row per price level with bid size on
// the left, the price in the middle, ask size on the right, each backed by a size bar; the last-traded
// price is highlighted. Host feeds the levels. window.ZGui.domLadder.
//   ZGui.domLadder(host, { levels:[{price,bid,ask}], last }) -> { el, setData({levels,last}) }
(function () {
  "use strict";
  function domLadder(host, opts) {
    opts = opts || {};
    const wrap = document.createElement("div"); wrap.className = "zg-dom";
    if (host) host.appendChild(wrap);
    function setData(d) {
      d = d || {}; const levels = d.levels || [], last = d.last;
      const maxB = Math.max.apply(null, levels.map((l) => l.bid || 0)) || 1;
      const maxA = Math.max.apply(null, levels.map((l) => l.ask || 0)) || 1;
      wrap.innerHTML = "";
      levels.forEach((l) => {
        const r = document.createElement("div");
        r.className = "zg-dom-row" + (l.price === last ? " zg-dom-last" : "");
        const bw = l.bid ? (l.bid / maxB) * 100 : 0, aw = l.ask ? (l.ask / maxA) * 100 : 0;
        r.innerHTML =
          '<span class="zg-dom-cell zg-dom-bid"><span class="zg-dom-bar" style="width:' + bw.toFixed(0) + '%"></span><span class="zg-dom-v">' + (l.bid || "") + "</span></span>" +
          '<span class="zg-dom-price">' + l.price + "</span>" +
          '<span class="zg-dom-cell zg-dom-ask"><span class="zg-dom-bar" style="width:' + aw.toFixed(0) + '%"></span><span class="zg-dom-v">' + (l.ask || "") + "</span></span>";
        wrap.appendChild(r);
      });
    }
    setData({ levels: opts.levels, last: opts.last });
    return { el: wrap, setData: setData };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.domLadder = domLadder;
})();
