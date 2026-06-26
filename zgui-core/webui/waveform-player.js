// zgui-core/waveform-player.js — an interactive waveform player: a peaks waveform (rendered via
// ZGui.viz.waveform) with a draggable PLAYHEAD (click/drag to seek), a progress fill, draggable LOOP
// BRACES (A/B region) and a time readout. Ported from Audio-Haxor's crate/now-playing waveform
// (renderWaveformData + .waveform-progress-fill/-cursor/-loop-brace + initMetaLoopPaintDrag). Interaction
// is faithful: click/drag = seek; SHIFT+drag = rubber-band a loop region; a plain click right of the loop
// end exits the region; drag a brace to nudge start/end; the "L" toggle (top-left, .waveform-loop-toggle)
// flips the region on/off and turns yellow while active. The consumer wires onSeek/onLoop to their actual
// <audio>/engine. onLoop fires {start,end,enabled}. window.ZGui.waveformPlayer. Pairs with waveform-player.css.
//   ZGui.waveformPlayer({ peaks?, progress?, loop?, time?, onSeek, onLoop }) ->
//       { el, canvas, setPeaks(p), setProgress(f), setLoop(s,e), showLoop(on), setTime(t), get() }
//   peaks: {min,max}[] (−1..1) or number[]. progress/loop.start/loop.end are 0..1. onSeek(frac)/onLoop({start,end}).
(function () {
    "use strict";
    function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }
    const clamp01 = (v) => Math.min(1, Math.max(0, v));

    function waveformPlayer(opts) {
        opts = opts || {};
        const root = el("div", "zg-wave");
        const canvas = el("canvas", "zg-wave-canvas", root);
        canvas.width = opts.width || 600; canvas.height = opts.height || 64;
        const region = el("div", "zg-wave-region", root);
        const fill = el("div", "zg-wave-fill", root);
        const bStart = el("div", "zg-wave-brace zg-wave-brace-start", root); bStart.dataset.brace = "start";
        const bEnd = el("div", "zg-wave-brace zg-wave-brace-end", root); bEnd.dataset.brace = "end";
        const cursor = el("div", "zg-wave-cursor", root);
        const timeEl = el("div", "zg-wave-time", root);
        if (opts.time) timeEl.textContent = opts.time;
        // the "L" loop-region toggle (top-left), faithful to Audio-Haxor's .waveform-loop-toggle —
        // flips the region on/off, goes yellow (.active) while a region is showing.
        let loopToggle = null;
        if (opts.loopToggle !== false) { loopToggle = el("button", "zg-wave-loop-toggle", root); loopToggle.type = "button"; loopToggle.textContent = "L"; loopToggle.title = "Toggle loop region"; }

        let progress = opts.progress || 0;
        const loop = { start: opts.loop ? clamp01(opts.loop.start) : 0.25, end: opts.loop ? clamp01(opts.loop.end) : 0.75 };
        let loopOn = !!opts.loop;
        let peaks = opts.peaks || null;
        const ctx = canvas.getContext("2d");

        function drawPeaks() { if (window.ZGui && window.ZGui.viz && window.ZGui.viz.waveform) window.ZGui.viz.waveform(ctx, canvas.width, canvas.height, peaks || []); }
        function place() {
            cursor.style.left = (progress * 100) + "%";
            fill.style.width = (progress * 100) + "%";
            const show = loopOn ? "" : "none";
            region.style.display = show; bStart.style.display = show; bEnd.style.display = show;
            if (loopToggle) loopToggle.classList.toggle("active", loopOn);
            if (loopOn) {
                region.style.left = (loop.start * 100) + "%";
                region.style.right = (100 - loop.end * 100) + "%";
                bStart.style.left = (loop.start * 100) + "%";
                bEnd.style.left = (loop.end * 100) + "%";
            }
        }
        function fracOf(e) { const r = root.getBoundingClientRect(); return clamp01((e.clientX - r.left) / (r.width || 1)); }
        const MIN_GAP = 0.005;   // Haxor's minimum loop-region width
        function emitLoop() { if (typeof opts.onLoop === "function") opts.onLoop({ start: loop.start, end: loop.end, enabled: loopOn }); }

        // the "L" toggle flips the region on/off (Haxor toggleLoopRegionForPath); the region's
        // start/end persist across toggles, so it just re-shows the last region.
        if (loopToggle) loopToggle.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); loopOn = !loopOn; place(); emitLoop(); });

        // Body interaction, faithful to Audio-Haxor (audio.js initMetaLoopPaintDrag + maybeExitLoopOnRightClickFrac):
        //   · SHIFT+drag paints a loop region (rubber-band): anchor at pointerdown, start/end follow the
        //     drag symmetrically with a MIN_GAP floor, and the region is enabled live.
        //   · a plain click to the RIGHT of the loop end exits (disables) the region, then seeks.
        //   · otherwise plain click/drag seeks.
        let seeking = false, painting = false, anchorFrac = 0;
        root.addEventListener("pointerdown", (e) => {
            if (e.target === bStart || e.target === bEnd) return;   // braces consume their own drag
            const f = fracOf(e);
            if (e.shiftKey) {
                painting = true; anchorFrac = f; loopOn = true;
                loop.start = f; loop.end = Math.min(1, f + MIN_GAP);
                try { root.setPointerCapture(e.pointerId); } catch { /* */ }
                place(); emitLoop(); e.preventDefault(); return;
            }
            if (loopOn && f > loop.end + 0.001) { loopOn = false; place(); emitLoop(); }   // exit loop on right click
            seeking = true; try { root.setPointerCapture(e.pointerId); } catch { /* */ }
            progress = f; place(); if (typeof opts.onSeek === "function") opts.onSeek(progress); e.preventDefault();
        });
        root.addEventListener("pointermove", (e) => {
            if (painting) {
                const f = fracOf(e);
                if (f >= anchorFrac) { loop.start = anchorFrac; loop.end = Math.max(f, anchorFrac + MIN_GAP); }
                else { loop.start = f; loop.end = Math.max(anchorFrac, f + MIN_GAP); }
                loopOn = true; place(); emitLoop(); return;
            }
            if (seeking) { progress = fracOf(e); place(); if (typeof opts.onSeek === "function") opts.onSeek(progress); }
        });
        const endBody = (e) => { seeking = false; painting = false; try { root.releasePointerCapture(e.pointerId); } catch { /* */ } };
        root.addEventListener("pointerup", endBody); root.addEventListener("pointercancel", endBody);

        // loop-brace drag
        function dragBrace(b, which) {
            let on = false;
            b.addEventListener("pointerdown", (e) => { on = true; try { b.setPointerCapture(e.pointerId); } catch { /* */ } e.stopPropagation(); e.preventDefault(); });
            b.addEventListener("pointermove", (e) => {
                if (!on) return;
                const f = fracOf(e);
                if (which === "start") loop.start = Math.min(f, loop.end); else loop.end = Math.max(f, loop.start);
                place(); emitLoop();
            });
            const end = (e) => { on = false; try { b.releasePointerCapture(e.pointerId); } catch { /* */ } };
            b.addEventListener("pointerup", end); b.addEventListener("pointercancel", end);
        }
        dragBrace(bStart, "start"); dragBrace(bEnd, "end");

        drawPeaks(); place();
        return {
            el: root, canvas,
            setPeaks(p) { peaks = p; drawPeaks(); },
            setProgress(f) { progress = clamp01(f); place(); },
            setLoop(s, e) { loop.start = clamp01(s); loop.end = clamp01(e); place(); },
            showLoop(on) { loopOn = !!on; place(); },
            toggleLoop() { loopOn = !loopOn; place(); emitLoop(); return loopOn; },
            setTime(t) { timeEl.textContent = t == null ? "" : t; },
            get() { return { progress, loop: { start: loop.start, end: loop.end }, loopOn }; },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.waveformPlayer = waveformPlayer;
})();
