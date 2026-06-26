// zgui-core/synth.js — the rest of the zpwr-patch-core control kit as ZGui factories: a vertical
// fader (slider_thumb.png bead on a track), the ORB (zpc's circular .orb-pad), a square XY pad (zpc's
// .xy-pad perform pad, 2-param), an LED indicator, and a level meter. Interactions ported from the
// synth (drag math, value→position). Pairs with synth.css. window.ZGui.{fader,orb,xyPad,led,meter}.
//
//   ZGui.fader({ value, onChange }) -> { el, get(), set(v) }              // 0..1, drag the track
//   ZGui.orb({ x, y, onChange }) -> { el, get()->{x,y}, set(x,y) }        // the CIRCULAR orb (.orb-pad)
//   ZGui.xyPad({ x, y, xLabel, yLabel, onChange }) -> { el, get(), set }  // the SQUARE 2-param pad
//   ZGui.led({ on, color }) -> { el, get(), set(on) }
//   ZGui.meter({ value, horizontal }) -> { el, set(v) }                   // 0..1 level
(function () {
    "use strict";

    function el(tag, cls, parent) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (parent) parent.appendChild(e);
        return e;
    }
    const clamp01 = (n) => Math.min(1, Math.max(0, n));

    function fader(opts) {
        opts = opts || {};
        let v = typeof opts.value === "number" ? clamp01(opts.value) : 0;
        const wrap = el("div", "zg-fader");
        const track = el("div", "zg-fader-track", wrap);
        const fill = el("div", "zg-fader-fill", track);
        const thumb = el("div", "zg-fader-thumb", track);
        function render() { thumb.style.bottom = (v * 100) + "%"; fill.style.height = (v * 100) + "%"; }
        function setV(nv, fire) { v = clamp01(nv); render(); if (fire && typeof opts.onChange === "function") opts.onChange(v); }
        let drag = false;
        const fromY = (cy) => { const r = track.getBoundingClientRect(); setV((r.bottom - cy) / r.height, true); };
        track.addEventListener("pointerdown", (e) => { drag = true; try { track.setPointerCapture(e.pointerId); } catch { /* */ } fromY(e.clientY); e.preventDefault(); });
        track.addEventListener("pointermove", (e) => { if (drag) fromY(e.clientY); });
        const end = (e) => { drag = false; try { track.releasePointerCapture(e.pointerId); } catch { /* */ } };
        track.addEventListener("pointerup", end);
        track.addEventListener("pointercancel", end);
        render();
        return { el: wrap, get() { return v; }, set(nv) { setV(nv, false); } };
    }

    // 2D drag helper shared by the orb (circular) and the xyPad (square): both map a pointer to (x,y)
    // in [0,1]² and move a puck. `cls` is the root class, `puckCls` the puck; `pre` builds extra chrome.
    function pad2d(cls, puckCls, opts, pre) {
        let x = clamp01(opts.x == null ? 0.5 : opts.x), y = clamp01(opts.y == null ? 0.5 : opts.y);
        const pad = el("div", cls);
        if (pre) pre(pad);
        const puck = el("div", puckCls, pad);
        function render() { puck.style.left = (x * 100) + "%"; puck.style.top = (y * 100) + "%"; }
        function setXY(nx, ny, fire) { x = clamp01(nx); y = clamp01(ny); render(); if (fire && typeof opts.onChange === "function") opts.onChange(x, y); }
        let drag = false;
        const fromE = (e) => { const r = pad.getBoundingClientRect(); setXY((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, true); };
        pad.addEventListener("pointerdown", (e) => { drag = true; try { pad.setPointerCapture(e.pointerId); } catch { /* */ } fromE(e); e.preventDefault(); });
        pad.addEventListener("pointermove", (e) => { if (drag) fromE(e); });
        const end = (e) => { drag = false; try { pad.releasePointerCapture(e.pointerId); } catch { /* */ } };
        pad.addEventListener("pointerup", end);
        pad.addEventListener("pointercancel", end);
        render();
        return { el: pad, get() { return { x, y }; }, set(nx, ny) { setXY(nx, ny, false); } };
    }

    // the ORB — zpc's circular .orb-pad (the perform-tab vector control).
    function orb(opts) {
        opts = opts || {};
        return pad2d("zg-orb", "zg-orb-puck", opts, (pad) => el("div", "zg-orb-ring", pad));
    }

    // the square 2-param XY pad — zpc's .xy-pad (a perform pad). Optional axis labels (xLabel × yLabel)
    // render above the grid, like the synth's "Cutoff × Reso" header.
    function xyPad(opts) {
        opts = opts || {};
        const wrap = el("div", "zg-xycell");
        if (opts.xLabel != null || opts.yLabel != null) {
            const head = el("div", "zg-xy-head", wrap);
            head.textContent = (opts.xLabel || "X") + "  ×  " + (opts.yLabel || "Y");
        }
        const api = pad2d("zg-xypad", "zg-xypad-dot", opts);
        wrap.appendChild(api.el);
        return { el: wrap, pad: api.el, get: api.get, set: api.set };
    }

    function led(opts) {
        opts = opts || {};
        const e = el("span", "zg-led" + (opts.on ? " on" : ""));
        if (opts.color) e.style.setProperty("--zg-led-color", opts.color);
        return { el: e, set(on) { e.classList.toggle("on", !!on); }, get() { return e.classList.contains("on"); } };
    }

    function meter(opts) {
        opts = opts || {};
        const wrap = el("div", "zg-meter" + (opts.horizontal ? " zg-meter-h" : ""));
        const fill = el("div", "zg-meter-fill", wrap);
        function set(v) { v = clamp01(v); if (opts.horizontal) fill.style.width = (v * 100) + "%"; else fill.style.height = (v * 100) + "%"; }
        set(opts.value || 0);
        return { el: wrap, set };
    }

    window.ZGui = window.ZGui || {};
    Object.assign(window.ZGui, { fader, orb, xyPad, led, meter });
})();
