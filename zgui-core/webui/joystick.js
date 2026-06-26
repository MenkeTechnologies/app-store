// zgui-core/joystick.js — an analog joystick: drag the knob within a circular base; emits {x,y} in
// −1..1 (y down-positive), recentering on release unless `sticky`. window.ZGui.joystick.
//   ZGui.joystick(host, { size:120, sticky:false, onChange }) -> { el, get(), set(x,y), center() }
(function () {
  "use strict";
  const clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  function joystick(host, opts) {
    opts = opts || {};
    const size = opts.size || 120, R = size / 2, knobR = size * 0.18;
    const base = document.createElement("div");
    base.className = "zg-joy";
    base.style.width = base.style.height = size + "px";
    const knob = document.createElement("div");
    knob.className = "zg-joy-knob";
    knob.style.width = knob.style.height = (knobR * 2) + "px";
    base.appendChild(knob);
    if (host) host.appendChild(base);

    let x = 0, y = 0, dragging = false;
    function place() {
      knob.style.left = (R + x * (R - knobR) - knobR) + "px";
      knob.style.top = (R + y * (R - knobR) - knobR) + "px";
    }
    function emit() { if (opts.onChange) opts.onChange({ x: x, y: y }); }
    function fromEvent(e) {
      const r = base.getBoundingClientRect();
      let dx = (e.clientX - r.left - R) / (R - knobR);
      let dy = (e.clientY - r.top - R) / (R - knobR);
      const m = Math.hypot(dx, dy);
      if (m > 1) { dx /= m; dy /= m; }
      x = clamp(dx, -1, 1); y = clamp(dy, -1, 1);
      place(); emit();
    }
    base.addEventListener("pointerdown", function (e) { dragging = true; try { base.setPointerCapture(e.pointerId); } catch (_) {} fromEvent(e); e.preventDefault(); });
    base.addEventListener("pointermove", function (e) { if (dragging) fromEvent(e); });
    const end = function (e) {
      if (!dragging) return;
      dragging = false;
      try { base.releasePointerCapture(e.pointerId); } catch (_) {}
      if (!opts.sticky) { x = 0; y = 0; place(); emit(); }
    };
    base.addEventListener("pointerup", end);
    base.addEventListener("pointercancel", end);
    place();

    return {
      el: base,
      get: function () { return { x: x, y: y }; },
      set: function (nx, ny) { x = clamp(nx, -1, 1); y = clamp(ny, -1, 1); place(); emit(); },
      center: function () { x = 0; y = 0; place(); emit(); },
    };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.joystick = joystick;
})();
