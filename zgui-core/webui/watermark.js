// zgui-core/watermark.js — a tiled, rotated text/image watermark overlay laid over a container. Draws
// one rotated tile to an offscreen canvas, then repeats it as the background of a pointer-transparent
// overlay. Ported behavior from Ant Design's <Watermark> (content/font/rotate/gap/opacity, overlay).
// window.ZGui.watermark.
//   ZGui.watermark(container, { text|content:[line…], font:{size,family,color,weight}, rotate:-22,
//       gap:[120,80], offset, opacity:0.15, zIndex:9 }) -> { el, update(opts), remove() }
(function () {
    "use strict";
    function watermark(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = Object.assign({}, opts);
        const cs = (typeof getComputedStyle === "function") ? getComputedStyle(host) : null;
        if (!cs || cs.position === "static") host.style.position = "relative";

        const overlay = document.createElement("div"); overlay.className = "zg-watermark";
        overlay.style.zIndex = opts.zIndex == null ? 9 : opts.zIndex;
        host.appendChild(overlay);

        function tile(o) {
            const lines = o.content ? (Array.isArray(o.content) ? o.content : [o.content]) : [o.text || "WATERMARK"];
            const f = o.font || {};
            const size = f.size || 15, family = f.family || "'Share Tech Mono', monospace", color = f.color || "rgba(255,255,255,0.16)", weight = f.weight || "normal";
            const rotate = (o.rotate == null ? -22 : o.rotate) * Math.PI / 180;
            const gapX = (o.gap && o.gap[0]) || 140, gapY = (o.gap && o.gap[1]) || 90;
            const lineH = size + 4;
            const cv = document.createElement("canvas");
            const ratio = window.devicePixelRatio || 1;
            const w = gapX, h = gapY;
            cv.width = w * ratio; cv.height = h * ratio;
            const ctx = cv.getContext("2d");
            ctx.scale(ratio, ratio);
            ctx.globalAlpha = o.opacity == null ? 1 : o.opacity;
            ctx.font = `${weight} ${size}px ${family}`;
            ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.translate(w / 2, h / 2); ctx.rotate(rotate);
            lines.forEach((ln, i) => ctx.fillText(ln, 0, (i - (lines.length - 1) / 2) * lineH));
            return { url: typeof cv.toDataURL === "function" ? cv.toDataURL() : "", w, h };
        }
        function paint() {
            const t = tile(opts);
            if (!t.url) return;   // no canvas.toDataURL (non-browser) — nothing to paint
            overlay.style.backgroundImage = `url(${t.url})`;
            overlay.style.backgroundSize = `${t.w}px ${t.h}px`;
            overlay.style.backgroundRepeat = "repeat";
            if (opts.offset) overlay.style.backgroundPosition = `${opts.offset[0] || 0}px ${opts.offset[1] || 0}px`;
        }
        paint();
        return {
            el: overlay,
            update(next) { opts = Object.assign(opts, next); overlay.style.zIndex = opts.zIndex == null ? 9 : opts.zIndex; paint(); },
            remove() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.watermark = watermark;
})();
