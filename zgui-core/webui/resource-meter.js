// zgui-core/resource-meter.js — a compact resource readout (CPU / RAM / any metric) with warn/hot
// color thresholds. Ported from zpwr-patch-core's .cpu-meter / .ram-meter header chips. window.ZGui.resourceMeter.
//   ZGui.resourceMeter({ label:'CPU', value, unit:'%', warn:70, hot:90, kind:'cpu'|'ram' }) ->
//       { el, set(value), setText(s) }
//   kind 'cpu' applies warn/hot thresholds (amber → red glow); 'ram' is informational (magenta, no thresholds).
(function () {
    "use strict";
    function resourceMeter(opts) {
        opts = opts || {};
        const kind = opts.kind === "ram" ? "ram" : "cpu";
        const el = document.createElement("span");
        el.className = "zg-resmeter zg-resmeter-" + kind;
        const label = opts.label || (kind === "ram" ? "RAM" : "CPU");
        const unit = opts.unit != null ? opts.unit : (kind === "ram" ? "" : "%");
        const warn = opts.warn == null ? 70 : opts.warn;
        const hot = opts.hot == null ? 90 : opts.hot;

        function set(v) {
            if (v == null) { el.textContent = label + " --"; el.classList.remove("warn", "hot"); return; }
            el.textContent = label + " " + v + unit;
            if (kind === "cpu") { el.classList.toggle("hot", v >= hot); el.classList.toggle("warn", v >= warn && v < hot); }
        }
        set(opts.value);
        return { el, set, setText(s) { el.textContent = s; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.resourceMeter = resourceMeter;
})();
