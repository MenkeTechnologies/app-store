// zgui-core/image-compare.js — a before/after image slider: two images stacked, a draggable divider
// reveals the "after" image over the "before". window.ZGui.imageCompare.
//   ZGui.imageCompare(host, { before, after, width:320, value:0.5, onChange }) -> { el, setValue(f), get() }
(function () {
  "use strict";
  function imageCompare(host, opts) {
    opts = opts || {};
    const W = opts.width || 320;
    const wrap = document.createElement("div");
    wrap.className = "zg-cmp";
    wrap.style.width = W + "px";
    const imgB = document.createElement("img");
    imgB.className = "zg-cmp-img zg-cmp-before"; imgB.draggable = false; imgB.src = opts.before || "";
    const top = document.createElement("div");
    top.className = "zg-cmp-top";
    const imgA = document.createElement("img");
    imgA.className = "zg-cmp-img zg-cmp-after"; imgA.draggable = false; imgA.src = opts.after || "";
    imgA.style.width = W + "px";                    // full wrap width; the clip lives on .zg-cmp-top
    top.appendChild(imgA);
    const handle = document.createElement("div");
    handle.className = "zg-cmp-handle";
    handle.innerHTML = '<span class="zg-cmp-grip"></span>';
    wrap.appendChild(imgB); wrap.appendChild(top); wrap.appendChild(handle);
    if (host) host.appendChild(wrap);

    let v = opts.value != null ? opts.value : 0.5;
    function place() { const pct = v * 100; top.style.width = pct + "%"; handle.style.left = pct + "%"; }
    function setValue(f) { v = Math.max(0, Math.min(1, f)); place(); if (opts.onChange) opts.onChange(v); }
    let dragging = false;
    function fromEvent(e) { const r = wrap.getBoundingClientRect(); setValue((e.clientX - r.left) / (r.width || 1)); }
    wrap.addEventListener("pointerdown", function (e) { dragging = true; try { wrap.setPointerCapture(e.pointerId); } catch (_) {} fromEvent(e); e.preventDefault(); });
    wrap.addEventListener("pointermove", function (e) { if (dragging) fromEvent(e); });
    const end = function (e) { dragging = false; try { wrap.releasePointerCapture(e.pointerId); } catch (_) {} };
    wrap.addEventListener("pointerup", end);
    wrap.addEventListener("pointercancel", end);
    place();
    return { el: wrap, setValue: setValue, get: function () { return v; } };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.imageCompare = imageCompare;
})();
