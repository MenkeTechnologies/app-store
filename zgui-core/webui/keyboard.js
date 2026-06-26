// zgui-core/keyboard.js — the on-screen playable piano with the S88-style light-guide, ported from
// zpwr-patch-core. The visual is the Blender perspective render keyboard.png; every key is a polygon
// clip-path hit-zone positioned from keyboard_geom.json so clicks land exactly on the painted keys
// (black keys z-above white). Mouse-drag glissando; a window pointerup releases all held notes. Above
// the keys is the light-guide: one always-dim LED per key (bloom), brightened when the key plays or
// when lit by guide()/light(). window.ZGui.keyboard.   (root class .zg-piano — NOT .zg-kbd, which is
// the key-chip from kbd.js.)
//
//   ZGui.keyboard.create(parent, { onNoteOn(note), onNoteOff(note), guide:[notes], guideColor }) ->
//       { el, allUp, light(note,on), guide(notes), colorize('accent'|'rainbow'|'octave') }
//   (notes are MIDI numbers; geom is the full 88-key range, 21..108)
(function () {
    "use strict";

    const NOTE = { 0: "C", 2: "D", 4: "E", 5: "F", 7: "G", 9: "A", 11: "B" }; // white-key labels

    let ASSET_BASE = "img/";
    try { if (document.currentScript && document.currentScript.src) ASSET_BASE = document.currentScript.src.replace(/[^/]+$/, "") + "img/"; } catch { /* relative */ }

    function el(tag, cls, parent) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (parent) parent.appendChild(e);
        return e;
    }

    let _geom = null;
    async function loadGeom() {
        if (_geom) return _geom;
        try { _geom = await (await fetch(ASSET_BASE + "keyboard_geom.json")).json(); } catch { _geom = { keys: [] }; }
        return _geom;
    }

    const _releasers = [];
    let _upWired = false;

    function create(parent, opts) {
        opts = opts || {};
        const host = typeof parent === "string" ? document.querySelector(parent) : parent;
        if (!host) return null;
        const kb = el("div", "zg-piano", host);
        const keyEls = {};
        const ledEls = {};
        const guideSet = new Set();
        const held = new Set();
        let down = false;

        function hi(note, on) { const k = keyEls[note]; if (k) k.classList.toggle("held", on); }
        function ledOn(note, on) { const l = ledEls[note]; if (l) l.classList.toggle("on", on); }
        function press(note) { if (held.has(note)) return; held.add(note); if (typeof opts.onNoteOn === "function") opts.onNoteOn(note); hi(note, true); ledOn(note, true); }
        function release(note) { if (!held.has(note)) return; held.delete(note); if (typeof opts.onNoteOff === "function") opts.onNoteOff(note); hi(note, false); ledOn(note, guideSet.has(note)); }
        function allUp() { down = false; held.forEach((n) => { if (typeof opts.onNoteOff === "function") opts.onNoteOff(n); hi(n, false); ledOn(n, guideSet.has(n)); }); held.clear(); }

        // Light a single guide LED (persists across release); guide() sets the whole guide set.
        function light(note, on) { if (on) guideSet.add(note); else guideSet.delete(note); ledOn(note, on); }
        function guide(notes) {
            guideSet.forEach((n) => { if (!held.has(n)) ledOn(n, false); });
            guideSet.clear();
            (notes || []).forEach((n) => { guideSet.add(n); ledOn(n, true); });
        }
        // Per-LED colour mode: accent (default), rainbow (hue across range), octave (hue by pitch class).
        function colorize(mode) {
            Object.keys(ledEls).forEach((key) => {
                const n = +key, l = ledEls[key];
                if (mode === "rainbow") { const h = ((n - 21) / 87 * 320) | 0; l.style.setProperty("--c", `hsl(${h},90%,55%)`); l.style.setProperty("--clit", `hsl(${h},95%,72%)`); }
                else if (mode === "octave") { const h = ((n % 12) / 12 * 360) | 0; l.style.setProperty("--c", `hsl(${h},85%,55%)`); l.style.setProperty("--clit", `hsl(${h},95%,72%)`); }
                else { l.style.removeProperty("--c"); l.style.removeProperty("--clit"); }
            });
        }

        _releasers.push({ container: kb, allUp });
        if (!_upWired) {
            _upWired = true;
            window.addEventListener("pointerup", () => {
                for (let i = _releasers.length - 1; i >= 0; i--) {
                    if (!_releasers[i].container.isConnected) _releasers.splice(i, 1);
                    else _releasers[i].allUp();
                }
            });
        }

        loadGeom().then((geom) => {
            // height comes from the CSS aspect-ratio (8.05/1, matching keyboard.png) — like zpc; do NOT
            // set it inline from geom (a missing/odd geom would then collapse the keyboard to a line).
            // playable keys (polygon clip-path hit-zones)
            geom.keys.forEach((k) => {
                const d = el("div", "zg-kbd-key " + (k.kind === "b" ? "bk" : "wk"), kb);
                d.style.clipPath = "polygon(" + k.poly.map((p) => (p[0] * 100).toFixed(3) + "% " + (p[1] * 100).toFixed(3) + "%").join(",") + ")";
                d.dataset.note = k.note;
                keyEls[k.note] = d;
                d.addEventListener("pointerdown", (e) => { down = true; press(k.note); e.preventDefault(); });
                d.addEventListener("pointerenter", () => { if (down) press(k.note); });
                d.addEventListener("pointerleave", () => release(k.note));
                d.addEventListener("pointerup", () => release(k.note));
            });
            // light-guide LED strip: 88 LEDs EVENLY spaced above the keys (the real S88 strip is uniform,
            // not the perspective-compressed key x), each always dim-lit, brighter when played/lit.
            geom.keys.forEach((k) => {
                const ld = el("div", "zg-piano-dash", kb);
                ld.dataset.gnote = k.note;
                ld.style.left = (0.8 + (k.note - 21) / 87 * 98.4).toFixed(3) + "%";
                ledEls[k.note] = ld;
            });
            // white-key note labels at the front-centre (poly[0],poly[1] are the front corners)
            geom.keys.forEach((k) => {
                if (k.kind !== "w") return;
                const s = k.note % 12;
                if (!(s in NOTE)) return;
                const fx = (k.poly[0][0] + k.poly[1][0]) / 2, fy = (k.poly[0][1] + k.poly[1][1]) / 2;
                const lbl = el("span", "zg-piano-lbl" + (s === 0 ? " c" : ""), kb);
                lbl.textContent = s === 0 ? "C" + (Math.floor(k.note / 12) - 1) : NOTE[s];
                lbl.style.left = (fx * 100).toFixed(3) + "%";
                lbl.style.top = (fy * 100).toFixed(3) + "%";
            });
            // LED width ≈ ½ a white-key pitch so adjacent LEDs nearly touch (52 white keys across).
            const setLedW = () => { const w = kb.getBoundingClientRect().width; if (w) kb.style.setProperty("--led-w", (w / 52 * 0.46).toFixed(2) + "px"); };
            requestAnimationFrame(() => requestAnimationFrame(setLedW));
            if (window.ResizeObserver) new ResizeObserver(() => requestAnimationFrame(setLedW)).observe(kb);
            colorize(opts.guideColor || "accent");
            if (opts.guide) guide(opts.guide);
        });

        return { el: kb, allUp, light, guide, colorize };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.keyboard = { create: create };
})();
