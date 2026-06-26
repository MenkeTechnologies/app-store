// zgui-core/time-and-sales.js — a scrolling executed-trades tape (time · price · size), each row tinted
// by aggressor side (green = buy/at-ask, red = sell/at-bid), newest on top, capped. push() each print.
// window.ZGui.timeAndSales.
//   ZGui.timeAndSales(host, { max:14 }) -> { el, push({ price, size, side:'buy'|'sell', time? }), clear() }
(function () {
  "use strict";
  function timeAndSales(host, opts) {
    opts = opts || {};
    const cap = opts.max || 14;
    const wrap = document.createElement("div"); wrap.className = "zg-tas";
    if (host) host.appendChild(wrap);
    function push(t) {
      t = t || {};
      const r = document.createElement("div");
      r.className = "zg-tas-row zg-tas-" + (t.side === "sell" ? "sell" : "buy");
      const time = t.time != null ? t.time : new Date().toTimeString().slice(0, 8);
      r.innerHTML = '<span class="zg-tas-time">' + time + '</span><span class="zg-tas-price">' + t.price + '</span><span class="zg-tas-size">' + t.size + "</span>";
      wrap.insertBefore(r, wrap.firstChild);
      while (wrap.children.length > cap) wrap.removeChild(wrap.lastChild);
    }
    return { el: wrap, push: push, clear() { wrap.innerHTML = ""; } };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.timeAndSales = timeAndSales;
})();
