// zgui-core/timeline-ruler.js — a bars/beats ruler with a draggable playhead and a loop region. Click
// to seek, shift-drag to set the loop. Core DAW timeline header. window.ZGui.timelineRuler.
//   ZGui.timelineRuler(container, { bars:32, beatsPerBar:4, pxPerBar:40, playhead:0, loop:{start,end},
//       height:26, onSeek(bar), onLoop({start,end}) }) -> { el, setPlayhead(bar), setLoop(s,e), get() }
(function () {
    "use strict";
    const PAL = { bg: "#06060e", line: "rgba(255,255,255,0.12)", beat: "rgba(255,255,255,0.05)", text: "#7a8ba8", head: "#05d9e8", loop: "rgba(255,230,0,0.14)" };
    function timelineRuler(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const bars = opts.bars || 32, bpb = opts.beatsPerBar || 4, pxBar = opts.pxPerBar || 40, H = opts.height || 26;
        let playhead = opts.playhead || 0;
        let loop = opts.loop ? { start: opts.loop.start, end: opts.loop.end } : null;

        const cv = document.createElement("canvas"); cv.className = "zg-ruler";
        cv.width = bars * pxBar; cv.height = H; cv.style.height = H + "px";
        host.appendChild(cv);
        const ctx = cv.getContext("2d");

        function draw() {
            ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, cv.width, H);
            if (loop) { ctx.fillStyle = PAL.loop; ctx.fillRect(loop.start * pxBar, 0, (loop.end - loop.start) * pxBar, H); }
            ctx.font = '9px "Share Tech Mono", monospace'; ctx.textBaseline = "top";
            for (let b = 0; b <= bars; b++) {
                const x = b * pxBar;
                ctx.strokeStyle = PAL.line; ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke();
                ctx.fillStyle = PAL.text; ctx.fillText(String(b + 1), x + 3, 3);
                for (let bt = 1; bt < bpb; bt++) { const bx = x + (bt / bpb) * pxBar; ctx.strokeStyle = PAL.beat; ctx.beginPath(); ctx.moveTo(bx + 0.5, H * 0.55); ctx.lineTo(bx + 0.5, H); ctx.stroke(); }
            }
            const px = playhead * pxBar;
            ctx.strokeStyle = PAL.head; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke(); ctx.lineWidth = 1;
            ctx.fillStyle = PAL.head; ctx.beginPath(); ctx.moveTo(px - 4, 0); ctx.lineTo(px + 4, 0); ctx.lineTo(px, 6); ctx.closePath(); ctx.fill();
        }
        function barAt(clientX) { const r = cv.getBoundingClientRect(); return Math.max(0, ((clientX - r.left) / (r.width || 1)) * cv.width / pxBar); }

        let painting = false, anchor = 0;
        cv.addEventListener("pointerdown", (e) => {
            const bar = barAt(e.clientX);
            if (e.shiftKey) { painting = true; anchor = bar; loop = { start: bar, end: bar + 0.01 }; try { cv.setPointerCapture(e.pointerId); } catch { /* */ } draw(); }
            else { playhead = bar; draw(); if (typeof opts.onSeek === "function") opts.onSeek(playhead); }
        });
        cv.addEventListener("pointermove", (e) => { if (!painting) return; const bar = barAt(e.clientX); loop = { start: Math.min(anchor, bar), end: Math.max(anchor, bar) }; draw(); if (typeof opts.onLoop === "function") opts.onLoop({ start: loop.start, end: loop.end }); });
        cv.addEventListener("pointerup", (e) => { painting = false; try { cv.releasePointerCapture(e.pointerId); } catch { /* */ } });

        draw();
        return { el: cv, setPlayhead(b) { playhead = b; draw(); }, setLoop(s, e) { loop = { start: s, end: e }; draw(); }, get() { return { playhead, loop }; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.timelineRuler = timelineRuler;
})();
