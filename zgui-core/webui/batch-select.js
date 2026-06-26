// zgui-core/batch-select.js — the per-scope row-selection ENGINE, distilled from Audio-Haxor's
// batch-select.js. The haxor file layered favorites/export/reveal/inventory-pool resolution on top
// of a small selection core; only that core is generic. Tracks a Set of keys per scope, wires
// `.zg-batch-cb` row checkboxes + a `.zg-batch-cb-all` header checkbox, and fires onChange with the
// live set. Domain actions (export, favorite, …) stay in the app. window.ZGui.batchSelect.
//
//   const b = ZGui.batchSelect(container, {
//       rowSelector:  '.zg-batch-cb',      // per-row checkbox
//       allSelector:  '.zg-batch-cb-all',  // header select-all checkbox (optional)
//       keyOf(row),                        // -> string key for a row element (default: dataset.key/path)
//       onChange(set, scope),              // fired whenever the selection changes
//       scope: 'default',                  // selection bucket; switch with setScope()
//   })
//   -> { selected(): Set, count(): number, clear(), selectAllVisible(), setScope(s), destroy() }
(function () {
    "use strict";
    function defaultKeyOf(row) {
        if (!row) return null;
        return (row.dataset && (row.dataset.key || row.dataset.path)) || null;
    }
    function rowOf(cb) { return cb.closest("tr") || cb.closest("[data-batch-row]") || cb.parentElement; }

    function batchSelect(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const rowSel = opts.rowSelector || ".zg-batch-cb";
        const allSel = opts.allSelector || ".zg-batch-cb-all";
        const keyOf = typeof opts.keyOf === "function" ? opts.keyOf : defaultKeyOf;
        const buckets = new Map();
        let scope = opts.scope || "default";

        function set() { if (!buckets.has(scope)) buckets.set(scope, new Set()); return buckets.get(scope); }
        function fire() {
            const headers = host.querySelectorAll(allSel);
            const cbs = host.querySelectorAll(rowSel);
            const allChecked = cbs.length > 0 && [...cbs].every((c) => c.checked);
            headers.forEach((h) => { h.checked = allChecked; });
            if (typeof opts.onChange === "function") opts.onChange(set(), scope);
        }
        function toggle(key, checked) {
            if (key == null || key === "") return;
            if (checked) set().add(key); else set().delete(key);
            fire();
        }
        function selectAllVisible() {
            host.querySelectorAll(rowSel).forEach((cb) => {
                cb.checked = true;
                const k = keyOf(rowOf(cb));
                if (k) set().add(k);
            });
            fire();
        }
        function clear() {
            set().clear();
            host.querySelectorAll(rowSel + "," + allSel).forEach((cb) => { cb.checked = false; });
            fire();
        }

        function onChange(e) {
            if (e.target.matches && e.target.matches(allSel)) return; // handled on click
            if (e.target.matches && e.target.matches(rowSel)) {
                const k = keyOf(rowOf(e.target));
                if (k) toggle(k, e.target.checked);
            }
        }
        function onClick(e) {
            if (e.target.matches && e.target.matches(allSel)) {
                e.stopPropagation();
                if (e.target.checked) selectAllVisible(); else clear();
                return;
            }
            if (e.target.matches && e.target.matches(rowSel)) e.stopPropagation();
        }
        host.addEventListener("change", onChange);
        host.addEventListener("click", onClick);

        return {
            selected() { return set(); },
            count() { return set().size; },
            clear: clear,
            selectAllVisible: selectAllVisible,
            setScope(s) { scope = s || "default"; fire(); },
            destroy() { host.removeEventListener("change", onChange); host.removeEventListener("click", onClick); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.batchSelect = batchSelect;
})();
