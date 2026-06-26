// zgui-core/wheel.js — the performance wheel + touch strip, ported from zpwr-patch-core.
//  ZGui.wheel(parent, {label,min,max,center,spring,onChange}) -> {el,get,set} — vertical pitch/mod
//    wheel: the wheel.png surface scrolls with the value; `spring:true` snaps back to center on release.
//  ZGui.touchstrip(parent, {leds,mode:'mod'|'pb',value,onChange}) -> {el,get,set} — the S88 LED touch
//    ribbon (touchstrip.png): 'mod' lights from the left and holds, 'pb' lights center-outward + springs.
(function () {
    "use strict";
    let ASSET_BASE = "img/";
    try { if (document.currentScript && document.currentScript.src) ASSET_BASE = document.currentScript.src.replace(/[^/]+$/, "") + "img/"; } catch { /* */ }
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }

    function wheel(parent, opt) {
        opt = opt || {};
        const host = typeof parent === "string" ? document.querySelector(parent) : parent;
        const min = opt.min == null ? 0 : opt.min, max = opt.max == null ? 127 : opt.max, center = opt.center == null ? min : opt.center;
        const cell = el("div", "zg-wheel-cell", host);
        const track = el("div", "zg-wheel-track", cell);
        track.style.background = `url("${ASSET_BASE}wheel.png") center 50% / 100% 200% no-repeat, #07070c`;
        const grip = el("div", "zg-wheel-grip", track);
        if (opt.label != null) el("div", "zg-wheel-lbl", cell, opt.label);
        let v = center;
        function place() { const norm = (v - min) / (max - min); grip.style.top = ((1 - norm) * 100) + "%"; track.style.backgroundPositionY = (norm * 100) + "%"; }
        function setV(nv, fire) { v = Math.max(min, Math.min(max, nv)); place(); if (fire && typeof opt.onChange === "function") opt.onChange(v); }
        const fromY = (cy) => { const r = track.getBoundingClientRect(); const t = Math.min(1, Math.max(0, 1 - (cy - r.top) / r.height)); setV(Math.round(min + t * (max - min)), true); };
        let drag = false;
        track.addEventListener("pointerdown", (e) => { drag = true; try { track.setPointerCapture(e.pointerId); } catch { /* */ } fromY(e.clientY); e.preventDefault(); });
        track.addEventListener("pointermove", (e) => { if (drag) fromY(e.clientY); });
        const end = (e) => { drag = false; try { track.releasePointerCapture(e.pointerId); } catch { /* */ } if (opt.spring) setV(center, true); };
        track.addEventListener("pointerup", end); track.addEventListener("pointercancel", end);
        place();
        return { el: cell, get() { return v; }, set(nv) { setV(nv, false); } };
    }

    function touchstrip(parent, opt) {
        opt = opt || {};
        const host = typeof parent === "string" ? document.querySelector(parent) : parent;
        const NLED = opt.leds || 16, pb = opt.mode === "pb";
        const strip = el("div", "zg-tstrip", host);
        const ledsEl = el("div", "zg-tstrip-leds", strip);
        const leds = []; for (let i = 0; i < NLED; i++) leds.push(el("div", "zg-tstrip-led", ledsEl));
        let t = opt.value == null ? (pb ? 0.5 : 0) : opt.value;
        const MID = (NLED - 1) / 2;
        function place() {
            const pos = t * (NLED - 1);
            leds.forEach((d, i) => {
                let on;
                if (pb) on = (pos >= MID) ? (i >= MID - 0.001 && i <= pos + 0.001) : (i <= MID + 0.001 && i >= pos - 0.001);
                else on = i <= pos + 0.001;
                d.classList.toggle("on", on);
            });
        }
        function setT(nt, fire) { t = Math.min(1, Math.max(0, nt)); place(); if (fire && typeof opt.onChange === "function") opt.onChange(t); }
        const fromX = (cx) => { const r = strip.getBoundingClientRect(); setT((cx - r.left) / r.width, true); };
        let drag = false;
        strip.addEventListener("pointerdown", (e) => { drag = true; strip.classList.add("touched"); try { strip.setPointerCapture(e.pointerId); } catch { /* */ } fromX(e.clientX); e.preventDefault(); });
        strip.addEventListener("pointermove", (e) => { if (drag) fromX(e.clientX); });
        const end = (e) => { drag = false; strip.classList.remove("touched"); try { strip.releasePointerCapture(e.pointerId); } catch { /* */ } if (pb) setT(0.5, true); };
        strip.addEventListener("pointerup", end); strip.addEventListener("pointercancel", end);
        place();
        return { el: strip, get() { return t; }, set(nt) { setT(nt, false); } };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.wheel = wheel;
    window.ZGui.touchstrip = touchstrip;
})();
