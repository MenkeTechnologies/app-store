// zgui-core/piano-roll.js — a MIDI note editor: piano keys down the left, pitch lanes × time grid, with
// notes you add (click empty), move (drag body), resize (drag right edge), delete (right-click) and a
// playhead. Canvas-rendered. The core DAW note editor. window.ZGui.pianoRoll.
//   ZGui.pianoRoll(container, { notes:[{pitch,start,length,vel}], steps:32, lowPitch:48, highPitch:72,
//       pxPerStep:22, rowH:14, group:4, playhead:-1, onChange(notes) }) ->
//       { el, set(notes), setPlayhead(step), get() }
(function () {
    "use strict";
    const GUT = 34, EDGE = 6;
    const BLACK = { 1: 1, 3: 1, 6: 1, 8: 1, 10: 1 };
    const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const PAL = { bg: "#070710", lane: "#0b0b16", laneB: "#08080f", grid: "rgba(255,255,255,0.05)", beat: "rgba(255,255,255,0.12)", gutW: "#11131c", gutB: "#070709", gutText: "#5a6b88", note: "#05d9e8", noteSel: "#ff2a6d", head: "#39ff14" };

    function pianoRoll(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const steps = opts.steps || 32, lo = opts.lowPitch || 48, hi = opts.highPitch || 72;
        const px = opts.pxPerStep || 22, rh = opts.rowH || 14, group = opts.group || 4;
        let notes = (opts.notes || []).map((n) => ({ pitch: n.pitch, start: n.start, length: n.length || 1, vel: n.vel == null ? 1 : n.vel }));
        let playhead = opts.playhead == null ? -1 : opts.playhead;
        let selected = null;
        const rows = hi - lo + 1;

        const cv = document.createElement("canvas"); cv.className = "zg-pianoroll";
        cv.width = GUT + steps * px; cv.height = rows * rh;
        host.appendChild(cv);
        const ctx = cv.getContext("2d");
        const xOf = (s) => GUT + s * px;
        const yOf = (p) => (hi - p) * rh;
        const stepAt = (x) => Math.floor((x - GUT) / px);
        const pitchAt = (y) => hi - Math.floor(y / rh);

        function draw() {
            ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, cv.width, cv.height);
            for (let p = lo; p <= hi; p++) { const y = yOf(p); ctx.fillStyle = BLACK[((p % 12) + 12) % 12] ? PAL.laneB : PAL.lane; ctx.fillRect(GUT, y, cv.width - GUT, rh); ctx.strokeStyle = PAL.grid; ctx.beginPath(); ctx.moveTo(GUT, y + 0.5); ctx.lineTo(cv.width, y + 0.5); ctx.stroke(); }
            for (let s = 0; s <= steps; s++) { const x = xOf(s); ctx.strokeStyle = s % group === 0 ? PAL.beat : PAL.grid; ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, cv.height); ctx.stroke(); }
            notes.forEach((n) => { const x = xOf(n.start), y = yOf(n.pitch), w = Math.max(3, n.length * px - 1); ctx.fillStyle = n === selected ? PAL.noteSel : PAL.note; ctx.globalAlpha = 0.4 + 0.6 * n.vel; ctx.fillRect(x + 1, y + 1, w, rh - 2); ctx.globalAlpha = 1; ctx.strokeStyle = n === selected ? "#fff" : "rgba(0,0,0,0.5)"; ctx.beginPath(); ctx.rect(x + 1.5, y + 1.5, w - 1, rh - 3); ctx.stroke(); });
            // gutter keys
            for (let p = lo; p <= hi; p++) { const y = yOf(p), pc = ((p % 12) + 12) % 12; ctx.fillStyle = BLACK[pc] ? PAL.gutB : PAL.gutW; ctx.fillRect(0, y, GUT, rh); ctx.strokeStyle = PAL.grid; ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(GUT, y + 0.5); ctx.stroke(); if (pc === 0) { ctx.fillStyle = PAL.gutText; ctx.font = '8px "Share Tech Mono", monospace'; ctx.textBaseline = "middle"; ctx.fillText("C" + (Math.floor(p / 12) - 1), 4, y + rh / 2); } }
            if (playhead >= 0) { const hx = xOf(playhead); ctx.strokeStyle = PAL.head; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx, 0); ctx.lineTo(hx, cv.height); ctx.stroke(); ctx.lineWidth = 1; }
        }
        function noteAt(x, y) { const s = stepAt(x), p = pitchAt(y); for (let i = notes.length - 1; i >= 0; i--) { const n = notes[i]; if (n.pitch === p && s >= n.start && s < n.start + n.length) return n; } return null; }
        function pt(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / (r.width || 1) * cv.width, y: (e.clientY - r.top) / (r.height || 1) * cv.height }; }
        function emit() { if (typeof opts.onChange === "function") opts.onChange(notes.map((n) => ({ pitch: n.pitch, start: n.start, length: n.length, vel: n.vel }))); }

        let mode = null, grab = 0;
        cv.addEventListener("contextmenu", (e) => e.preventDefault());
        cv.addEventListener("pointerdown", (e) => {
            const p = pt(e); if (p.x < GUT) return;
            const hit = noteAt(p.x, p.y);
            if (e.button === 2) { if (hit) { notes.splice(notes.indexOf(hit), 1); selected = null; draw(); emit(); } return; }
            if (hit) { selected = hit; const rightX = xOf(hit.start + hit.length); if (Math.abs(p.x - rightX) <= EDGE) mode = "resize"; else { mode = "move"; grab = stepAt(p.x) - hit.start; } }
            else { const n = { pitch: pitchAt(p.y), start: Math.max(0, stepAt(p.x)), length: 1, vel: 0.9 }; notes.push(n); selected = n; mode = "move"; grab = 0; emit(); }
            try { cv.setPointerCapture(e.pointerId); } catch { /* */ }
            draw();
        });
        cv.addEventListener("pointermove", (e) => {
            if (!mode || !selected) return; const p = pt(e);
            if (mode === "resize") selected.length = Math.max(1, stepAt(p.x) - selected.start + 1);
            else { selected.start = Math.max(0, Math.min(steps - selected.length, stepAt(p.x) - grab)); selected.pitch = Math.max(lo, Math.min(hi, pitchAt(p.y))); }
            draw();
        });
        const end = (e) => { if (mode) emit(); mode = null; try { cv.releasePointerCapture(e.pointerId); } catch { /* */ } };
        cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);

        draw();
        return { el: cv, set(n) { notes = (n || []).map((x) => ({ pitch: x.pitch, start: x.start, length: x.length || 1, vel: x.vel == null ? 1 : x.vel })); selected = null; draw(); }, setPlayhead(s) { playhead = s; draw(); }, get() { return notes.slice(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.pianoRoll = pianoRoll;
})();
