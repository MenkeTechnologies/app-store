// zgui-core/progress.js — a standalone progress bar (determinate 0..1 or indeterminate). Distinct
// from toast.progress (top-of-window) and meter (audio level). window.ZGui.progress.
//
//   const p = ZGui.progress({ value:0.4, label, indeterminate:false }); p.set(0.8); p.indeterminate(true);
(function () {
    "use strict";
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    const clamp01 = (n) => Math.min(1, Math.max(0, n));
    function progress(opts) {
        opts = opts || {};
        const wrap = el("div", "zg-progress");
        const track = el("div", "zg-progress-track", wrap);
        const fill = el("div", "zg-progress-fill", track);
        let label = null; if (opts.label != null) label = el("div", "zg-progress-label", wrap, opts.label);
        function set(v) { wrap.classList.remove("indeterminate"); fill.style.width = (clamp01(v) * 100).toFixed(1) + "%"; }
        function indeterminate(on) { wrap.classList.toggle("indeterminate", !!on); if (on) fill.style.width = ""; }
        if (opts.indeterminate) indeterminate(true); else set(opts.value || 0);
        return { el: wrap, set, indeterminate, setLabel(t) { if (label) label.textContent = t; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.progress = progress;
})();
