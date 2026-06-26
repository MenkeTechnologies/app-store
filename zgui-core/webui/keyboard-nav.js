// zgui-core/keyboard-nav.js — vim-style keyboard navigation for lists/tables, distilled from
// Audio-Haxor's keyboard-nav.js. The GENERIC engine — movement (j/k, gg/G, Ctrl-D/U, Home/End),
// `.nav-selected` highlight, scrollIntoView, click re-anchoring. The per-tab item lists and the
// open/preview/reveal ACTIONS are the consumer's (items() + onActivate + onAction). window.ZGui.keyboardNav.
//
//   ZGui.keyboardNav.init({
//       items: () => HTMLElement[],     // navigable elements for the current context (required)
//       keyOf: (el) => string,          // identity for actions (default: dataset.path / data-*-path)
//       onActivate: (el, index) => {},  // Enter (and Space)
//       onSelect: (el, index) => {},    // fired on every move (e.g. preview/autoplay)
//       onAction: (key, el, id) => {},  // o/p/x/… single-key actions; 'y' defaults to copy(id)
//       pageSize: 15,                   // Ctrl-D / Ctrl-U jump
//       selectedClass: 'nav-selected',
//   }) -> { setIndex, index, selected, clear, reset }
//
// Built-ins consumers get free: 'y' yanks keyOf via ZGui.util.copyToClipboard; 'v' toggles a row
// `.batch-cb`; 'V' calls ZGui.table.batch select-all/deselect-all when present; '/' focuses a text input.
(function () {
    "use strict";

    let cfg = {};
    let navIndex = -1;
    let gPending = false, gTimer = null;

    function items() { return (cfg.items && cfg.items()) || []; }
    function selClass() { return cfg.selectedClass || "nav-selected"; }
    function keyOf(el) {
        if (cfg.keyOf) return cfg.keyOf(el);
        if (!el) return "";
        const ds = el.dataset || {};
        return ds.path || ds.audioPath || ds.dawPath || ds.presetPath || ds.midiPath || ds.pdfPath || ds.videoPath || ds.filePath || "";
    }

    function clear() { document.querySelectorAll("." + selClass()).forEach((el) => el.classList.remove(selClass())); }
    function setIndex(idx) {
        const list = items();
        if (!list.length) return;
        clear();
        navIndex = Math.max(0, Math.min(idx, list.length - 1));
        const el = list[navIndex];
        el.classList.add(selClass());
        if (el.scrollIntoView) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        if (typeof cfg.onSelect === "function") cfg.onSelect(el, navIndex);
    }
    function selected() { const list = items(); return navIndex >= 0 && navIndex < list.length ? list[navIndex] : null; }
    function anchorIfUnset() {
        if (navIndex >= 0) return;
        const sel = document.querySelector("." + selClass());
        const list = items();
        if (sel && list.includes(sel)) navIndex = list.indexOf(sel);
    }

    function activate() {
        const el = selected();
        if (el && typeof cfg.onActivate === "function") cfg.onActivate(el, navIndex);
    }
    function action(key) {
        const el = selected();
        if (!el) return;
        const id = keyOf(el);
        if (key === "y") {
            const util = window.ZGui && window.ZGui.util;
            if (id && util) util.copyToClipboard(id, "Copied");
            return;
        }
        if (typeof cfg.onAction === "function") cfg.onAction(key, el, id);
    }

    function onKeydown(e) {
        const t = e.target;
        if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return;
        if (t.isContentEditable || (t.closest && t.closest("[contenteditable]"))) return;
        if (t.closest && t.closest(".ctx-menu")) return;
        const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform || "");
        const mod = isMac ? e.metaKey : e.ctrlKey;
        if (mod && e.key.startsWith("Arrow")) return; // leave Cmd/Ctrl+Arrow to the app

        const list = items();
        if (gPending) {
            gPending = false; clearTimeout(gTimer);
            if (e.key === "g") { e.preventDefault(); setIndex(0); return; }
        }
        if (e.key === "ArrowDown" || (e.key === "j" && !e.metaKey && !e.ctrlKey)) { e.preventDefault(); anchorIfUnset(); setIndex(navIndex + 1); }
        else if (e.key === "ArrowUp" || (e.key === "k" && !e.metaKey && !e.ctrlKey)) { e.preventDefault(); anchorIfUnset(); setIndex(navIndex - 1); }
        else if (e.key === "Home") { e.preventDefault(); setIndex(0); }
        else if (e.key === "End" || e.key === "G") { e.preventDefault(); setIndex(list.length - 1); }
        else if (e.key === "g" && !e.metaKey && !e.ctrlKey) { gPending = true; gTimer = setTimeout(() => { gPending = false; }, 500); }
        else if (e.key === "d" && e.ctrlKey) { e.preventDefault(); anchorIfUnset(); setIndex(navIndex + (cfg.pageSize || 15)); }
        else if (e.key === "u" && e.ctrlKey) { e.preventDefault(); anchorIfUnset(); setIndex(navIndex - (cfg.pageSize || 15)); }
        else if (e.key === "Enter") { if (list.length) { anchorIfUnset(); if (navIndex >= 0) { e.preventDefault(); activate(); } } }
        else if (e.key === " ") { if (e.defaultPrevented || !list.length) return; anchorIfUnset(); if (navIndex >= 0) { e.preventDefault(); activate(); } }
        else if (e.key === "/") {
            e.preventDefault();
            const scope = document.querySelector(".tab-content.active") || document;
            const input = scope.querySelector('input[type="text"]');
            if (input) { input.focus(); input.select && input.select(); }
        }
        else if (e.key === "v") {
            if (e.defaultPrevented) return;
            e.preventDefault(); anchorIfUnset();
            const el = selected();
            const cb = el && el.querySelector(".batch-cb");
            if (cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event("change", { bubbles: true })); }
        }
        else if (e.key === "V") {
            e.preventDefault();
            const batch = window.ZGui && window.ZGui.table && window.ZGui.table.batch;
            if (batch) { if (batch.count() > 0) batch.deselectAll(); else batch.selectAllVisible(); }
        }
        else if (e.key && e.key.length === 1 && !e.metaKey && !e.ctrlKey && /[a-z]/.test(e.key)) {
            // o / p / x / etc. -> consumer action (y handled in action()).
            if (e.defaultPrevented) return;
            e.preventDefault(); anchorIfUnset();
            action(e.key);
        }
    }

    function onClick(e) {
        const t = e.target;
        if (!t || t.nodeType !== 1) return;
        if (t.isContentEditable || (t.closest && t.closest("[contenteditable], .ctx-menu"))) return;
        if (t.tagName === "TEXTAREA" || t.tagName === "SELECT") return;
        if (t.tagName === "INPUT" && !(t.classList.contains("batch-cb") && t.type === "checkbox")) return;
        const list = items();
        let row = null;
        for (const el of list) { if (el.contains(t)) { row = el; break; } }
        if (!row) return;
        clear();
        navIndex = list.indexOf(row);
        row.classList.add(selClass());
    }

    function init(opts) {
        cfg = opts || {};
        if (init._done) return;
        init._done = true;
        document.addEventListener("keydown", onKeydown, true);
        document.addEventListener("click", onClick, true);
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.keyboardNav = {
        init: init,
        setIndex: setIndex,
        index() { return navIndex; },
        selected: selected,
        clear: clear,
        reset() { navIndex = -1; clear(); },
    };
})();
