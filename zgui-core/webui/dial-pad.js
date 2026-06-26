// zgui-core/dial-pad.js — a phone/numeric keypad: 1–9, *, 0, # with letter sublabels, a display,
// backspace, and a dial action. window.ZGui.dialPad.
//   ZGui.dialPad(host, { display:true, onKey, onDial }) -> { el, value(), clear() }
(function () {
  "use strict";
  const KEYS = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"], ["*", ""], ["0", "+"], ["#", ""]];
  function dialPad(host, opts) {
    opts = opts || {};
    const wrap = document.createElement("div");
    wrap.className = "zg-dpad";
    let display = null, val = "";
    if (opts.display !== false) {
      display = document.createElement("div");
      display.className = "zg-dpad-display";
      wrap.appendChild(display);
    }
    const grid = document.createElement("div");
    grid.className = "zg-dpad-grid";
    wrap.appendChild(grid);
    KEYS.forEach(function (k) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "zg-dpad-key";
      b.innerHTML = '<span class="zg-dpad-num">' + k[0] + "</span>" + (k[1] ? '<span class="zg-dpad-sub">' + k[1] + "</span>" : "");
      b.addEventListener("click", function () { val += k[0]; if (display) display.textContent = val; if (opts.onKey) opts.onKey(k[0]); });
      grid.appendChild(b);
    });
    const bar = document.createElement("div");
    bar.className = "zg-dpad-bar";
    const back = document.createElement("button");
    back.type = "button"; back.className = "zg-dpad-back"; back.textContent = "⌫";
    back.addEventListener("click", function () { val = val.slice(0, -1); if (display) display.textContent = val; });
    const dial = document.createElement("button");
    dial.type = "button"; dial.className = "zg-dpad-dial"; dial.textContent = "Dial";
    dial.addEventListener("click", function () { if (opts.onDial) opts.onDial(val); });
    bar.appendChild(back); bar.appendChild(dial);
    wrap.appendChild(bar);
    if (host) host.appendChild(wrap);
    return { el: wrap, value: function () { return val; }, clear: function () { val = ""; if (display) display.textContent = ""; } };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.dialPad = dialPad;
})();
