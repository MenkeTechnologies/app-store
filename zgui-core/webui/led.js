// zgui-core/led.js — a hardware-style LED indicator that glows when lit, and a label+LED toggle row.
// Ported from zpwr-patch-core's .led / .toggle-row (the synth bypass/enable rows). window.ZGui.led /
// window.ZGui.ledToggle.
//   ZGui.led({ on:false, color:'cyan', size:14 }) -> { el, set(on), setColor(c) }
//   ZGui.ledToggle({ label, on:false, color:'cyan', onChange(on) }) -> { el, get(), set(on), toggle() }
(function () {
    "use strict";
    const COLORS = ["cyan", "green", "orange", "yellow", "magenta", "red"];
    function led(opts) {
        opts = opts || {};
        const dot = document.createElement("span");
        dot.className = "zg-led";
        let color = COLORS.indexOf(opts.color) >= 0 ? opts.color : "cyan";
        dot.dataset.color = color;
        if (opts.size) { dot.style.width = opts.size + "px"; dot.style.height = opts.size + "px"; }
        function set(on) { dot.classList.toggle("on", !!on); }
        set(opts.on);
        return { el: dot, set, setColor(c) { if (COLORS.indexOf(c) >= 0) { color = c; dot.dataset.color = c; } } };
    }
    function ledToggle(opts) {
        opts = opts || {};
        const row = document.createElement("label");
        row.className = "zg-toggle-row";
        const label = document.createElement("span"); label.textContent = opts.label || "";
        const lamp = led({ on: opts.on, color: opts.color });
        row.appendChild(label); row.appendChild(lamp.el);
        let on = !!opts.on;
        function set(v) { on = !!v; row.classList.toggle("on", on); lamp.set(on); }
        set(on);
        row.addEventListener("click", (e) => { e.preventDefault(); set(!on); if (typeof opts.onChange === "function") opts.onChange(on); });
        return { el: row, get() { return on; }, set, toggle() { set(!on); return on; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.led = led;
    window.ZGui.ledToggle = ledToggle;
})();
