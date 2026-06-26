// zgui-core/signature-pad.js — a canvas signature pad: draw with the pointer, clear, export to a
// data URL. Pointer-based so it works with mouse, pen, and touch. window.ZGui.signaturePad.
//   ZGui.signaturePad(host, { width:360, height:140, color, onChange }) -> { el, canvas, clear(), isEmpty(), toDataURL(type) }
(function () {
  "use strict";
  function signaturePad(host, opts) {
    opts = opts || {};
    const wrap = document.createElement("div");
    wrap.className = "zg-sig";
    const canvas = document.createElement("canvas");
    canvas.className = "zg-sig-canvas";
    canvas.width = opts.width || 360;
    canvas.height = opts.height || 140;
    wrap.appendChild(canvas);
    const bar = document.createElement("div");
    bar.className = "zg-sig-bar";
    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "zg-sig-clear";
    clearBtn.textContent = "Clear";
    bar.appendChild(clearBtn);
    wrap.appendChild(bar);
    if (host) host.appendChild(wrap);

    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    let stroke = opts.color;
    if (!stroke) {
      stroke = (getComputedStyle(canvas).getPropertyValue("--cyan") || "").trim() || "#05d9e8";
    }
    ctx.strokeStyle = stroke;

    let drawing = false, last = null, empty = true;
    function pos(e) {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
    }
    canvas.addEventListener("pointerdown", function (e) { drawing = true; last = pos(e); try { canvas.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); });
    canvas.addEventListener("pointermove", function (e) {
      if (!drawing) return;
      const p = pos(e);
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p; empty = false;
      if (opts.onChange) opts.onChange();
    });
    const end = function (e) { if (!drawing) return; drawing = false; try { canvas.releasePointerCapture(e.pointerId); } catch (_) {} };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);

    function clear() { ctx.clearRect(0, 0, canvas.width, canvas.height); empty = true; if (opts.onChange) opts.onChange(); }
    clearBtn.addEventListener("click", clear);

    return { el: wrap, canvas: canvas, clear: clear, isEmpty: function () { return empty; }, toDataURL: function (t) { return canvas.toDataURL(t || "image/png"); } };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.signaturePad = signaturePad;
})();
