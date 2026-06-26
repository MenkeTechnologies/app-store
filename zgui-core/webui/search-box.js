// zgui-core/search-box.js — a search input: a 🔍 icon, a cyan-glow text field, an optional regex
// toggle (magenta when active) and a clear button. Ported from Audio-Haxor's .search-box / .search-icon
// / .btn-regex. Controller only — wire onInput to your filter. window.ZGui.searchBox.
//   ZGui.searchBox(container, { placeholder, value, regex:true, regexOn:false,
//       onInput(value, {regex}), onRegex(bool), onClear }) ->
//       { el, input, get(), set(v), getRegex(), setRegex(b), focus() }
(function () {
    "use strict";
    function searchBox(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let regexOn = !!opts.regexOn;

        const root = document.createElement("div"); root.className = "zg-searchbox";
        const icon = document.createElement("span"); icon.className = "zg-searchbox-icon"; icon.textContent = "🔍";
        const input = document.createElement("input"); input.type = "text"; input.className = "zg-searchbox-input";
        input.placeholder = opts.placeholder || "Search…"; if (opts.value) input.value = opts.value;
        const clear = document.createElement("button"); clear.type = "button"; clear.className = "zg-searchbox-clear"; clear.textContent = "✕"; clear.title = "Clear";
        root.appendChild(icon); root.appendChild(input); root.appendChild(clear);
        let regexBtn = null;
        if (opts.regex !== false) {
            regexBtn = document.createElement("button"); regexBtn.type = "button"; regexBtn.className = "zg-searchbox-regex"; regexBtn.textContent = ".*"; regexBtn.title = "Regex match";
            regexBtn.classList.toggle("active", regexOn);
            root.appendChild(regexBtn);
        }
        host.appendChild(root);

        function syncClear() { clear.style.display = input.value ? "" : "none"; }
        function emit() { if (typeof opts.onInput === "function") opts.onInput(input.value, { regex: regexOn }); }
        input.addEventListener("input", () => { syncClear(); emit(); });
        clear.addEventListener("click", () => { input.value = ""; syncClear(); input.focus(); if (typeof opts.onClear === "function") opts.onClear(); emit(); });
        if (regexBtn) regexBtn.addEventListener("click", () => { regexOn = !regexOn; regexBtn.classList.toggle("active", regexOn); if (typeof opts.onRegex === "function") opts.onRegex(regexOn); emit(); });

        syncClear();
        return {
            el: root, input,
            get() { return input.value; },
            set(v) { input.value = v == null ? "" : v; syncClear(); },
            getRegex() { return regexOn; },
            setRegex(b) { regexOn = !!b; if (regexBtn) regexBtn.classList.toggle("active", regexOn); },
            focus() { input.focus(); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.searchBox = searchBox;
})();
