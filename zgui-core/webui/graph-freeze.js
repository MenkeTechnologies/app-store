// zgui-core/graph-freeze.js — per-canvas freeze state for live graphs, distilled from Audio-Haxor's
// graph-freeze.js. Any animated canvas (FFT, oscilloscope, EQ, meters, charts) checks isFrozen(id) in
// its rAF loop and skips redraw when frozen — so freezing is PER graph, not one global pause. State is
// a JSON map persisted in prefs, and every change fires a `graph-freeze-changed` CustomEvent so toggle
// buttons / overlays can react. The app supplies its own id strings. window.ZGui.graphFreeze.
//
//   ZGui.graphFreeze.isFrozen(id) -> bool
//   ZGui.graphFreeze.setFrozen(id, on)        // persist + dispatch graph-freeze-changed {id, frozen}
//   ZGui.graphFreeze.toggle(id) -> bool        // flip, returns new state
//   ZGui.graphFreeze.all() -> { id: true, … }  // the live freeze map
(function () {
    "use strict";
    const PREF_KEY = "graphFreezeMap";
    const prefs = window.prefs || {
        getItem(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
        setItem(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (_) {} },
    };
    function read() {
        try {
            const raw = prefs.getItem(PREF_KEY);
            if (!raw) return {};
            const o = typeof raw === "string" ? JSON.parse(raw) : raw;
            return o && typeof o === "object" && !Array.isArray(o) ? o : {};
        } catch (_) { return {}; }
    }
    function write(m) { prefs.setItem(PREF_KEY, JSON.stringify(m)); }
    function isFrozen(id) { return !!id && read()[id] === true; }
    function setFrozen(id, on) {
        if (!id) return;
        const m = read();
        if (on) m[id] = true; else delete m[id];
        write(m);
        try { document.dispatchEvent(new CustomEvent("graph-freeze-changed", { detail: { id: id, frozen: !!on } })); } catch (_) { /* no DOM */ }
    }
    function toggle(id) { setFrozen(id, !isFrozen(id)); return isFrozen(id); }
    window.ZGui = window.ZGui || {};
    window.ZGui.graphFreeze = { isFrozen: isFrozen, setFrozen: setFrozen, toggle: toggle, all: read };
})();
