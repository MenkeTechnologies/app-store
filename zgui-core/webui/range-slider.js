// zgui-core/range-slider.js — a dual-handle min/max range slider (the single-handle
// slider is `zs-range` in widgets). Drag either thumb; the fill spans the selection.
// window.ZGui.rangeSlider.
//   ZGui.rangeSlider({ min, max, step, low, high, onChange, onInput }) -> { el, get(), set(low,high) }
(function () {
    "use strict";
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function rangeSlider(opts) {
        opts = opts || {};
        const min = opts.min != null ? opts.min : 0;
        const max = opts.max != null ? opts.max : 100;
        const step = opts.step || 1;
        let low = clamp(opts.low != null ? opts.low : min, min, max);
        let high = clamp(opts.high != null ? opts.high : max, min, max);

        const el = document.createElement("div");
        el.className = "zg-range";
        const track = document.createElement("div"); track.className = "zg-range-track";
        const fill = document.createElement("div"); fill.className = "zg-range-fill";
        track.appendChild(fill);
        function mkThumb() { const t = document.createElement("div"); t.className = "zg-range-thumb"; t.tabIndex = 0; track.appendChild(t); return t; }
        const loThumb = mkThumb();
        const hiThumb = mkThumb();
        el.appendChild(track);

        const pct = (v) => ((v - min) / (max - min)) * 100;
        function paint() {
            fill.style.left = pct(low) + "%";
            fill.style.right = (100 - pct(high)) + "%";
            loThumb.style.left = pct(low) + "%";
            hiThumb.style.left = pct(high) + "%";
        }
        function emit(live) {
            const cb = live ? opts.onInput : opts.onChange;
            if (typeof cb === "function") cb(low, high);
        }
        function valueAt(clientX) {
            const r = track.getBoundingClientRect();
            const ratio = r.width ? clamp((clientX - r.left) / r.width, 0, 1) : 0;
            const raw = min + ratio * (max - min);
            return clamp(Math.round(raw / step) * step, min, max);
        }
        function drag(which, startEv) {
            startEv.preventDefault();
            const move = (e) => {
                const x = e.touches ? e.touches[0].clientX : e.clientX;
                const v = valueAt(x);
                if (which === "lo") low = Math.min(v, high);
                else high = Math.max(v, low);
                paint(); emit(true);
            };
            const up = () => {
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
                document.removeEventListener("touchmove", move);
                document.removeEventListener("touchend", up);
                emit(false);
            };
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
            document.addEventListener("touchmove", move, { passive: false });
            document.addEventListener("touchend", up);
        }
        loThumb.addEventListener("mousedown", (e) => drag("lo", e));
        hiThumb.addEventListener("mousedown", (e) => drag("hi", e));
        loThumb.addEventListener("touchstart", (e) => drag("lo", e), { passive: false });
        hiThumb.addEventListener("touchstart", (e) => drag("hi", e), { passive: false });

        paint();
        return {
            el,
            get: () => ({ low, high }),
            set: (l, h) => { low = clamp(l, min, max); high = clamp(h, min, max); if (low > high) { const t = low; low = high; high = t; } paint(); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.rangeSlider = rangeSlider;
})();
