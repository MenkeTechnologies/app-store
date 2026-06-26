// zgui-core/input-group.js — an input flanked by prefix/suffix addons (icon, text, or button).
// window.ZGui.inputGroup.
//   ZGui.inputGroup({ prefix?, suffix?, placeholder?, value?, type?, onInput?, onSuffixClick? }) -> { el, input, get, set }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function addon(side, html, onClick) {
        const a = document.createElement("span");
        a.className = "zg-ig-addon zg-ig-" + side + (onClick ? " zg-ig-btn" : "");
        a.innerHTML = html;
        if (onClick) a.addEventListener("click", onClick);
        return a;
    }
    function inputGroup(opts) {
        opts = opts || {};
        const el = document.createElement("div");
        el.className = "zg-ig";
        if (opts.prefix != null) el.appendChild(addon("prefix", opts.prefix));
        const input = document.createElement("input");
        input.className = "zg-ig-input zs-input";
        input.type = opts.type || "text";
        if (opts.placeholder) input.placeholder = opts.placeholder;
        if (opts.value != null) input.value = opts.value;
        if (typeof opts.onInput === "function") input.addEventListener("input", () => opts.onInput(input.value, input));
        el.appendChild(input);
        if (opts.suffix != null) el.appendChild(addon("suffix", opts.suffix, opts.onSuffixClick));
        return { el, input, get() { return input.value; }, set(v) { input.value = v; } };
    }
    window.ZGui = window.ZGui || {}; window.ZGui.inputGroup = inputGroup;
})();
