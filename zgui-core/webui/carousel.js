// zgui-core/carousel.js — a slideshow: one slide visible at a time, sliding track,
// neon prev/next arrows + dot indicators, optional wrap-around. window.ZGui.carousel.
//   ZGui.carousel({ slides:[html|node…], index?, arrows?, dots?, loop?, onChange? })
//     -> { el, go(i), next(), prev(), index() }
(function () {
    "use strict";
    function carousel(opts) {
        opts = opts || {};
        const slides = (opts.slides || []).slice();
        const loop = opts.loop !== false;
        let idx = Math.max(0, Math.min(opts.index || 0, Math.max(0, slides.length - 1)));

        const el = document.createElement("div");
        el.className = "zg-carousel";
        const viewport = document.createElement("div");
        viewport.className = "zg-carousel-viewport";
        const track = document.createElement("div");
        track.className = "zg-carousel-track";
        slides.forEach((s) => {
            const slide = document.createElement("div");
            slide.className = "zg-carousel-slide";
            if (s && s.nodeType) slide.appendChild(s);
            else slide.innerHTML = String(s == null ? "" : s);
            track.appendChild(slide);
        });
        viewport.appendChild(track);
        el.appendChild(viewport);

        const dots = document.createElement("div");
        dots.className = "zg-carousel-dots";
        const dotEls = slides.map((_, i) => {
            const d = document.createElement("button");
            d.type = "button";
            d.className = "zg-carousel-dot";
            d.addEventListener("click", () => go(i));
            dots.appendChild(d);
            return d;
        });

        function mkArrow(cls, glyph, fn) {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "zg-carousel-arrow " + cls;
            b.innerHTML = glyph;
            b.addEventListener("click", fn);
            return b;
        }
        if (opts.arrows !== false && slides.length > 1) {
            el.appendChild(mkArrow("zg-carousel-prev", "&#10094;", prev));
            el.appendChild(mkArrow("zg-carousel-next", "&#10095;", next));
        }
        if (opts.dots !== false && slides.length > 1) el.appendChild(dots);

        function render() {
            track.style.transform = `translateX(${-idx * 100}%)`;
            dotEls.forEach((d, i) => d.classList.toggle("active", i === idx));
            if (typeof opts.onChange === "function") opts.onChange(idx);
        }
        function go(i) {
            if (!slides.length) return;
            idx = loop ? (i + slides.length) % slides.length : Math.max(0, Math.min(i, slides.length - 1));
            render();
        }
        function next() { go(idx + 1); }
        function prev() { go(idx - 1); }
        render();
        return { el, go, next, prev, index: () => idx };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.carousel = carousel;
})();
