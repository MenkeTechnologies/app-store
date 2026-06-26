// zgui-core/confidence-field.js — an input whose value carries a confidence band: AI-suggested values
// show a confidence halo + bar; low confidence turns the field amber/red and surfaces a "review" prompt
// and an Accept action. An uncertainty-first input primitive. window.ZGui.confidenceField.
//   ZGui.confidenceField({ label, value, confidence:0..1, source, onChange(v), onAccept(v) }) ->
//       { el, input, set(value,confidence), getConfidence() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function level(c) { return c >= 0.8 ? "high" : c >= 0.5 ? "med" : "low"; }
    function confidenceField(opts) {
        opts = opts || {};
        let conf = opts.confidence == null ? 1 : opts.confidence;
        const root = document.createElement("div"); root.className = "zg-conffield";
        if (opts.label) { const l = document.createElement("label"); l.className = "zg-conffield-label"; l.textContent = opts.label; root.appendChild(l); }
        const wrap = document.createElement("div"); wrap.className = "zg-conffield-wrap";
        const input = document.createElement("input"); input.className = "zg-conffield-input"; input.value = opts.value == null ? "" : opts.value;
        const bar = document.createElement("div"); bar.className = "zg-conffield-bar"; const barFill = document.createElement("span"); bar.appendChild(barFill);
        wrap.appendChild(input); wrap.appendChild(bar); root.appendChild(wrap);
        const note = document.createElement("div"); note.className = "zg-conffield-note"; root.appendChild(note);

        function apply() {
            const lv = level(conf);
            root.dataset.level = lv;
            barFill.style.width = Math.round(conf * 100) + "%";
            if (lv === "high") note.innerHTML = `<span class="zg-conffield-pct">${Math.round(conf * 100)}% confident</span>${opts.source ? ` · ${esc(opts.source)}` : ""}`;
            else note.innerHTML = `<span class="zg-conffield-pct">${Math.round(conf * 100)}% — review${opts.source ? " · " + esc(opts.source) : ""}</span><button class="zg-conffield-accept">Accept</button>`;
            const acc = note.querySelector(".zg-conffield-accept"); if (acc) acc.addEventListener("click", () => { conf = 1; apply(); if (typeof opts.onAccept === "function") opts.onAccept(input.value); });
        }
        input.addEventListener("input", () => { conf = 1; apply(); if (typeof opts.onChange === "function") opts.onChange(input.value); });
        apply();
        return { el: root, input, set(v, c) { input.value = v == null ? "" : v; if (c != null) conf = c; apply(); }, getConfidence() { return conf; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.confidenceField = confidenceField;
})();
