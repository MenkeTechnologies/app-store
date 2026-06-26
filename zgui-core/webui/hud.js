// zgui-core/hud.js — header / HUD display components, distilled from Audio-Haxor's app header:
// a telemetry strip (label·value metrics), headline diamond-stats (big neon numbers), a floating
// "now playing"-style pill, and a value→heat colorizer. window.ZGui.{statStrip, headlineStats,
// playingPill, heatColor}.
//
//   ZGui.statStrip(container, [{label, value}])           -> { el, set(items) }   // CORES 18 · CPU 50% · …
//   ZGui.headlineStats(container, [{value, label, color}])-> { el, set(stats) }    // ◆ 2,680 PLUGINS FOUND
//   ZGui.playingPill({ label, onClick })                  -> { el, show, hide, setLabel }
//   ZGui.heatColor(value, { min, max, invert }) -> rgb string   // low=red … high=green (invert flips)
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });

    function statStrip(container, items) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        host.classList.add("zg-stat-strip");
        function set(list) {
            host.innerHTML = (list || []).map((it) =>
                '<span class="zg-stat-item">' + esc(it.label || "") + '<span class="zg-stat-item-value">' + esc(it.value == null ? "" : it.value) + "</span></span>"
            ).join("");
        }
        set(items);
        return { el: host, set: set };
    }

    function headlineStats(container, stats) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        host.classList.add("zg-headline-stats");
        function set(list) {
            host.innerHTML = (list || []).map((s) => {
                const dot = '<span class="zg-headline-dot" style="background:' + esc(s.color || "var(--cyan)") + '"></span>';
                return '<div class="zg-headline-stat">' + dot
                    + '<span class="zg-headline-value" style="color:' + esc(s.color || "var(--cyan)") + '">' + esc(s.value == null ? "" : s.value) + "</span>"
                    + '<span class="zg-headline-label">' + esc(s.label || "") + "</span></div>";
            }).join("");
        }
        set(stats);
        return { el: host, set: set };
    }

    function playingPill(opts) {
        opts = opts || {};
        const el = document.createElement("div");
        el.className = "zg-playing-pill";
        el.textContent = opts.label || "♫ Playing";
        if (typeof opts.onClick === "function") { el.style.cursor = "pointer"; el.addEventListener("click", opts.onClick); }
        document.body.appendChild(el);
        return {
            el: el,
            show() { el.classList.add("active"); },
            hide() { el.classList.remove("active"); },
            setLabel(t) { el.textContent = t; },
        };
    }

    // Map value's position in [min,max] to a cold→hot color. Default: low value = red (bad), high = green.
    // invert: high value = red. Returns an `rgb(r,g,b)` string.
    function heatColor(value, opts) {
        opts = opts || {};
        const min = opts.min == null ? 0 : opts.min, max = opts.max == null ? 1 : opts.max;
        let t = (Number(value) - min) / ((max - min) || 1);
        t = Math.max(0, Math.min(1, t));
        if (opts.invert) t = 1 - t;
        // red (t=0) -> yellow (0.5) -> green (t=1)
        const r = t < 0.5 ? 255 : Math.round(255 * (1 - (t - 0.5) * 2));
        const g = t > 0.5 ? 255 : Math.round(255 * (t * 2));
        return "rgb(" + r + "," + g + ",60)";
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.statStrip = statStrip;
    window.ZGui.headlineStats = headlineStats;
    window.ZGui.playingPill = playingPill;
    window.ZGui.heatColor = heatColor;
})();
