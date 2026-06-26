// zgui-core/lufs-meter.js — an EBU R128 loudness meter: a vertical momentary-LUFS bar with a target
// line, plus momentary / short / integrated numeric readouts. Host feeds the measured values (it owns
// the EBU R128 measurement). window.ZGui.lufsMeter.
//   ZGui.lufsMeter(host, { target:-14, floor:-36 }) -> { el, set({ m, s, i }) }
(function () {
  "use strict";
  function lufsMeter(host, opts) {
    opts = opts || {};
    const target = opts.target != null ? opts.target : -14, floor = opts.floor != null ? opts.floor : -36;
    const wrap = document.createElement("div"); wrap.className = "zg-lufs";
    const bar = document.createElement("div"); bar.className = "zg-lufs-bar";
    const fill = document.createElement("div"); fill.className = "zg-lufs-fill"; bar.appendChild(fill);
    const tgt = document.createElement("div"); tgt.className = "zg-lufs-target"; bar.appendChild(tgt);
    const nums = document.createElement("div"); nums.className = "zg-lufs-nums";
    nums.innerHTML = '<span>M<b class="zg-lufs-m">—</b></span><span>S<b class="zg-lufs-s">—</b></span><span>I<b class="zg-lufs-i">—</b></span>';
    wrap.appendChild(bar); wrap.appendChild(nums);
    if (host) host.appendChild(wrap);
    const mEl = nums.querySelector(".zg-lufs-m"), sEl = nums.querySelector(".zg-lufs-s"), iEl = nums.querySelector(".zg-lufs-i");
    const pct = (v) => Math.max(0, Math.min(100, ((v - floor) / (0 - floor)) * 100));
    tgt.style.bottom = pct(target) + "%";
    function set(d) {
      d = d || {};
      if (d.m != null) { fill.style.height = pct(d.m) + "%"; mEl.textContent = d.m.toFixed(1); fill.style.background = d.m > target + 1 ? "var(--red,#ff2a6d)" : "#39ff14"; }
      if (d.s != null) sEl.textContent = d.s.toFixed(1);
      if (d.i != null) iEl.textContent = d.i.toFixed(1);
    }
    return { el: wrap, set: set };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.lufsMeter = lufsMeter;
})();
