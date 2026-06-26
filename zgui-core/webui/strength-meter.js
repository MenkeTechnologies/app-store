// zgui-core/strength-meter.js — a zoned strength / quality bar (e.g. password strength,
// signal quality, score). A single bar divided into N segments that light up to the current
// level, colored by zone. Distinct from `progress` (continuous 0..1), `stat-bars` (categories)
// and `gauge` (radial dial). window.ZGui.strengthMeter.
//   ZGui.strengthMeter({ level, segments?, labels?, label? }) -> { el, set(level) }
//     `level`: 0..segments (0 = empty). Default zones: weak→red, medium→yellow/accent, strong→green.
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function strengthMeter(opts) {
        opts = opts || {};
        const count = opts.segments || 4;
        const labels = opts.labels || ["Weak", "Fair", "Good", "Strong"];
        // per-segment zone color (low → high)
        const zoneColor = (lvl) => {
            const r = lvl / count;
            if (r <= 0.34) return "var(--red)";
            if (r <= 0.67) return "var(--accent)";
            return "var(--green)";
        };
        const el = document.createElement("div");
        el.className = "zg-strength";
        const bar = document.createElement("div");
        bar.className = "zg-strength-bar";
        const segs = [];
        for (let i = 0; i < count; i++) {
            const s = document.createElement("div");
            s.className = "zg-strength-seg";
            bar.appendChild(s);
            segs.push(s);
        }
        const text = document.createElement("span");
        text.className = "zg-strength-label";
        el.appendChild(bar);
        if (opts.label !== false) el.appendChild(text);

        function set(level) {
            level = Math.max(0, Math.min(count, level | 0));
            const color = zoneColor(level);
            segs.forEach((s, i) => {
                const on = i < level;
                s.classList.toggle("on", on);
                s.style.background = on ? color : "";
                s.style.boxShadow = on ? "0 0 6px " + color : "";
            });
            text.textContent = opts.label === false ? "" : esc(level === 0 ? "—" : (labels[Math.min(level - 1, labels.length - 1)] || ""));
            text.style.color = level === 0 ? "var(--text-muted)" : color;
        }
        set(opts.level || 0);
        return { el, set };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.strengthMeter = strengthMeter;
})();
