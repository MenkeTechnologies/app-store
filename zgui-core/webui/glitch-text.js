// zgui-core/glitch-text.js — cyberpunk RGB-split glitch text. window.ZGui.glitchText.
//   ZGui.glitchText(text|el, { hover? }) -> HTMLElement   (hover:true = only glitch on hover)
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function glitchText(input, opts) {
        opts = opts || {};
        const el = (input && input.nodeType) ? input : document.createElement("span");
        const text = (input && input.nodeType) ? (input.textContent || "") : String(input == null ? "" : input);
        el.classList.add("zg-glitch");
        if (opts.hover) el.classList.add("zg-glitch-hover");
        el.setAttribute("data-text", text);
        el.textContent = text;
        return el;
    }
    window.ZGui = window.ZGui || {}; window.ZGui.glitchText = glitchText;
})();
