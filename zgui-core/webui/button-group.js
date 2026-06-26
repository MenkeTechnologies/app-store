// zgui-core/button-group.js — a joined row of buttons with single- or multi-select. window.ZGui.buttonGroup.
//   ZGui.buttonGroup({ buttons:[{value,label,icon?}], value, multi?, onChange }) -> { el, get, set }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function buttonGroup(opts) {
        opts = opts || {};
        const multi = !!opts.multi;
        let value = multi ? new Set(opts.value || []) : opts.value;
        const el = document.createElement("div");
        el.className = "zg-btngroup";
        function active(v) { return multi ? value.has(v) : value === v; }
        function render() {
            el.innerHTML = (opts.buttons || []).map((b) =>
                `<button type="button" class="zg-btngroup-btn${active(b.value) ? " active" : ""}" data-val="${esc(b.value)}">${b.icon ? `<span class="zg-btngroup-ic">${b.icon}</span>` : ""}${esc(b.label != null ? b.label : b.value)}</button>`
            ).join("");
        }
        el.addEventListener("click", (e) => {
            const btn = e.target.closest(".zg-btngroup-btn"); if (!btn) return;
            const v = btn.dataset.val;
            if (multi) { if (value.has(v)) value.delete(v); else value.add(v); }
            else value = v;
            render();
            if (typeof opts.onChange === "function") opts.onChange(multi ? [...value] : value);
        });
        render();
        return { el, get() { return multi ? [...value] : value; }, set(v) { value = multi ? new Set(v || []) : v; render(); } };
    }
    window.ZGui = window.ZGui || {}; window.ZGui.buttonGroup = buttonGroup;
})();
