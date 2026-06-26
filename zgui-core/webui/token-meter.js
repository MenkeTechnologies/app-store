// zgui-core/token-meter.js — a live token/cost burn meter for an LLM operation: a used/budget bar with
// warn & over thresholds, the token count, an optional $cost and a burn-rate readout. window.ZGui.tokenMeter.
//   ZGui.tokenMeter({ used:0, budget, costPerK, warn:0.75, label:'tokens', rate }) ->
//       { el, set(used), setRate(tps), setBudget(b) }
(function () {
    "use strict";
    function fmt(n) { if (n == null) return "0"; if (n < 1000) return String(n); if (n < 1e6) return (n / 1000).toFixed(1) + "k"; return (n / 1e6).toFixed(2) + "M"; }
    function tokenMeter(opts) {
        opts = opts || {};
        let used = opts.used || 0, budget = opts.budget || null, rate = opts.rate || null;
        const warn = opts.warn == null ? 0.75 : opts.warn;
        function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
        const root = el("div", "zg-tokmeter");
        const top = el("div", "zg-tokmeter-top"); const count = el("span", "zg-tokmeter-count");
        top.appendChild(el("span", "zg-tokmeter-label", opts.label || "tokens")); top.appendChild(count);
        const bar = el("div", "zg-tokmeter-bar"); const fill = el("span", "zg-tokmeter-fill"); bar.appendChild(fill);
        const sub = el("div", "zg-tokmeter-sub");
        root.appendChild(top); root.appendChild(bar); root.appendChild(sub);

        function apply() {
            const frac = budget ? Math.min(1, used / budget) : 0;
            count.textContent = fmt(used) + (budget ? " / " + fmt(budget) : "");
            fill.style.width = (budget ? frac * 100 : 100) + "%";
            root.dataset.state = budget && frac >= 1 ? "over" : budget && frac >= warn ? "warn" : "ok";
            const bits = [];
            if (opts.costPerK) bits.push("$" + (used / 1000 * opts.costPerK).toFixed(3));
            if (rate != null) bits.push(fmt(rate) + " tok/s");
            if (budget) bits.push(Math.round(frac * 100) + "%");
            sub.textContent = bits.join(" · ");
        }
        apply();
        return { el: root, set(u) { used = u; apply(); }, setRate(r) { rate = r; apply(); }, setBudget(b) { budget = b; apply(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.tokenMeter = tokenMeter;
})();
