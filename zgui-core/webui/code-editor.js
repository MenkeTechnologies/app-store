// zgui-core/code-editor.js — a lightweight code editor: a monospace textarea with a synced
// line-number gutter (no 3rd-party dependency; for scripts/config/JSON where Monaco is overkill).
// window.ZGui.codeEditor.   ZGui.codeEditor(container, { value, onInput, readonly }) -> { el, get(), set(v) }
(function () {
    "use strict";
    function el(t, c, p) { const e = document.createElement(t); if (c) e.className = c; if (p) p.appendChild(e); return e; }
    function codeEditor(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        host.classList.add("zg-code");
        const gutter = el("div", "zg-code-gutter", host);
        const ta = el("textarea", "zg-code-ta", host); ta.spellcheck = false; ta.value = opts.value || ""; if (opts.readonly) ta.readOnly = true;
        function syncGutter() { const n = ta.value.split("\n").length; let s = ""; for (let i = 1; i <= n; i++) s += i + "\n"; gutter.textContent = s; gutter.scrollTop = ta.scrollTop; }
        ta.addEventListener("input", () => { syncGutter(); if (typeof opts.onInput === "function") opts.onInput(ta.value); });
        ta.addEventListener("scroll", () => { gutter.scrollTop = ta.scrollTop; });
        ta.addEventListener("keydown", (e) => { if (e.key === "Tab") { e.preventDefault(); const s = ta.selectionStart, en = ta.selectionEnd; ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(en); ta.selectionStart = ta.selectionEnd = s + 2; syncGutter(); } });
        syncGutter();
        return { el: host, get() { return ta.value; }, set(v) { ta.value = v == null ? "" : v; syncGutter(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.codeEditor = codeEditor;
})();
