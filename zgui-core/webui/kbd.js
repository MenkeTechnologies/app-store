// zgui-core/kbd.js — keyboard-key chips for shortcuts. window.ZGui.kbd.
//   ZGui.kbd('⌘K') or ZGui.kbd(['⌘','K']) -> <span class="zg-kbd-keys"> ;  ZGui.kbd.html(keys) -> string
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function keysOf(input) { return Array.isArray(input) ? input : String(input == null ? "" : input).split(/[\s+]+/).filter(Boolean); }
    function html(input) { return '<span class="zg-kbd-keys">' + keysOf(input).map((k) => "<kbd class=\"zg-kbd\">" + esc(k) + "</kbd>").join("") + "</span>"; }
    function kbd(input) { const span = document.createElement("span"); span.className = "zg-kbd-keys"; span.innerHTML = keysOf(input).map((k) => '<kbd class="zg-kbd">' + esc(k) + "</kbd>").join(""); return span; }
    kbd.html = html;
    window.ZGui = window.ZGui || {}; window.ZGui.kbd = kbd;
})();
