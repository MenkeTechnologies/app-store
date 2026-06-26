// zgui-core/help-overlay.js — the `?`-key keyboard-shortcut reference overlay, genericized
// from Audio-Haxor's help-overlay.js (which hardcoded audio-domain shortcuts). Here the consumer
// supplies the sections; the core owns the modal chrome, the platform-aware key formatter, and the
// `?` keybinding. Built on ZGui.modal. window.ZGui.helpOverlay.
//
//   sections: [{ title, rows: [{ keys, label }] }]
//     keys: string | string[]   — each entry rendered as a <kbd>. Use ZGui.helpOverlay.mod()
//                                  to render a platform-aware ⌘/Ctrl combo.
//
//   ZGui.helpOverlay.open(sections) / .close() / .toggle(sections)
//   ZGui.helpOverlay.bind(sectionsOrFn)   // wire the `?` key (Shift+/), fn may return sections
//   ZGui.helpOverlay.mod('K')  -> '⌘K' on mac, 'Ctrl+K' elsewhere (for building `keys`)
(function () {
    "use strict";

    const esc = window.escapeHtml || function (s) {
        const d = document.createElement("div");
        d.textContent = s == null ? "" : String(s);
        return d.innerHTML;
    };

    const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform || navigator.userAgent || "");
    function mod(key) { return isMac ? "⌘" + key : "Ctrl+" + key; }

    let current = null;

    function kbd(keys) {
        const list = Array.isArray(keys) ? keys : [keys];
        return list.map(function (k) { return `<kbd>${esc(k)}</kbd>`; }).join(" ");
    }

    function rowsHtml(rows) {
        return (rows || []).map(function (r) {
            return `<div class="help-row">${kbd(r.keys)} <span>${esc(r.label)}</span></div>`;
        }).join("");
    }

    function bodyHtml(sections) {
        return `<div class="help-grid">${(sections || []).map(function (s) {
            return `<div class="help-section"><h3>${esc(s.title)}</h3>${rowsHtml(s.rows)}</div>`;
        }).join("")}</div>`;
    }

    function open(sections) {
        close();
        const modal = window.ZGui && window.ZGui.modal;
        if (!modal) return null;
        current = modal.open({
            title: "Keyboard Shortcuts",
            className: "help-overlay-modal",
            body: bodyHtml(sections),
            onClose: function () { current = null; },
        });
        return current;
    }
    function close() { if (current) current.close(); current = null; }
    function toggle(sections) { if (current) close(); else open(sections); }

    function bind(sectionsOrFn) {
        document.addEventListener("keydown", function (e) {
            if (e.key !== "?" || e.metaKey || e.ctrlKey || e.altKey) return;
            const tag = (e.target && e.target.tagName) || "";
            if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (e.target && e.target.isContentEditable)) return;
            e.preventDefault();
            const sections = typeof sectionsOrFn === "function" ? sectionsOrFn() : sectionsOrFn;
            toggle(sections);
        });
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.helpOverlay = { open: open, close: close, toggle: toggle, bind: bind, mod: mod };
    if (!window.toggleHelpOverlay) window.toggleHelpOverlay = function () { toggle(window.__helpSections || []); };
})();
