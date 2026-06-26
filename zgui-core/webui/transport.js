// zgui-core/transport.js — a media transport bar: prev / play-pause / next + loop + shuffle, a seek
// bar and a time readout. Controller only — the consumer wires it to their actual <audio>/<video>.
// Ported from Audio-Haxor's now-playing controls (.btn-play / .btn-loop): the play button glows green
// and flips to a flashing red while playing; loop & shuffle glow yellow when active. window.ZGui.transport.
//
//   ZGui.transport(container, { onPlay, onPause, onPrev, onNext, onSeek(frac), onLoop(bool),
//       onShuffle(bool), loop:true, shuffle:true })
//     -> { el, setPlaying(b), setLoop(b), setShuffle(b), setProgress(f), setTime(cur,dur), get() }
(function () {
    "use strict";
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    function fmt(s) { const u = window.ZGui && window.ZGui.util; if (u && u.formatDuration) return u.formatDuration(s); s = Math.floor(s || 0); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
    function transport(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        host.classList.add("zg-transport");
        const ctl = el("div", "zg-transport-ctl", host);
        const prev = el("button", "zg-transport-btn", ctl, "⏮"); prev.type = "button"; prev.title = "Previous";
        const play = el("button", "zg-transport-btn zg-transport-play", ctl, "▶"); play.type = "button"; play.title = "Play / Pause (Space)";
        const next = el("button", "zg-transport-btn", ctl, "⏭"); next.type = "button"; next.title = "Next";
        let loopBtn = null, shufBtn = null;
        if (opts.loop !== false) { loopBtn = el("button", "zg-transport-btn zg-transport-loop", ctl, "↺"); loopBtn.type = "button"; loopBtn.title = "Toggle loop (L)"; }
        if (opts.shuffle !== false) { shufBtn = el("button", "zg-transport-btn zg-transport-loop", ctl, "🔀"); shufBtn.type = "button"; shufBtn.title = "Shuffle (S)"; }
        const cur = el("span", "zg-transport-time", host, "0:00");
        const track = el("div", "zg-transport-seek", host);
        const fill = el("div", "zg-transport-fill", track);
        const handle = el("div", "zg-transport-handle", track);
        const dur = el("span", "zg-transport-time", host, "0:00");

        let playing = false, looping = false, shuffling = false;
        function setPlaying(p) { playing = !!p; play.textContent = playing ? "⏸" : "▶"; play.classList.toggle("playing", playing); }
        function setLoop(v) { looping = !!v; if (loopBtn) loopBtn.classList.toggle("active", looping); }
        function setShuffle(v) { shuffling = !!v; if (shufBtn) shufBtn.classList.toggle("active", shuffling); }
        play.addEventListener("click", () => { setPlaying(!playing); const cb = playing ? opts.onPlay : opts.onPause; if (typeof cb === "function") cb(); });
        prev.addEventListener("click", () => { if (typeof opts.onPrev === "function") opts.onPrev(); });
        next.addEventListener("click", () => { if (typeof opts.onNext === "function") opts.onNext(); });
        if (loopBtn) loopBtn.addEventListener("click", () => { setLoop(!looping); if (typeof opts.onLoop === "function") opts.onLoop(looping); });
        if (shufBtn) shufBtn.addEventListener("click", () => { setShuffle(!shuffling); if (typeof opts.onShuffle === "function") opts.onShuffle(shuffling); });

        function setProgress(f) { f = Math.max(0, Math.min(1, f || 0)); fill.style.width = (f * 100) + "%"; handle.style.left = (f * 100) + "%"; }
        function seekFrom(cx) { const r = track.getBoundingClientRect(); const f = Math.max(0, Math.min(1, (cx - r.left) / r.width)); setProgress(f); if (typeof opts.onSeek === "function") opts.onSeek(f); }
        let drag = false;
        track.addEventListener("pointerdown", (e) => { drag = true; try { track.setPointerCapture(e.pointerId); } catch { /* */ } seekFrom(e.clientX); });
        track.addEventListener("pointermove", (e) => { if (drag) seekFrom(e.clientX); });
        track.addEventListener("pointerup", () => { drag = false; });
        return {
            el: host, setPlaying, setLoop, setShuffle, setProgress,
            setTime(c, d) { cur.textContent = fmt(c); dur.textContent = fmt(d); if (d) setProgress(c / d); },
            get() { return { playing, looping, shuffling }; },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.transport = transport;
})();
