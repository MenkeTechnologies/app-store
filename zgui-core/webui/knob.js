// zgui-core/knob.js — the rotary knob, ported faithfully from zpwr-patch-core's macro/param knob,
// INCLUDING the Blender-rendered 3D body (knob_body.png, a 65-frame vertical sprite scrolled by
// value) + the conic-gradient value ring + the knob_ptr.png pointer. Drag up to raise; value 0..1
// maps to a 270° sweep (-135°…+135°), exactly as the synth. Namespaced `zg-knob`/`zg-dial` so it
// doesn't collide with the synth's own `.knob`/`.dial`. window.ZGui.knob. (assets in ../img/)
//
//   ZGui.knob({ value:0, default, label, size:56, onChange }) -> { el, get(), set(v) }   // value 0..1
(function () {
    "use strict";

    const KNOB_FRAMES = 65; // knob_body.png is a 65-frame vertical sprite (matches the synth)

    // Resolve the img/ folder relative to THIS script so the sprites load wherever zgui is vendored.
    let ASSET_BASE = "img/";
    try {
        if (document.currentScript && document.currentScript.src) {
            ASSET_BASE = document.currentScript.src.replace(/[^/]+$/, "") + "img/";
        }
    } catch { /* fall back to relative */ }

    function el(tag, cls, parent, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        if (parent) parent.appendChild(e);
        return e;
    }
    const clamp01 = (n) => Math.min(1, Math.max(0, n));

    function knob(opts) {
        opts = opts || {};
        let v = typeof opts.value === "number" ? clamp01(opts.value) : 0;
        const wrap = el("div", "zg-knob");
        if (opts.size) wrap.style.setProperty("--zg-knob-size", opts.size + "px");
        const dial = el("div", "zg-dial", wrap);
        dial.setAttribute("role", "slider");
        const pointer = el("div", "zg-dial-pointer", dial);
        if (opts.label != null) el("div", "zg-knob-label", wrap, opts.label);
        const valEl = el("div", "zg-knob-val", wrap);

        function render() {
            pointer.style.transform = `translate(-50%, -100%) rotate(${-135 + v * 270}deg)`;
            const f = Math.round(v * (KNOB_FRAMES - 1));
            // 3D body sprite (frame by value) over the conic value ring — the exact synth formula.
            dial.style.background =
                `url("${ASSET_BASE}knob_body.png") center ${(f / (KNOB_FRAMES - 1) * 100).toFixed(2)}% / 100% auto no-repeat, ` +
                `conic-gradient(from -135deg, var(--accent) 0deg ${v * 270}deg, var(--border) ${v * 270}deg 270deg, transparent 270deg 360deg)`;
            valEl.textContent = Math.round(v * 100) + "%";
        }
        function setV(nv, fire) {
            v = clamp01(nv);
            render();
            if (fire && typeof opts.onChange === "function") opts.onChange(v);
        }

        let drag = false, sy = 0, sv = 0;
        dial.addEventListener("pointerdown", (e) => {
            drag = true; sy = e.clientY; sv = v;
            try { dial.setPointerCapture(e.pointerId); } catch { /* unsupported */ }
            e.preventDefault();
        });
        dial.addEventListener("pointermove", (e) => { if (drag) setV(sv + (sy - e.clientY) / 200, true); });
        const end = (e) => { drag = false; try { dial.releasePointerCapture(e.pointerId); } catch { /* ignore */ } };
        dial.addEventListener("pointerup", end);
        dial.addEventListener("pointercancel", end);
        dial.addEventListener("dblclick", () => setV(opts.default != null ? opts.default : 0, true));

        render();
        return { el: wrap, get() { return v; }, set(nv) { setV(nv, false); } };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.knob = knob;
})();
