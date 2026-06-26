// zgui-core/combobox.js — a searchable/autocomplete select (type to filter, fzf-ranked via ZGui.fzf
// when present). Distilled from zreq's `.ss` searchSelect. window.ZGui.combobox.
//
//   ZGui.combobox({ options:[{value,label}|[value,label]], value, placeholder, onChange, free }) -> { el, get(), set(v) }
//   `free:true` allows a typed value not in the list.
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    function norm(o) { return (o || []).map((x) => Array.isArray(x) ? { value: x[0], label: x[1] } : (typeof x === "string" ? { value: x, label: x } : x)); }
    function combobox(opts) {
        opts = opts || {};
        const options = norm(opts.options);
        let value = opts.value != null ? opts.value : null;
        const wrap = el("div", "zg-combo");
        const input = el("input", "zs-input zg-combo-input", wrap); input.type = "text"; input.placeholder = opts.placeholder || ""; input.autocomplete = "off"; input.spellcheck = false;
        const list = el("div", "zg-combo-list", wrap); list.style.display = "none";
        function labelOf(v) { const o = options.find((x) => x.value === v); return o ? o.label : (opts.free ? v : ""); }
        input.value = value != null ? labelOf(value) : "";
        function render() {
            const q = input.value.trim();
            const fz = window.ZGui && window.ZGui.fzf;
            let items = options;
            if (q && fz) items = options.map((o) => { const m = fz.fzfMatch(q, o.label); return m ? { o, s: m.score } : null; }).filter(Boolean).sort((a, b) => b.s - a.s).map((x) => x.o);
            else if (q) items = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
            list.innerHTML = "";
            items.slice(0, 100).forEach((o) => {
                const row = el("div", "zg-combo-row", list);
                row.innerHTML = (q && fz) ? fz.highlightMatch(o.label, q) : esc(o.label);
                row.addEventListener("mousedown", (e) => { e.preventDefault(); pick(o.value, o.label); });
            });
            list.style.display = items.length ? "block" : "none";
        }
        function pick(v, lbl) { value = v; input.value = lbl != null ? lbl : labelOf(v); list.style.display = "none"; if (typeof opts.onChange === "function") opts.onChange(v); }
        input.addEventListener("focus", render);
        input.addEventListener("input", () => { render(); if (opts.free) value = input.value; });
        input.addEventListener("blur", () => setTimeout(() => { list.style.display = "none"; if (!opts.free && value != null) input.value = labelOf(value); }, 120));
        return { el: wrap, get() { return value; }, set(v) { value = v; input.value = labelOf(v); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.combobox = combobox;
})();
