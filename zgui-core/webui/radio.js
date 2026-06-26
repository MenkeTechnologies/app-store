// zgui-core/radio.js — a radio-button group. window.ZGui.radio.
//   ZGui.radio(container, { options:[{value,label,desc?}], value, name, onChange }) -> { el, get, set }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    let _n = 0;
    function radio(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const name = opts.name || ("zg-radio-" + (++_n));
        let value = opts.value;
        host.classList.add("zg-radio-group");
        host.innerHTML = (opts.options || []).map((o) =>
            `<label class="zg-radio${o.value === value ? " checked" : ""}"><input type="radio" name="${esc(name)}" value="${esc(o.value)}"${o.value === value ? " checked" : ""}><span class="zg-radio-dot"></span><span class="zg-radio-body"><span class="zg-radio-label">${esc(o.label != null ? o.label : o.value)}</span>${o.desc ? `<span class="zg-radio-desc">${esc(o.desc)}</span>` : ""}</span></label>`
        ).join("");
        host.addEventListener("change", (e) => {
            const inp = e.target.closest('input[type="radio"]'); if (!inp) return;
            value = inp.value;
            host.querySelectorAll(".zg-radio").forEach((l) => l.classList.toggle("checked", l.querySelector("input").checked));
            if (typeof opts.onChange === "function") opts.onChange(value);
        });
        return { el: host, get() { return value; }, set(v) { value = v; host.querySelectorAll(".zg-radio").forEach((l) => { const c = l.querySelector("input").value === v; l.querySelector("input").checked = c; l.classList.toggle("checked", c); }); } };
    }
    window.ZGui = window.ZGui || {}; window.ZGui.radio = radio;
})();
