// zgui-core/sort-state.js — per-scope sort persistence, ported from Audio-Haxor's sort-persist.js.
// Saves/restores the last sort column + direction for any scoped table ("samples", "daw", …).
// The haxor file's restoreAllSortStates() bound a fixed set of globals; the generic core is just
// the scoped get/set pair (callers apply it to their own state). window.ZGui.sortState.
//
//   ZGui.sortState.save(scope, key, asc)      // persist {key, asc} under sort_<scope>
//   ZGui.sortState.restore(scope) -> {key, asc} | null
(function () {
    "use strict";
    const prefs = window.prefs || {
        getItem(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
        setItem(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (_) {} },
    };
    function save(scope, key, asc) { prefs.setItem("sort_" + scope, JSON.stringify({ key: key, asc: !!asc })); }
    function restore(scope) {
        const saved = prefs.getItem("sort_" + scope);
        if (!saved) return null;
        try { return JSON.parse(saved); } catch (_) { return null; }
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.sortState = { save: save, restore: restore };
})();
