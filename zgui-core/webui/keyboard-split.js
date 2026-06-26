// zgui-core/keyboard-split.js — the layer key-range SPLIT editor: stacked draggable range bands over
// a piano strip, one per layer. Drag a band's lo/hi edge to resize its key zone, or its body to move
// the whole zone (preserving width). Ported from zpwr-patch-core's buildSplitKeyboard. Distinct from
// ZGui.keyboard (playable). window.ZGui.keyboardSplit.   Pairs with keyboard-split.css.
//   ZGui.keyboardSplit({ layers:[{name,keyLo,keyHi}], lo=21, hi=108, onChange }) -> { el, get() }
//   onChange(layerIndex, prop, value)  where prop is 'keyLo' | 'keyHi' (MIDI note numbers).
(function () {
    "use strict";
    const WHITE = [0, 2, 4, 5, 7, 9, 11];
    function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }

    function keyboardSplit(opts) {
        opts = opts || {};
        const LO = opts.lo != null ? opts.lo : 21, HI = opts.hi != null ? opts.hi : 108;
        const layers = (opts.layers || []).map((L) => ({ name: L.name, keyLo: L.keyLo != null ? L.keyLo : LO, keyHi: L.keyHi != null ? L.keyHi : HI }));
        const whites = [];
        for (let n = LO; n <= HI; n++) if (WHITE.includes(n % 12)) whites.push(n);
        const keyW = 100 / whites.length;
        const noteX = (n) => { let i = 0; for (const w of whites) { if (w >= n) break; i++; } return i * keyW; };
        const xNote = (xPct) => whites[Math.max(0, Math.min(whites.length - 1, Math.round(xPct / keyW)))];

        const wrap = el("div", "zg-ksplit");
        const zoneArea = el("div", "zg-ksplit-zones", wrap);
        zoneArea.style.height = (layers.length * 17 + 2) + "px";
        el("div", "zg-ksplit-keys", wrap);   // keyboard.png strip (background via CSS)

        layers.forEach((L, li) => {
            const band = el("div", "zg-ksplit-band", zoneArea);
            band.style.top = (li * 17) + "px";
            const hue = (li * 67) % 360;
            band.style.background = "hsla(" + hue + ",80%,55%,0.3)";
            band.style.borderColor = "hsl(" + hue + ",85%,60%)";
            el("span", "zg-ksplit-lbl", band).textContent = L.name || ("L" + (li + 1));
            const hLo = el("div", "zg-ksplit-h lo", band), hHi = el("div", "zg-ksplit-h hi", band);
            hLo.style.background = hHi.style.background = "hsl(" + hue + ",85%,60%)";
            const place = () => {
                band.style.left = noteX(L.keyLo) + "%";
                band.style.right = (100 - noteX(L.keyHi + 1)) + "%";
                band.title = "Layer " + (li + 1) + ": keys " + L.keyLo + "-" + L.keyHi;
            };
            function emit(prop) { if (typeof opts.onChange === "function") opts.onChange(li, prop, L[prop]); }
            const xOfEvent = (e) => { const r = zoneArea.getBoundingClientRect(); return xNote((e.clientX - r.left) / (r.width || 1) * 100); };
            function dragEdge(h, isHi) {
                let on = false;
                h.addEventListener("pointerdown", (e) => { on = true; try { h.setPointerCapture(e.pointerId); } catch { /* */ } e.preventDefault(); e.stopPropagation(); });
                h.addEventListener("pointermove", (e) => {
                    if (!on) return;
                    let v = xOfEvent(e);
                    if (isHi) { v = Math.max(v, L.keyLo); L.keyHi = v; emit("keyHi"); } else { v = Math.min(v, L.keyHi); L.keyLo = v; emit("keyLo"); }
                    place();
                });
                const end = (e) => { on = false; try { h.releasePointerCapture(e.pointerId); } catch { /* */ } };
                h.addEventListener("pointerup", end); h.addEventListener("pointercancel", end);
            }
            dragEdge(hLo, false); dragEdge(hHi, true);
            // body-drag: move the whole zone, preserving width
            let moving = false, startKey = 0, startLo = 0, startHi = 0;
            band.addEventListener("pointerdown", (e) => {
                if (e.target.classList.contains("zg-ksplit-h")) return;
                moving = true; startKey = xOfEvent(e); startLo = L.keyLo; startHi = L.keyHi;
                try { band.setPointerCapture(e.pointerId); } catch { /* */ }
                e.preventDefault();
            });
            band.addEventListener("pointermove", (e) => {
                if (!moving) return;
                let d = xOfEvent(e) - startKey;
                d = Math.max(LO - startLo, Math.min(HI - startHi, d));   // clamp so the zone stays on-board
                L.keyLo = startLo + d; L.keyHi = startHi + d; place(); emit("keyLo"); emit("keyHi");
            });
            const bend = (e) => { moving = false; try { band.releasePointerCapture(e.pointerId); } catch { /* */ } };
            band.addEventListener("pointerup", bend); band.addEventListener("pointercancel", bend);
            place();
        });

        return { el: wrap, get() { return layers.map((L) => ({ name: L.name, keyLo: L.keyLo, keyHi: L.keyHi })); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.keyboardSplit = keyboardSplit;
})();
