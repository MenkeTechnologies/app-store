// zgui-core/morph-pad.js — the 4-corner PRESET MORPH / vector-blend pad, ported from
// zpwr-patch-core's perform tab. Drag the puck to bilinearly blend between 4 corners
// (A=TL, B=TR, C=BL, D=BR). Generic: the consumer supplies corner labels/names and reacts to
// onChange(x, y, weights) — the bilinear math lives here. window.ZGui.morphPad.
//   ZGui.morphPad({ title, corners:[{label,name}], x, y, onChange, onCorner }) ->
//       { el, get()->{x,y,weights}, weights(), set(x,y), setCorner(idx,name) }
//   weights = { a:(1-x)(1-y), b:x(1-y), c:(1-x)y, d:xy }  (A/B/C/D)
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    const POS = [["A", "tl"], ["B", "tr"], ["C", "bl"], ["D", "br"]];
    const clamp01 = (n) => Math.min(1, Math.max(0, n));
    function weightsFor(x, y) { return { a: (1 - x) * (1 - y), b: x * (1 - y), c: (1 - x) * y, d: x * y }; }

    function morphPad(opts) {
        opts = opts || {};
        let x = clamp01(opts.x == null ? 0.5 : opts.x), y = clamp01(opts.y == null ? 0.5 : opts.y);
        const corners = opts.corners || [];

        const el = document.createElement("div");
        el.className = "zg-morph";
        if (opts.title !== false) {
            const t = document.createElement("div");
            t.className = "zg-morph-title";
            t.textContent = opts.title || "MORPH";
            el.appendChild(t);
        }
        const pad = document.createElement("div");
        pad.className = "zg-morph-pad";
        el.appendChild(pad);
        const puck = document.createElement("div");
        puck.className = "zg-morph-puck";
        pad.appendChild(puck);

        const nameEls = [];
        POS.forEach(([L, pos], idx) => {
            const c = corners[idx] || {};
            const cell = document.createElement("div");
            cell.className = "zg-morph-corner zg-morph-" + pos;
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "zg-morph-set" + (c.name ? " set" : "");
            btn.textContent = c.label || L;
            btn.title = "corner " + (c.label || L);
            btn.addEventListener("click", (e) => { e.stopPropagation(); if (typeof opts.onCorner === "function") opts.onCorner(idx); });
            const nm = document.createElement("div");
            nm.className = "zg-morph-name";
            nm.textContent = c.name || "—";
            cell.appendChild(btn);
            cell.appendChild(nm);
            pad.appendChild(cell);
            nameEls.push({ btn, nm });
        });

        function place() { puck.style.left = (x * 100) + "%"; puck.style.top = (y * 100) + "%"; }
        function emit() { if (typeof opts.onChange === "function") opts.onChange(x, y, weightsFor(x, y)); }
        function setXY(e) {
            const r = pad.getBoundingClientRect();
            x = clamp01((e.clientX - r.left) / (r.width || 1));
            y = clamp01((e.clientY - r.top) / (r.height || 1));
            place(); emit();
        }
        let drag = false;
        pad.addEventListener("pointerdown", (e) => { drag = true; try { pad.setPointerCapture(e.pointerId); } catch { /* */ } setXY(e); e.preventDefault(); });
        pad.addEventListener("pointermove", (e) => { if (drag) setXY(e); });
        const end = (e) => { drag = false; try { pad.releasePointerCapture(e.pointerId); } catch { /* */ } };
        pad.addEventListener("pointerup", end);
        pad.addEventListener("pointercancel", end);
        place();

        return {
            el,
            get: () => ({ x, y, weights: weightsFor(x, y) }),
            weights: () => weightsFor(x, y),
            set: (nx, ny) => { x = clamp01(nx); y = clamp01(ny); place(); emit(); },
            setCorner: (idx, name) => { if (nameEls[idx]) { nameEls[idx].nm.innerHTML = esc(name || "—"); nameEls[idx].btn.classList.toggle("set", !!name); } },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.morphPad = morphPad;
})();
