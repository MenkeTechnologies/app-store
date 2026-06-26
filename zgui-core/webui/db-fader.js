// zgui-core/db-fader.js — a vertical mixer/console channel fader with a dB tick scale
// (0/-6/-12/-24/-48), gradient cyan→magenta fill + a thumb. Ported from zpwr-patch-core's mixer
// buildFader (mx-fader). Distinct from ZGui.fader (the small synth slider with the slider_thumb
// sprite). window.ZGui.dbFader.   Pairs with db-fader.css.
//   ZGui.dbFader({ value, min=-48, max=0, ticks, onChange }) -> { el, get(), set(v) }
(function () {
    "use strict";
    function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }
    function dbFader(opts) {
        opts = opts || {};
        const min = opts.min != null ? opts.min : -48, max = opts.max != null ? opts.max : 0;
        let v = opts.value != null ? opts.value : 0;
        const wrap = el("div", "zg-dbfader");
        const track = el("div", "zg-dbfader-track", wrap);
        const fill = el("div", "zg-dbfader-fill", track);
        const thumb = el("div", "zg-dbfader-thumb", track);
        const scale = el("div", "zg-dbfader-scale", wrap);
        (opts.ticks || ["0", "-6", "-12", "-24", "-48"]).forEach((t) => { el("div", "zg-dbfader-tick", scale).textContent = t; });

        const norm = () => Math.min(1, Math.max(0, (v - min) / (max - min)));
        function place() { const top = (1 - norm()) * 100; thumb.style.top = top + "%"; fill.style.top = top + "%"; }
        function setV(nv, fire) { v = Math.min(max, Math.max(min, nv)); place(); if (fire && typeof opts.onChange === "function") opts.onChange(v); }
        let drag = false;
        const setFrom = (e) => { const r = track.getBoundingClientRect(); const t = Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / (r.height || 1))); setV(min + t * (max - min), true); };
        track.addEventListener("pointerdown", (e) => { drag = true; try { track.setPointerCapture(e.pointerId); } catch { /* */ } setFrom(e); e.preventDefault(); });
        track.addEventListener("pointermove", (e) => { if (drag) setFrom(e); });
        const end = (e) => { drag = false; try { track.releasePointerCapture(e.pointerId); } catch { /* */ } };
        track.addEventListener("pointerup", end);
        track.addEventListener("pointercancel", end);
        place();
        return { el: wrap, get() { return v; }, set(nv) { setV(nv, false); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.dbFader = dbFader;
})();
