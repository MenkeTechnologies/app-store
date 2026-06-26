// zgui-core/ticker-tape.js — a horizontally scrolling price strip (symbol · last · %change), each item
// tinted up (green) / down (red); the track is duplicated for a seamless CSS loop. window.ZGui.tickerTape.
//   ZGui.tickerTape(host, { items:[{symbol,last,chg}], duration:30 }) -> { el, setItems(items) }
(function () {
  "use strict";
  function tickerTape(host, opts) {
    opts = opts || {};
    const wrap = document.createElement("div"); wrap.className = "zg-ticker";
    const track = document.createElement("div"); track.className = "zg-ticker-track";
    if (opts.duration) track.style.animationDuration = opts.duration + "s";
    wrap.appendChild(track);
    if (host) host.appendChild(wrap);
    function setItems(items) {
      track.innerHTML = "";
      const add = () => (items || []).forEach((it) => {
        const s = document.createElement("span");
        s.className = "zg-ticker-item " + (it.chg >= 0 ? "up" : "down");
        s.innerHTML = "<b>" + it.symbol + "</b> " + it.last + ' <span class="zg-ticker-chg">' + (it.chg >= 0 ? "▲" : "▼") + Math.abs(it.chg) + "%</span>";
        track.appendChild(s);
      });
      add(); add(); // duplicate set so the -50% loop is seamless
    }
    setItems(opts.items || []);
    return { el: wrap, setItems: setItems };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.tickerTape = tickerTape;
})();
