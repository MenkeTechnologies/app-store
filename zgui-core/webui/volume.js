// zgui-core/volume.js — a volume control: a mute toggle button + a horizontal slider with a glowing
// cyan thumb. Ported from Audio-Haxor's now-playing volume (.now-playing-volume / .volume-slider +
// the mute button). Controller only — the consumer wires onChange/onMute to their audio element.
// window.ZGui.volumeControl.
//   ZGui.volumeControl(container, { value:0..100, muted:false, onChange(v), onMute(bool) }) ->
//       { el, get(), set(v), setMuted(b), getMuted() }
(function () {
    "use strict";
    function volumeControl(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let value = opts.value == null ? 80 : opts.value;
        let muted = !!opts.muted;

        const root = document.createElement("div"); root.className = "zg-volume";
        const btn = document.createElement("button"); btn.type = "button"; btn.className = "zg-volume-mute"; btn.title = "Mute / Unmute (M)";
        const slider = document.createElement("input"); slider.type = "range"; slider.className = "zg-volume-slider"; slider.min = "0"; slider.max = "100"; slider.value = String(value);
        root.appendChild(btn); root.appendChild(slider); host.appendChild(root);

        function icon() { btn.textContent = muted || value === 0 ? "🔇" : value < 45 ? "🔉" : "🔊"; }
        function syncMutedUi() { root.classList.toggle("is-muted", muted); slider.disabled = muted; icon(); }
        function setMuted(b) { muted = !!b; syncMutedUi(); }
        btn.addEventListener("click", () => { setMuted(!muted); if (typeof opts.onMute === "function") opts.onMute(muted); });
        slider.addEventListener("input", () => { value = +slider.value; if (muted && value > 0) setMuted(false); icon(); if (typeof opts.onChange === "function") opts.onChange(value); });

        syncMutedUi();
        return {
            el: root,
            get() { return value; },
            set(v) { value = Math.max(0, Math.min(100, v | 0)); slider.value = String(value); icon(); },
            setMuted, getMuted() { return muted; },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.volumeControl = volumeControl;
})();
