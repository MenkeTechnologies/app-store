// zgui-core/rating.js — a star rating control (click/hover to set). window.ZGui.rating.
//   ZGui.rating({ value:0, max:5, onChange }) -> { el, get(), set(v) }
(function () {
    "use strict";
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    function rating(opts) {
        opts = opts || {};
        const max = opts.max || 5;
        let v = opts.value || 0;
        const wrap = el("div", "zg-rating");
        const stars = [];
        function render() { stars.forEach((s, i) => s.classList.toggle("on", i < v)); }
        for (let i = 0; i < max; i++) {
            const s = el("span", "zg-star", wrap, "★");
            s.addEventListener("click", () => { v = i + 1; render(); if (typeof opts.onChange === "function") opts.onChange(v); });
            s.addEventListener("mouseenter", () => stars.forEach((x, k) => x.classList.toggle("hover", k <= i)));
            s.addEventListener("mouseleave", () => stars.forEach((x) => x.classList.remove("hover")));
            stars.push(s);
        }
        render();
        return { el: wrap, get() { return v; }, set(nv) { v = nv; render(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.rating = rating;
})();
