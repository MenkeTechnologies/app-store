// zgui-core/image.js — an image with a broken-image fallback and a click-to-preview lightbox: a
// full-screen overlay with a zoom / rotate / flip / reset / close toolbar (and prev/next for a group).
// Ported behavior from Ant Design's <Image> (src/fallback/placeholder/preview + the transform toolbar:
// x,y,rotate,scale,flipX,flipY). window.ZGui.image.
//   ZGui.image({ src, alt, width, height, fallback, preview:true }) -> { el, img, openPreview() }
//   ZGui.image.preview(src | [src,…], startIndex)   // open the lightbox directly
(function () {
    "use strict";
    function image(opts) {
        opts = opts || {};
        const wrap = document.createElement("div"); wrap.className = "zg-image";
        if (opts.width) wrap.style.width = typeof opts.width === "number" ? opts.width + "px" : opts.width;
        const img = document.createElement("img"); img.className = "zg-image-img"; img.alt = opts.alt || "";
        if (opts.height) img.style.height = typeof opts.height === "number" ? opts.height + "px" : opts.height;
        img.src = opts.src || "";
        img.addEventListener("error", () => { if (opts.fallback && img.src !== opts.fallback) img.src = opts.fallback; else wrap.classList.add("is-broken"); });
        wrap.appendChild(img);
        if (opts.preview !== false) {
            const mask = document.createElement("div"); mask.className = "zg-image-mask"; mask.innerHTML = "<span>🔍 Preview</span>";
            wrap.appendChild(mask);
            wrap.addEventListener("click", () => preview(opts.src));
        }
        return { el: wrap, img, openPreview: () => preview(opts.src) };
    }

    function preview(srcOrList, startIndex) {
        const list = Array.isArray(srcOrList) ? srcOrList : [srcOrList];
        let i = startIndex || 0;
        const t = { scale: 1, rotate: 0, flipX: 1, flipY: 1 };
        const ov = document.createElement("div"); ov.className = "zg-imgview";
        ov.innerHTML =
            '<img class="zg-imgview-img" alt="">'
            + '<div class="zg-imgview-bar">'
            + '<button data-op="zoomout" title="Zoom out">－</button><button data-op="zoomin" title="Zoom in">＋</button>'
            + '<button data-op="rotl" title="Rotate left">⟲</button><button data-op="rotr" title="Rotate right">⟳</button>'
            + '<button data-op="flipx" title="Flip horizontal">⇆</button><button data-op="flipy" title="Flip vertical">⇅</button>'
            + '<button data-op="reset" title="Reset">↺</button><button data-op="close" title="Close">✕</button></div>'
            + (list.length > 1 ? '<button class="zg-imgview-nav prev" data-op="prev">‹</button><button class="zg-imgview-nav next" data-op="next">›</button>' : "");
        const imgEl = ov.querySelector(".zg-imgview-img");
        function apply() { imgEl.style.transform = `scale(${t.scale * t.flipX}, ${t.scale * t.flipY}) rotate(${t.rotate}deg)`; }
        function reset() { t.scale = 1; t.rotate = 0; t.flipX = 1; t.flipY = 1; apply(); }
        function load() { imgEl.src = list[i]; reset(); }
        function close() { ov.remove(); document.removeEventListener("keydown", onKey, true); }
        function onKey(e) { if (e.key === "Escape") close(); else if (e.key === "ArrowLeft" && list.length > 1) { i = (i - 1 + list.length) % list.length; load(); } else if (e.key === "ArrowRight" && list.length > 1) { i = (i + 1) % list.length; load(); } }
        ov.addEventListener("click", (e) => {
            const b = e.target.closest("[data-op]");
            if (!b) { if (e.target === ov) close(); return; }
            e.stopPropagation();
            const op = b.dataset.op;
            if (op === "zoomin") t.scale = Math.min(8, t.scale + 0.5);
            else if (op === "zoomout") t.scale = Math.max(0.2, t.scale - 0.5);
            else if (op === "rotl") t.rotate -= 90;
            else if (op === "rotr") t.rotate += 90;
            else if (op === "flipx") t.flipX *= -1;
            else if (op === "flipy") t.flipY *= -1;
            else if (op === "reset") return reset();
            else if (op === "close") return close();
            else if (op === "prev") { i = (i - 1 + list.length) % list.length; return load(); }
            else if (op === "next") { i = (i + 1) % list.length; return load(); }
            apply();
        });
        document.body.appendChild(ov);
        document.addEventListener("keydown", onKey, true);
        load();
        return { close };
    }
    image.preview = preview;
    window.ZGui = window.ZGui || {};
    window.ZGui.image = image;
})();
