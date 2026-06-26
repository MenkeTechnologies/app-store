// zgui-core/order-book.js — a Level-2 order book: asks stacked above the spread, bids below, each
// row a price/size with a cumulative-depth bar behind it. Host feeds {bids,asks} (best-first).
// window.ZGui.orderBook.
//   ZGui.orderBook(host, { bids:[{price,size}], asks:[{price,size}], rows:10 }) -> { el, setData({bids,asks}) }
(function () {
  "use strict";
  function orderBook(host, opts) {
    opts = opts || {};
    const cap = opts.rows || 10;
    const wrap = document.createElement("div");
    wrap.className = "zg-ob";
    const asksEl = document.createElement("div"); asksEl.className = "zg-ob-side zg-ob-asks";
    const spreadEl = document.createElement("div"); spreadEl.className = "zg-ob-spread";
    const bidsEl = document.createElement("div"); bidsEl.className = "zg-ob-side zg-ob-bids";
    wrap.appendChild(asksEl); wrap.appendChild(spreadEl); wrap.appendChild(bidsEl);
    if (host) host.appendChild(wrap);

    function side(container, list, kind) {
      container.innerHTML = "";
      const arr = (list || []).slice(0, cap);
      let acc = 0; const depth = arr.map((l) => (acc += l.size));
      const total = depth[depth.length - 1] || 1;
      // asks render high→low (best ask nearest the spread, at the bottom)
      const idx = kind === "ask" ? arr.map((_, i) => i).reverse() : arr.map((_, i) => i);
      idx.forEach((i) => {
        const l = arr[i], r = document.createElement("div");
        r.className = "zg-ob-row zg-ob-" + kind;
        const w = (depth[i] / total) * 100;
        r.innerHTML = '<span class="zg-ob-bar" style="width:' + w.toFixed(1) + '%"></span>' +
          '<span class="zg-ob-price">' + l.price + '</span><span class="zg-ob-size">' + l.size + "</span>";
        container.appendChild(r);
      });
    }
    function setData(d) {
      d = d || {};
      side(asksEl, d.asks, "ask"); side(bidsEl, d.bids, "bid");
      const bb = d.bids && d.bids[0] ? d.bids[0].price : null, ba = d.asks && d.asks[0] ? d.asks[0].price : null;
      spreadEl.textContent = bb != null && ba != null ? "spread " + (ba - bb).toFixed(2) : "";
    }
    setData({ bids: opts.bids, asks: opts.asks });
    return { el: wrap, setData: setData };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.orderBook = orderBook;
})();
