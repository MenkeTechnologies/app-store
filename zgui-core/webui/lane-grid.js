// zgui-core/lane-grid.js — a multi-lane per-block value grid (the "SECTION OVERRIDES" editor):
// stacked colored lanes × time blocks, each cell a 0..1 value drawn as a bar + label, with section
// group headers (draggable, block-snap boundaries). Canvas-rendered. Distilled from zpwr-clip-engine's
// grid framework (grid-core layout/render/hit-test + the automation domain), but STANDALONE — the
// consumer supplies lanes/values and reacts to callbacks; no clip-engine backend. window.ZGui.laneGrid.
//   ZGui.laneGrid(container, {
//       lanes:[{id,label,color}],                         // color: css string or {fill,stroke}
//       sections:[{label,start,end,sublabel}],            // block ranges; boundaries resize (block-snap)
//       blocks:28, value:{min:0,max:1,step:0.05,default:0.5},
//       values:{ laneId:{ block:value } },                // initial sparse overrides
//       onChange(laneId, block, value|null), onResize(sectionIndex, newEnd), height:240,
//   }) -> { el, set(laneId,block,v), clearAll(), get() }
// Interactions: click-drag paint · right-drag erase · drag a cell's TOP edge to set value · wheel ±step
//   · drag a section boundary to resize.
(function () {
    "use strict";
    const PAL = { bg: "#05050a", gutter: "#0a0a14", gutterLine: "#1a1a2e", laneEven: "#0a0a16", laneOdd: "#0c0c1a", blockLine: "rgba(255,255,255,0.05)", groupLine: "rgba(255,255,255,0.18)", headerText: "#7a8ba8", subText: "#3a4858", sel: "#05d9e8" };
    const PAD_L = 108, HEADER_H = 24, HINT_H = 18, LANE_GAP = 2, VALUE_BAND = 6, BOUNDARY_HIT = 5;
    const clampv = (v, mn, mx) => Math.min(mx, Math.max(mn, v));

    function laneGrid(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const lanes = opts.lanes || [];
        const sections = (opts.sections || []).map((s) => Object.assign({}, s));
        const blocks = opts.blocks || (sections.length ? sections[sections.length - 1].end : 16);
        const V = Object.assign({ min: 0, max: 1, step: 0.05, default: 0.5 }, opts.value || {});
        const vals = {};   // laneId -> Map(block -> value)
        lanes.forEach((ln) => { vals[ln.id] = new Map(); const src = (opts.values || {})[ln.id] || {}; Object.keys(src).forEach((k) => vals[ln.id].set(+k, src[k])); });

        const cv = document.createElement("canvas");
        cv.className = "zg-lanegrid";
        host.appendChild(cv);
        const ctx = cv.getContext("2d");

        // ── layout (pure-ish, recomputed per render) ──
        function layout() {
            const W = cv.width, H = cv.height;
            const gridX = PAD_L, gridW = Math.max(60, W - PAD_L - 8);
            const lanesY = HEADER_H + 4, laneAreaH = H - lanesY - HINT_H;
            const laneH = Math.max(14, Math.floor((laneAreaH - LANE_GAP * (lanes.length - 1)) / Math.max(1, lanes.length)));
            const unitW = gridW / blocks;
            const xOf = (u) => gridX + u * unitW;
            return { W, H, gridX, gridW, lanesY, laneAreaH, laneH, unitW, xOf };
        }
        function laneAt(y, L) { const i = Math.floor((y - L.lanesY) / (L.laneH + LANE_GAP)); return (y >= L.lanesY && y < L.lanesY + L.laneAreaH && i >= 0 && i < lanes.length) ? i : -1; }
        function blockAt(x, L) { const b = Math.floor((x - L.gridX) / L.unitW); return (x >= L.gridX && b >= 0 && b < blocks) ? b : -1; }

        function laneFill(ln) { const c = ln.color; return (c && c.fill) || (typeof c === "string" ? c : "rgba(5,217,232,0.4)"); }
        function laneStroke(ln) { const c = ln.color; return (c && c.stroke) || (typeof c === "string" ? c : PAL.sel); }

        function render() {
            const L = layout();
            ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, L.W, L.H);
            // section group headers + boundaries
            ctx.font = 'bold 10px "Share Tech Mono", monospace'; ctx.textBaseline = "middle";
            sections.forEach((g, gi) => {
                const x = L.xOf(g.start), w = (g.end - g.start) * L.unitW;
                ctx.fillStyle = PAL.headerText; ctx.textAlign = "left";
                ctx.fillText("▷ " + (g.label || ""), x + 4, HEADER_H / 2 - 3);
                if (g.sublabel) { ctx.fillStyle = PAL.subText; ctx.font = '9px "Share Tech Mono", monospace'; ctx.fillText(g.sublabel, x + 4, HEADER_H / 2 + 7); ctx.font = 'bold 10px "Share Tech Mono", monospace'; }
                if (gi < sections.length - 1) { const ex = x + w; ctx.fillStyle = "rgba(122,139,168,0.55)"; ctx.fillRect(Math.round(ex) - 1, 2, 3, HEADER_H - 4); ctx.fillStyle = "rgba(5,217,232,0.9)"; ctx.fillRect(Math.round(ex) - 2, HEADER_H / 2 - 2, 5, 1); ctx.fillRect(Math.round(ex) - 2, HEADER_H / 2 + 2, 5, 1); }
            });
            // lanes
            lanes.forEach((ln, i) => {
                const top = L.lanesY + i * (L.laneH + LANE_GAP), h = L.laneH;
                ctx.fillStyle = i % 2 ? PAL.laneOdd : PAL.laneEven; ctx.fillRect(L.gridX, top, L.gridW, h);
                for (let b = 0; b <= blocks; b++) { const onSection = sections.some((s) => s.start === b || s.end === b); ctx.strokeStyle = onSection ? PAL.groupLine : PAL.blockLine; ctx.lineWidth = 1; const gx = Math.round(L.xOf(b)) + 0.5; ctx.beginPath(); ctx.moveTo(gx, top); ctx.lineTo(gx, top + h); ctx.stroke(); }
                const fill = laneFill(ln), stroke = laneStroke(ln);
                vals[ln.id].forEach((v, b) => {
                    const x = L.xOf(b), w = L.unitW, frac = (v - V.min) / (V.max - V.min || 1);
                    const bh = frac * (h - 2), by = top + h - bh;
                    ctx.fillStyle = fill; ctx.fillRect(x + 1, by, w - 2, bh);
                    ctx.strokeStyle = stroke; ctx.lineWidth = 1; const rx = x + 1.5, ry = by + 0.5, rw = w - 3; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + rw, ry); ctx.lineTo(rx + rw, ry + bh); ctx.lineTo(rx, ry + bh); ctx.closePath(); ctx.stroke();
                    if (w > 24) { ctx.fillStyle = stroke; ctx.font = '8px "Share Tech Mono", monospace'; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText(v.toFixed(2), x + 3, top + 2); }
                });
            });
            // fixed gutter (lane labels + ✕)
            ctx.fillStyle = PAL.gutter; ctx.fillRect(0, 0, PAD_L, L.H);
            ctx.strokeStyle = PAL.gutterLine; ctx.beginPath(); ctx.moveTo(PAD_L + 0.5, 0); ctx.lineTo(PAD_L + 0.5, L.H); ctx.stroke();
            lanes.forEach((ln, i) => { const cy = L.lanesY + i * (L.laneH + LANE_GAP) + L.laneH / 2; ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.font = 'bold 10px "Share Tech Mono", monospace'; ctx.fillStyle = PAL.subText; ctx.fillText("✕", 4, cy); ctx.fillStyle = laneStroke(ln); ctx.fillText(ln.label || ln.id, 18, cy); });
            // hint
            ctx.fillStyle = PAL.subText; ctx.font = '9px "Share Tech Mono", monospace'; ctx.textAlign = "left"; ctx.textBaseline = "middle";
            ctx.fillText("click-drag paint · right-drag erase · drag top edge = value · wheel ±" + V.step + " · drag boundary to resize", PAD_L + 6, L.H - HINT_H / 2);
        }

        // ── interactions ──
        function setVal(ln, b, v) {
            if (b < 0 || b >= blocks) return;
            if (v == null) vals[ln.id].delete(b); else vals[ln.id].set(b, clampv(v, V.min, V.max));
            if (typeof opts.onChange === "function") opts.onChange(ln.id, b, v == null ? null : vals[ln.id].get(b));
            render();
        }
        function pt(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / (r.width || 1) * cv.width, y: (e.clientY - r.top) / (r.height || 1) * cv.height }; }
        let mode = null, dragSection = -1;
        cv.addEventListener("contextmenu", (e) => e.preventDefault());
        cv.addEventListener("pointerdown", (e) => {
            const L = layout(), p = pt(e);
            // section boundary resize (in header band)
            if (p.y < HEADER_H) {
                for (let gi = 0; gi < sections.length - 1; gi++) { if (Math.abs(p.x - L.xOf(sections[gi].end)) <= BOUNDARY_HIT) { dragSection = gi; try { cv.setPointerCapture(e.pointerId); } catch { /* */ } e.preventDefault(); return; } }
            }
            const li = laneAt(p.y, L), b = blockAt(p.x, L);
            if (li < 0 || b < 0) return;
            const ln = lanes[li], top = L.lanesY + li * (L.laneH + LANE_GAP);
            try { cv.setPointerCapture(e.pointerId); } catch { /* */ }
            if (e.button === 2) { mode = { kind: "erase", ln }; setVal(ln, b, null); }
            else if (p.y - top <= VALUE_BAND) { mode = { kind: "value", ln }; setVal(ln, b, V.min + (1 - (p.y - top) / L.laneH) * (V.max - V.min)); }
            else { mode = { kind: "paint", ln, v: V.default }; setVal(ln, b, V.default); }
            e.preventDefault();
        });
        cv.addEventListener("pointermove", (e) => {
            const L = layout(), p = pt(e);
            if (dragSection >= 0) { let nb = Math.round((p.x - L.gridX) / L.unitW); nb = Math.max(sections[dragSection].start + 1, Math.min(sections[dragSection + 1].end - 1, nb)); if (nb !== sections[dragSection].end) { sections[dragSection].end = nb; sections[dragSection + 1].start = nb; if (typeof opts.onResize === "function") opts.onResize(dragSection, nb); render(); } return; }
            if (!mode) return;
            const b = blockAt(p.x, L);
            if (b < 0) return;
            if (mode.kind === "erase") setVal(mode.ln, b, null);
            else if (mode.kind === "value") { const li = lanes.indexOf(mode.ln), top = L.lanesY + li * (L.laneH + LANE_GAP); setVal(mode.ln, b, V.min + (1 - (p.y - top) / L.laneH) * (V.max - V.min)); }
            else setVal(mode.ln, b, mode.v);
        });
        const end = (e) => { mode = null; dragSection = -1; try { cv.releasePointerCapture(e.pointerId); } catch { /* */ } };
        cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
        cv.addEventListener("wheel", (e) => {
            const L = layout(), p = pt(e), li = laneAt(p.y, L), b = blockAt(p.x, L);
            if (li < 0 || b < 0) return;
            e.preventDefault();
            const ln = lanes[li], cur = vals[ln.id].has(b) ? vals[ln.id].get(b) : V.default;
            setVal(ln, b, cur + (e.deltaY < 0 ? V.step : -V.step));
        }, { passive: false });

        function fit() { const w = host.clientWidth || 900, h = opts.height || 240; if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } render(); }
        cv.style.width = "100%"; cv.style.height = (opts.height || 240) + "px"; cv.style.display = "block";
        requestAnimationFrame(fit);
        if (window.ResizeObserver) new ResizeObserver(fit).observe(host);
        else render();

        return {
            el: cv,
            set(laneId, b, v) { const ln = lanes.find((l) => l.id === laneId); if (ln) setVal(ln, b, v); },
            clearAll() { lanes.forEach((ln) => vals[ln.id].clear()); render(); if (typeof opts.onChange === "function") opts.onChange(null, null, null); },
            get() { const o = {}; lanes.forEach((ln) => { o[ln.id] = {}; vals[ln.id].forEach((v, b) => { o[ln.id][b] = v; }); }); return o; },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.laneGrid = laneGrid;
})();
