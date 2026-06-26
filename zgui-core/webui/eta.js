// zgui-core/eta.js — a tiny ETA / elapsed estimator for long operations (scans, exports, transfers,
// batch ops). Ported verbatim from Audio-Haxor's createETA. DOM-free: feed it progress, it returns
// human strings ("< 1s", "~45s", "~2m 5s") to drop next to a progress bar. window.ZGui.eta.
//
//   const e = ZGui.eta(); e.start();
//   bar.label = e.estimate(done, total);   // remaining, e.g. "~2m 5s"
//   foot.label = e.elapsed();              // since start, e.g. "1m 12s"
(function () {
    "use strict";
    const now = () => (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    function eta() {
        let startTime = 0;
        return {
            start() { startTime = now(); },
            estimate(processed, total) {
                if (!startTime || processed <= 0 || total <= 0) return "";
                const elapsed = (now() - startTime) / 1000;
                const rate = processed / elapsed;
                const remaining = (total - processed) / rate;
                if (remaining < 1) return "< 1s";
                if (remaining < 60) return "~" + Math.ceil(remaining) + "s";
                const mins = Math.floor(remaining / 60);
                const secs = Math.ceil(remaining % 60);
                return "~" + mins + "m " + secs + "s";
            },
            elapsed() {
                if (!startTime) return "";
                const secs = Math.floor((now() - startTime) / 1000);
                if (secs < 60) return secs + "s";
                return Math.floor(secs / 60) + "m " + (secs % 60) + "s";
            },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.eta = eta;
})();
