// zgui-core/highlight.js — wrap occurrences of a query (string or list) in <mark> within a text run.
// Ported behavior from Mantine's <Highlight>. window.ZGui.highlight.
//   ZGui.highlight(text, query, { caseSensitive:false }) -> HTMLSpanElement
(function () {
    "use strict";
    function esc(s) { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
    function highlight(text, query, opts) {
        opts = opts || {};
        const span = document.createElement("span"); span.className = "zg-highlight";
        const terms = (Array.isArray(query) ? query : [query]).filter((q) => q != null && q !== "").map(String);
        const str = String(text == null ? "" : text);
        if (!terms.length) { span.textContent = str; return span; }
        const flags = opts.caseSensitive ? "g" : "gi";
        const re = new RegExp("(" + terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", flags);
        span.innerHTML = esc(str).replace(re, '<mark class="zg-hl">$1</mark>');
        return span;
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.highlight = highlight;
})();
