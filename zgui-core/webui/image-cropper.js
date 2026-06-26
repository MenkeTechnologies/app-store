// zgui-core/image-cropper.js — crop an image: a draggable + corner-resizable crop box over the
// image, with a dimmed surround. Outputs the crop rect (0..1 fractions) and a cropped data URL.
// window.ZGui.imageCropper.
//   ZGui.imageCropper(host, { src, width:320, aspect, onChange }) -> { el, getCrop(), toDataURL(type) }
(function () {
  "use strict";
  function imageCropper(host, opts) {
    opts = opts || {};
    const W = opts.width || 320;
    const wrap = document.createElement("div");
    wrap.className = "zg-crop"; wrap.style.width = W + "px";
    const img = document.createElement("img");
    img.className = "zg-crop-img"; img.draggable = false; img.style.width = "100%"; img.src = opts.src || "";
    const box = document.createElement("div"); box.className = "zg-crop-box";
    const handle = document.createElement("div"); handle.className = "zg-crop-handle"; box.appendChild(handle);
    wrap.appendChild(img); wrap.appendChild(box);
    if (host) host.appendChild(wrap);

    let c = { x: 0.2, y: 0.2, w: 0.6, h: 0.6 };
    function clampBox() { c.w = Math.min(c.w, 1); c.h = Math.min(c.h, 1); c.x = Math.max(0, Math.min(c.x, 1 - c.w)); c.y = Math.max(0, Math.min(c.y, 1 - c.h)); }
    function place() { box.style.left = (c.x * 100) + "%"; box.style.top = (c.y * 100) + "%"; box.style.width = (c.w * 100) + "%"; box.style.height = (c.h * 100) + "%"; }
    function emit() { if (opts.onChange) opts.onChange({ x: c.x, y: c.y, w: c.w, h: c.h }); }
    function frac(e) { const r = wrap.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; }

    let mode = null, start = null, startC = null;
    function move(e) {
      if (!mode) return;
      const p = frac(e), dx = p.x - start.x, dy = p.y - start.y;
      if (mode === "move") { c.x = startC.x + dx; c.y = startC.y + dy; }
      else { c.w = Math.max(0.05, startC.w + dx); c.h = opts.aspect ? c.w / opts.aspect : Math.max(0.05, startC.h + dy); }
      clampBox(); place(); emit();
    }
    function up() { mode = null; document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); }
    function down(m) { return function (e) { mode = m; start = frac(e); startC = Object.assign({}, c); document.addEventListener("pointermove", move); document.addEventListener("pointerup", up); e.preventDefault(); e.stopPropagation(); }; }
    box.addEventListener("pointerdown", function (e) { if (e.target === handle) return; down("move")(e); });
    handle.addEventListener("pointerdown", down("resize"));
    place();

    return {
      el: wrap,
      getCrop: function () { return Object.assign({}, c); },
      toDataURL: function (type) {
        const cv = document.createElement("canvas");
        const iw = img.naturalWidth || img.width || W, ih = img.naturalHeight || img.height || W;
        cv.width = Math.max(1, Math.round(c.w * iw)); cv.height = Math.max(1, Math.round(c.h * ih));
        cv.getContext("2d").drawImage(img, c.x * iw, c.y * ih, c.w * iw, c.h * ih, 0, 0, cv.width, cv.height);
        return cv.toDataURL(type || "image/png");
      },
    };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.imageCropper = imageCropper;
})();
