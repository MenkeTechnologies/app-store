// zgui-core/shortcuts.js — the global keyboard-shortcut registry: load/persist a shortcut map,
// match keydowns, render a click-to-rebind settings panel, and format a shortcut for display.
// Distilled from Audio-Haxor's shortcuts.js — the GENERIC engine only. The specific shortcut IDs
// and their actions are the consumer's (passed as `defaults` + handled in `onAction`).
// window.ZGui.shortcuts.
//
//   ZGui.shortcuts.init({
//       defaults: { id: { key, mod?, shift?, label } },   // key: 'k' | 'ArrowRight' | ' ' | 'F3' …
//       onAction: (id, event) => {},                       // fired when a shortcut matches
//       storageKey: 'customShortcuts',
//   })
//   ZGui.shortcuts.get() / .save(map) / .reset()
//   ZGui.shortcuts.formatKey(sc)            -> '⌘K' | 'Ctrl+Shift+→' | 'Space' …
//   ZGui.shortcuts.match(event)             -> id | null
//   ZGui.shortcuts.renderSettings(container, filter)   // click a key chip → press to rebind
//
// Host may define window.prefs and window.showToast. Filtering uses ZGui.fzf when present.
(function () {
    "use strict";

    const prefs = window.prefs || (window.prefs = {
        getObject(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
        setItem(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch { /* quota */ } },
        removeItem(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
    });
    const esc = window.escapeHtml || function (s) {
        const d = document.createElement("div");
        d.textContent = s == null ? "" : String(s);
        return d.innerHTML;
    };
    function toast(msg) { if (typeof window.showToast === "function") window.showToast(msg); }
    const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform || "");

    let DEFAULTS = {};
    let STORAGE = "customShortcuts";
    let ON_ACTION = function () {};
    let recordingId = null;

    // ── registry ──
    function get() {
        const saved = prefs.getObject(STORAGE, null);
        const merged = {};
        for (const [id, def] of Object.entries(DEFAULTS)) {
            merged[id] = { key: def.key, mod: !!def.mod, label: def.label || id };
            if (def.shift !== undefined) merged[id].shift = def.shift;
            if (saved && saved[id]) {
                merged[id].key = saved[id].key;
                merged[id].mod = !!saved[id].mod;
                if (saved[id].shift !== undefined) merged[id].shift = saved[id].shift;
            }
        }
        return merged;
    }
    function save(shortcuts) {
        const slim = {};
        for (const [id, sc] of Object.entries(shortcuts)) {
            slim[id] = { key: sc.key, mod: !!sc.mod };
            if (sc.shift !== undefined) slim[id].shift = sc.shift;
        }
        prefs.setItem(STORAGE, slim);
    }
    function reset() { prefs.removeItem(STORAGE); renderSettingsAll(); toast("Shortcuts reset"); }

    // ── key normalization + matching ──
    function normStored(k) { return k === "Space" || k === " " ? " " : k; }
    function eventKey(e) { return (e.code === "Space" || e.key === " " || e.key === "Space") ? " " : e.key; }
    function normMatch(k) {
        const n = normStored(k);
        if (n === "+" || n === "=") return "+";
        if (n.length === 1 && /[A-Za-z]/.test(n)) return n.toLowerCase();
        return n;
    }
    function shiftMatches(sc, e) {
        if (sc.shift === true) return e.shiftKey === true;
        if (sc.shift === false) { if (normMatch(sc.key) === "?") return true; return e.shiftKey === false; }
        return true;
    }
    function match(e) {
        const mod = isMac ? e.metaKey : e.ctrlKey;
        const ek = normMatch(eventKey(e));
        const shortcuts = get();
        for (const [id, sc] of Object.entries(shortcuts)) {
            if (normMatch(sc.key) !== ek) continue;
            if (!!sc.mod !== mod) continue;
            if (!shiftMatches(sc, e)) continue;
            return id;
        }
        return null;
    }

    function formatKey(sc) {
        const parts = [];
        if (sc.mod) parts.push(isMac ? "⌘" : "Ctrl");
        if (sc.shift === true) parts.push(isMac ? "⇧" : "Shift");
        let k = sc.key;
        const map = { " ": "Space", ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓", Escape: "Esc" };
        if (map[k]) k = map[k];
        else if (k === "Enter" || k === "\\" || k === "`" || k === "," || k === ".") { /* literal */ }
        else k = k.toUpperCase();
        parts.push(k);
        return parts.join("+");
    }

    // ── rebind settings UI ──
    let _containers = [];
    function renderSettings(container, filter) {
        const list = typeof container === "string" ? document.querySelector(container) : container;
        if (!list) return;
        if (!_containers.includes(list)) _containers.push(list);
        const shortcuts = get();
        const q = (filter || "").trim();
        const fz = window.ZGui && window.ZGui.fzf;
        let entries;
        if (!q) {
            entries = Object.entries(shortcuts);
        } else if (fz) {
            entries = [];
            for (const [id, sc] of Object.entries(shortcuts)) {
                const m = fz.fzfMatch(q, sc.label) || fz.fzfMatch(q, formatKey(sc));
                if (m) entries.push([id, sc, m.score]);
            }
            entries.sort((a, b) => b[2] - a[2]);
        } else {
            entries = Object.entries(shortcuts).filter(([, sc]) => (sc.label || "").toLowerCase().includes(q.toLowerCase()));
        }
        const hl = (q && fz) ? (t) => fz.highlightMatch(t, q) : (t) => esc(t);
        list.innerHTML = entries.map(([id, sc]) =>
            `<div class="shortcut-row" data-sc-id="${esc(id)}">
              <span class="shortcut-name">${hl(sc.label)}</span>
              <span class="shortcut-key" data-shortcut-id="${esc(id)}" title="Click to rebind">${q ? hl(formatKey(sc)) : esc(formatKey(sc))}</span>
            </div>`).join("");
    }
    function renderSettingsAll() { _containers.forEach((c) => { if (c.isConnected) renderSettings(c); }); }

    function startRecording(keyEl) {
        document.querySelectorAll(".shortcut-key.recording").forEach((el) => el.classList.remove("recording"));
        recordingId = keyEl.dataset.shortcutId;
        keyEl.classList.add("recording");
        keyEl.textContent = "Press a key…";
    }
    function recordKey(e) {
        let k = eventKey(e);
        if (k.length === 1 && /[a-zA-Z]/.test(k)) k = k.toLowerCase();
        if (k === "=" || k === "+") k = "+";
        return k;
    }

    function init(opts) {
        opts = opts || {};
        DEFAULTS = opts.defaults || {};
        STORAGE = opts.storageKey || "customShortcuts";
        ON_ACTION = typeof opts.onAction === "function" ? opts.onAction : function () {};
        if (init._done) return;
        init._done = true;

        document.addEventListener("click", function (e) {
            const keyEl = e.target.closest(".shortcut-key");
            if (keyEl && keyEl.dataset.shortcutId) { startRecording(keyEl); e.stopPropagation(); return; }
            if (e.target.closest('[data-action="resetShortcuts"]')) reset();
        });

        document.addEventListener("keydown", function (e) {
            // Recording a rebind takes priority over dispatch.
            if (recordingId) {
                e.preventDefault(); e.stopPropagation();
                if (e.key === "Escape") { recordingId = null; renderSettingsAll(); return; }
                if (["Meta", "Control", "Shift", "Alt"].includes(e.key)) return;
                const shortcuts = get();
                shortcuts[recordingId] = { ...shortcuts[recordingId], key: recordKey(e), mod: isMac ? e.metaKey : e.ctrlKey, shift: e.shiftKey };
                save(shortcuts);
                recordingId = null;
                renderSettingsAll();
                toast("Shortcut updated");
                return;
            }
            // Dispatch (skip when typing, except let the consumer decide via onAction if it wants).
            const t = e.target;
            if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return;
            if (t.isContentEditable || (t.closest && t.closest("[contenteditable], .ctx-menu"))) return;
            const id = match(e);
            if (id) { e.preventDefault(); ON_ACTION(id, e); }
        }, true);
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.shortcuts = { init: init, get: get, save: save, reset: reset, formatKey: formatKey, match: match, renderSettings: renderSettings };
})();
