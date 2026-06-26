// zgui-core/stack-bar.js — a stacked horizontal PROPORTION bar (segments sum to 100%) + optional
// legend with per-segment size/%. The "rainbow %bar" from Audio-Haxor's disk-usage / format-breakdown
// (.disk-bar / .disk-segment). Colours are set via a data-kind attribute (NOT inline CSS vars), which
// release WebKit renders reliably. window.ZGui.stackBar.   Pairs with stack-bar.css.
//   ZGui.stackBar({ segments:[{label, value, size?, kind?}], legend?, total? }) -> { el, set(segments) }
//   value = weight; size = display string (e.g. "28 GB"); kind = cyan|accent|green|yellow|magenta|orange|muted.
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    const KINDS = ["cyan", "accent", "green", "yellow", "magenta", "orange", "muted"];

    function stackBar(opts) {
        opts = opts || {};
        const el = document.createElement("div");
        el.className = "zg-stack";
        const bar = document.createElement("div");
        bar.className = "zg-stack-bar";
        el.appendChild(bar);
        let legendEl = null;
        if (opts.legend !== false) { legendEl = document.createElement("div"); legendEl.className = "zg-stack-legend"; el.appendChild(legendEl); }

        function set(segments) {
            segments = segments || [];
            const total = opts.total != null ? opts.total : (segments.reduce((a, s) => a + (s.value || 0), 0) || 1);
            bar.innerHTML = segments.map((s, i) => {
                const kind = s.kind || KINDS[i % KINDS.length], pct = (s.value || 0) / total * 100;
                return `<div class="zg-stack-seg" data-kind="${esc(kind)}" style="width:${pct.toFixed(4)}%" title="${esc(s.label)}: ${esc(s.size || "")} (${pct.toFixed(1)}%)"></div>`;
            }).join("");
            if (legendEl) {
                legendEl.innerHTML = segments.filter((s) => (s.value || 0) > 0).map((s) => {
                    const i = segments.indexOf(s), kind = s.kind || KINDS[i % KINDS.length], pct = ((s.value || 0) / total * 100).toFixed(1);
                    return `<span class="zg-stack-litem"><span class="zg-stack-dot" data-kind="${esc(kind)}"></span>${esc(s.label)} <span class="zg-stack-size">${esc(s.size || "")} (${pct}%)</span></span>`;
                }).join("");
            }
        }
        set(opts.segments);
        return { el, set };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.stackBar = stackBar;
})();
