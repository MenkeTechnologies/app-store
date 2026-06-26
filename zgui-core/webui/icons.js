// zgui-core/icons.js — the central icon registry. Until now every component hardcoded inline
// unicode glyphs / HTML entities (✕, ▾, 📁, ▶ …) scattered across files. This collects the glyphs
// ACTUALLY in use across the apps (harvested by frequency, not invented) under semantic names, so
// icons are consistent and swappable in one place (e.g. trade unicode for SVG later). window.ZGui.icon.
//
//   ZGui.icon('close')            -> '✕'                       (the glyph string; use in templates)
//   ZGui.icon.el('close', {cls})  -> <span class="zg-icon …">✕</span>
//   ZGui.icon.has('close')        -> boolean
//   ZGui.icon.register({ name: '☷' })   // add / override
(function () {
    "use strict";

    // name -> glyph. Drawn from the most-used HTML entities across the suite (counts in comments).
    const ICONS = {
        close: "✕",        // ✕  (×104)
        copy: "📋",   // 📋 (×99)
        folder: "📁", // 📁 (×95)
        folderOpen: "📂", // 📂 (×27)
        play: "▶",         // ▶  (×50)
        pause: "❚❚",  // ❚❚ pause
        stop: "■",         // ■  (×25)
        file: "📄",   // 📄 (×50)
        note: "📝",   // 📝 (×24)
        music: "🎵",  // 🎵 (×23)
        headphones: "🎧", // 🎧 (×26)
        starFilled: "★",   // ★  (×48)
        starEmpty: "☆",    // ☆  (×24)
        bolt: "⚡",         // ⚡ (×41)
        search: "🔍", // 🔍 (×28)
        trash: "🗑",  // 🗑 (×25)
        download: "↧",     // ↧  (×24)
        reload: "↻",       // ↻  (×30)
        loop: "↺",         // ↺  (×24)
        check: "✓",        // ✓  (×16)
        caretDown: "▾",    // ▾
        caretUp: "▴",      // ▴
        caretRight: "▸",   // ▸
        caretLeft: "◂",    // ◂
        triangleDown: "▼", // ▼  (×30)
        triangleUp: "▲",   // ▲  (×17)
        chevron: "›",      // ›  (breadcrumb separator)
        chevronLeft: "‹",  // ‹
        diamond: "◆",      // ◆
        gear: "⚙",         // ⚙
        plus: "+",         // +
        minus: "−",        // −
        arrowRight: "→",   // →
        arrowLeft: "←",    // ←
        arrowUp: "↑",      // ↑
        arrowDown: "↓",    // ↓
        cmd: "⌘",          // ⌘
        shift: "⇧",        // ⇧
        enter: "⏎",        // ⏎
    };

    function icon(name) {
        return Object.prototype.hasOwnProperty.call(ICONS, name) ? ICONS[name] : "";
    }
    icon.el = function (name, opts) {
        opts = opts || {};
        const e = document.createElement("span");
        e.className = "zg-icon" + (opts.cls ? " " + opts.cls : "");
        e.setAttribute("aria-hidden", "true");
        e.textContent = icon(name);
        return e;
    };
    icon.has = function (name) { return Object.prototype.hasOwnProperty.call(ICONS, name); };
    icon.register = function (map) { Object.assign(ICONS, map || {}); };
    icon.names = function () { return Object.keys(ICONS); };

    window.ZGui = window.ZGui || {};
    window.ZGui.icon = icon;
})();
