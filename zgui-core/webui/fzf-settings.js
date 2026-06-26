// zgui-core/fzf-settings.js — the live tuning panel for the fzf scoring weights, ported from
// Audio-Haxor's renderFzfSettings. The fzf engine (fzf.js) owns the weights, their defaults, and
// [min,max] bounds; this builds a `.settings-row` grid of number inputs over them, writes each edit
// back through ZGui.fzf.setParam (scoring updates live + persists), and offers a reset. The rows are
// drag-reorderable via ZGui.drag when present. window.ZGui.fzf.settingsPanel.
//
//   ZGui.fzf.settingsPanel(container, { reorder:true, onChange(key, value) }) -> { el, refresh() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    // Humanize SCREAMING_SNAKE -> "Score Match" for a fallback label when no i18n catalog is present.
    function human(key) { return key.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }
    const t = (k, d, v) => (window.ZGui && window.ZGui.i18n) ? window.ZGui.i18n.t(d || k, v) : (d || k);

    function settingsPanel(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        const fzf = window.ZGui && window.ZGui.fzf;
        if (!host || !fzf) return null;
        opts = opts || {};

        function render() {
            const w = fzf.weights, defs = fzf.defaults || {}, bounds = fzf.bounds || {};
            const keys = Object.keys(w);
            host.classList.add("zg-fzf-settings");
            host.innerHTML = keys.map((key) => {
                const b = bounds[key] || [0, 50];
                const val = w[key];
                const label = t("ui.fzf." + key.toLowerCase() + ".label", human(key));
                const def = defs[key];
                const title = def != null ? esc(label) + " (default: " + def + ")" : esc(label);
                return '<div class="settings-row" data-fzf-row="' + esc(key) + '">'
                    + '<div class="settings-label"><span class="settings-title">' + esc(label) + "</span></div>"
                    + '<div class="settings-control">'
                    + '<input type="number" class="settings-input" data-fzf-param="' + esc(key) + '" value="' + val + '" min="' + b[0] + '" max="' + b[1] + '" step="1" title="' + title + '"></div></div>';
            }).join("")
                + '<div class="settings-row zg-fzf-reset-row"><button type="button" class="zs-btn zg-fzf-reset">' + esc(t("ui.fzf.reset", "Reset weights")) + "</button></div>";
            if (opts.reorder !== false && window.ZGui.drag && typeof window.ZGui.drag.init === "function") {
                window.ZGui.drag.init(host, ".settings-row[data-fzf-row]", "fzfParamOrder", {
                    getKey: (el) => (el.querySelector("[data-fzf-param]") || {}).dataset && el.querySelector("[data-fzf-param]").dataset.fzfParam || "",
                });
            }
        }

        host.addEventListener("input", (e) => {
            const inp = e.target.closest && e.target.closest("[data-fzf-param]");
            if (!inp) return;
            const key = inp.dataset.fzfParam;
            fzf.setParam(key, inp.value);
            if (typeof opts.onChange === "function") opts.onChange(key, Number(inp.value));
        });
        host.addEventListener("click", (e) => {
            if (!e.target.closest || !e.target.closest(".zg-fzf-reset")) return;
            if (typeof fzf.resetFzfParams === "function") fzf.resetFzfParams();
            render();
            if (typeof opts.onChange === "function") opts.onChange(null, null);
        });

        render();
        return { el: host, refresh: render };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.fzf = window.ZGui.fzf || {};
    window.ZGui.fzf.settingsPanel = settingsPanel;
})();
