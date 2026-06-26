// zgui-core/statistic.js — a single numeric statistic: title + big formatted value with optional
// prefix/suffix and a colored up/down trend. Ported behavior from Ant Design's <Statistic> (title,
// value, precision, prefix, suffix) plus its common trend pattern and Statistic.Countdown.
// window.ZGui.statistic.
//   ZGui.statistic({ title, value, precision, prefix, suffix, trend:'up'|'down', trendValue, kind,
//       group:false }) -> { el, set(value), setTrend(dir, val) }
//   ZGui.statistic.countdown({ title, deadline, format:'D:H:M:S', onFinish }) -> { el, stop() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
    function fmt(v, precision) {
        if (v == null || v === "") return "";
        const n = typeof v === "number" ? v : parseFloat(v);
        if (!isFinite(n)) return String(v);
        const s = precision != null ? n.toFixed(precision) : String(n);
        const parts = s.split("."); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }

    function statistic(opts) {
        opts = opts || {};
        const root = el("div", "zg-stat");
        if (opts.kind) root.dataset.kind = opts.kind;
        const title = el("div", "zg-stat-title"); title.textContent = opts.title || "";
        const valRow = el("div", "zg-stat-value");
        const pre = el("span", "zg-stat-prefix"); pre.innerHTML = opts.prefix != null ? esc(opts.prefix) : "";
        const num = el("span", "zg-stat-num"); num.textContent = fmt(opts.value, opts.precision);
        const suf = el("span", "zg-stat-suffix"); suf.innerHTML = opts.suffix != null ? esc(opts.suffix) : "";
        valRow.appendChild(pre); valRow.appendChild(num); valRow.appendChild(suf);
        const trend = el("span", "zg-stat-trend");
        root.appendChild(title); root.appendChild(valRow); root.appendChild(trend);

        function setTrend(dir, val) {
            if (!dir) { trend.style.display = "none"; return; }
            trend.style.display = "";
            trend.className = "zg-stat-trend " + (dir === "down" ? "is-down" : "is-up");
            trend.textContent = (dir === "down" ? "▼ " : "▲ ") + (val != null ? val : "");
        }
        setTrend(opts.trend, opts.trendValue);
        return { el: root, set(v) { num.textContent = fmt(v, opts.precision); }, setTrend };
    }

    function countdown(opts) {
        opts = opts || {};
        const root = el("div", "zg-stat");
        if (opts.kind) root.dataset.kind = opts.kind;
        const title = el("div", "zg-stat-title"); title.textContent = opts.title || "";
        const num = el("div", "zg-stat-value"); num.classList.add("zg-stat-num");
        root.appendChild(title); root.appendChild(num);
        const deadline = opts.deadline || 0;
        const pad = (n, w) => String(n).padStart(w || 2, "0");
        function tick() {
            const ms = Math.max(0, deadline - Date.now());
            const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
            const out = (opts.format || "H:M:S").replace("D", pad(d)).replace("H", pad(h)).replace("M", pad(m)).replace("S", pad(s));
            num.textContent = out;
            if (ms <= 0) { clearInterval(timer); if (typeof opts.onFinish === "function") opts.onFinish(); }
        }
        const timer = setInterval(tick, 1000); tick();
        return { el: root, stop() { clearInterval(timer); } };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.statistic = statistic;
    window.ZGui.statistic.countdown = countdown;
})();
