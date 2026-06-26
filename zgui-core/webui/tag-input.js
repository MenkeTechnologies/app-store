// zgui-core/tag-input.js — a token / tag input: chips you can add (type + Enter) and remove (✕ or
// Backspace). window.ZGui.tagInput.   ZGui.tagInput({ tags:[], placeholder, onChange }) -> { el, get(), set(arr) }
(function () {
    "use strict";
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    function tagInput(opts) {
        opts = opts || {};
        let tags = (opts.tags || []).slice();
        const wrap = el("div", "zg-taginput");
        const input = el("input", "zg-taginput-field", null); input.placeholder = opts.placeholder || ""; input.spellcheck = false;
        function changed() { if (typeof opts.onChange === "function") opts.onChange(tags.slice()); }
        function render() {
            wrap.innerHTML = "";
            tags.forEach((t, i) => { const c = el("span", "zg-tag", wrap, t); const x = el("span", "zg-tag-x", c, "✕"); x.addEventListener("click", () => { tags.splice(i, 1); render(); changed(); }); });
            wrap.appendChild(input); input.focus();
        }
        function add(v) { v = (v || "").trim(); if (v && tags.indexOf(v) < 0) { tags.push(v); changed(); } input.value = ""; render(); }
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input.value); }
            else if (e.key === "Backspace" && !input.value && tags.length) { tags.pop(); render(); changed(); }
        });
        wrap.addEventListener("click", () => input.focus());
        render();
        return { el: wrap, get() { return tags.slice(); }, set(arr) { tags = (arr || []).slice(); render(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.tagInput = tagInput;
})();
