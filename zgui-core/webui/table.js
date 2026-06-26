// zgui-core/table.js — the data-grid toolkit, distilled from Audio-Haxor's columns.js,
// sort-persist.js, batch-select.js and multi-filter.js. Four cohesive pieces under one namespace;
// the GENERIC engines only — every app-specific item builder / action stays in the app.
// window.ZGui.table = { columns, sort, batch, multiFilter }.
//
//   table.columns.initResize(table)         // drag-resize <thead> columns, persisted by table id
//   table.sort.save(key, asc, tab) / .restore(tab)   // persist last sort column+dir per scope
//   table.batch.init({ scopeOf, keyOf, containerOf, onChange })  // multi-row checkbox selection
//   table.multiFilter.init({ onChange }) / .refresh(id) / .getValues(id) / .setValue(id, v)
//
// Host may define window.prefs ({getItem,setItem,getObject}); a localStorage shim is installed otherwise.
// multiFilter uses ZGui.fzf for search ranking + match highlight.
(function () {
    "use strict";

    const prefs = window.prefs || (window.prefs = {
        getItem(k) { try { return localStorage.getItem(k); } catch { return null; } },
        setItem(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch { /* quota */ } },
        getObject(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    });
    const esc = window.escapeHtml || function (s) {
        const d = document.createElement("div");
        d.textContent = s == null ? "" : String(s);
        return d.innerHTML;
    };

    // ════════════════════ columns: drag-resize + persisted widths ════════════════════
    const COL_LAYOUT_VERSION = 1;
    const _colObservers = typeof WeakMap !== "undefined" ? new WeakMap() : null;

    function saveColumnWidths(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;
        const tableWidth = table.offsetWidth;
        if (tableWidth <= 0) return;
        const ths = Array.from(table.querySelectorAll("thead th"));
        const keys = ths.map((th) => (th.dataset && th.dataset.key) || th.className || "");
        const pcts = ths.map((th) => +(th.offsetWidth / tableWidth * 100).toFixed(2));
        const all = prefs.getObject("columnWidths", {});
        all[tableId] = { v: COL_LAYOUT_VERSION, keys, pcts };
        prefs.setItem("columnWidths", all);
    }

    function loadColumnWidths(tableId) {
        const all = prefs.getObject("columnWidths", {});
        const entry = all[tableId];
        if (!entry || Array.isArray(entry) || entry.v !== COL_LAYOUT_VERSION) return null;
        return entry.pcts || null;
    }

    function initColumnResize(table) {
        if (!table) return;
        const tableId = table.id;
        requestAnimationFrame(function () {
            const ths = Array.from(table.querySelectorAll("thead th"));
            const tableWidth = table.offsetWidth;
            if (tableWidth > 0) {
                const saved = loadColumnWidths(tableId);
                if (saved && saved.length === ths.length && saved.every((w) => w > 0)) {
                    ths.forEach((th, i) => { th.style.width = (saved[i] / 100 * tableWidth) + "px"; });
                } else {
                    ths.forEach((th) => { th.style.width = th.offsetWidth + "px"; });
                }
            }
            table.querySelectorAll("thead .col-resize").forEach(function (handle) {
                handle.addEventListener("mousedown", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const th = handle.closest("th");
                    const nextTh = th.nextElementSibling;
                    if (!nextTh) return;
                    const startX = e.clientX;
                    const startWidth = th.offsetWidth;
                    const nextStartWidth = nextTh.offsetWidth;
                    const minWidth = parseInt(th.dataset.minWidth || "40", 10);
                    const nextMin = parseInt(nextTh.dataset.minWidth || "40", 10);
                    handle.classList.add("resizing");
                    document.body.classList.add("col-resizing");
                    function onMove(ev) {
                        const delta = ev.clientX - startX;
                        const nw = Math.max(minWidth, startWidth + delta);
                        const nnw = Math.max(nextMin, nextStartWidth - delta);
                        if (nw >= minWidth && nnw >= nextMin) {
                            th.style.width = nw + "px";
                            nextTh.style.width = nnw + "px";
                        }
                    }
                    function onUp() {
                        handle.classList.remove("resizing");
                        document.body.classList.remove("col-resizing");
                        document.removeEventListener("mousemove", onMove);
                        document.removeEventListener("mouseup", onUp);
                        saveColumnWidths(tableId);
                    }
                    document.addEventListener("mousemove", onMove);
                    document.addEventListener("mouseup", onUp);
                });
            });
        });
    }

    // ════════════════════ sort: persist last column + direction per scope ════════════════════
    const sort = {
        save(key, asc, tab) { prefs.setItem(`sort_${tab || "default"}`, JSON.stringify({ key, asc: !!asc })); },
        restore(tab) {
            const saved = prefs.getItem(`sort_${tab || "default"}`);
            if (!saved) return null;
            try { return JSON.parse(saved); } catch { return null; }
        },
    };

    // ════════════════════ batch: per-scope multi-row checkbox selection ════════════════════
    const batchByScope = new Map();
    let batchCfg = null;

    function defaultScope() {
        const t = document.querySelector(".tab-content.active");
        return (t && t.id) || "default";
    }
    function defaultKey(rowEl) {
        if (!rowEl) return null;
        const ds = rowEl.dataset || {};
        return ds.path || ds.key || rowEl.getAttribute("data-path") || null;
    }
    function defaultContainer() {
        return document.querySelector(".tab-content.active") || document;
    }
    function scopeOf() { return (batchCfg && batchCfg.scopeOf) ? batchCfg.scopeOf() : defaultScope(); }
    function keyOf(el) { return (batchCfg && batchCfg.keyOf) ? batchCfg.keyOf(el) : defaultKey(el); }
    function containerOf() { return (batchCfg && batchCfg.containerOf) ? batchCfg.containerOf(scopeOf()) : defaultContainer(); }

    function batchSet(scope) {
        if (!batchByScope.has(scope)) batchByScope.set(scope, new Set());
        return batchByScope.get(scope);
    }
    function activeBatchSet() { return batchSet(scopeOf()); }
    function batchCount() { return activeBatchSet().size; }
    function rowOf(cb) { return cb.closest("tr") || cb.closest("[data-path]") || cb.parentElement; }

    function batchChanged() {
        if (batchCfg && typeof batchCfg.onChange === "function") batchCfg.onChange(batchCount(), scopeOf());
    }
    function batchToggle(key, checked) {
        if (key == null || key === "") return;
        const set = activeBatchSet();
        if (checked) set.add(key); else set.delete(key);
        batchChanged();
    }
    function selectAllVisible() {
        const set = activeBatchSet();
        const root = containerOf();
        root.querySelectorAll(".batch-cb").forEach(function (cb) {
            cb.checked = true;
            const k = keyOf(rowOf(cb));
            if (k) set.add(k);
        });
        batchChanged();
    }
    function deselectAll() {
        batchByScope.clear();
        document.querySelectorAll(".batch-cb, .batch-cb-all").forEach(function (cb) { cb.checked = false; });
        batchChanged();
    }

    function batchInit(opts) {
        batchCfg = opts || {};
        document.addEventListener("change", function (e) {
            if (e.target.classList.contains("batch-cb-all")) return;
            if (e.target.classList.contains("batch-cb")) {
                const k = keyOf(rowOf(e.target));
                if (k) batchToggle(k, e.target.checked);
            }
        });
        document.addEventListener("click", function (e) {
            if (e.target.classList.contains("batch-cb-all")) {
                e.stopPropagation();
                if (e.target.checked) selectAllVisible(); else deselectAll();
                return;
            }
            if (e.target.classList.contains("batch-cb")) { e.stopPropagation(); }
        });
    }

    const batch = {
        init: batchInit,
        getSet: batchSet,
        activeSet: activeBatchSet,
        count: batchCount,
        toggle: batchToggle,
        selectAllVisible: selectAllVisible,
        deselectAll: deselectAll,
        keyOf: keyOf,
    };

    // ════════════════════ multiFilter: .filter-select -> checkbox dropdown ════════════════════
    const MF_RENDER_CAP = 200;
    const MF_MIN_WIDTH = 160;
    const MF_PAD = 8;
    let mfCfg = {};

    function fzf() { return window.ZGui && window.ZGui.fzf; }

    function positionMfDropdown(btn, dropdown) {
        if (!btn || !dropdown) return;
        const r = btn.getBoundingClientRect();
        const vw = window.innerWidth || document.documentElement.clientWidth || 0;
        const vh = window.innerHeight || document.documentElement.clientHeight || 0;
        const naturalWidth = Math.max(r.width, MF_MIN_WIDTH);
        const width = Math.min(naturalWidth, Math.max(MF_MIN_WIDTH, vw - MF_PAD * 2));
        dropdown.style.width = width + "px";
        const roomBelow = Math.max(0, vh - r.bottom - MF_PAD);
        const roomAbove = Math.max(0, r.top - MF_PAD);
        const placeAbove = roomBelow < 160 && roomAbove > roomBelow;
        dropdown.style.maxHeight = Math.max(120, placeAbove ? roomAbove : roomBelow) + "px";
        let left = r.left;
        if (left + width > vw - MF_PAD) left = Math.max(MF_PAD, vw - MF_PAD - width);
        if (left < MF_PAD) left = MF_PAD;
        dropdown.style.left = left + "px";
        if (placeAbove) { dropdown.style.top = ""; dropdown.style.bottom = (vh - r.top + 2) + "px"; }
        else { dropdown.style.bottom = ""; dropdown.style.top = (r.bottom + 2) + "px"; }
    }
    function repositionOpenMf() {
        const open = document.querySelector(".multi-filter-dropdown.open");
        if (!open) return;
        const wrap = open._wrapper;
        const btn = wrap && wrap.querySelector(".multi-filter-btn");
        if (btn) positionMfDropdown(btn, open);
    }
    window.addEventListener("resize", repositionOpenMf);
    window.addEventListener("scroll", repositionOpenMf, true);

    function mfHighlight(text, search) {
        const fz = fzf();
        if (search && fz) return fz.highlightMatch(text, search);
        return esc(text);
    }

    function rebuildMf(wrapper) {
        const dropdown = wrapper._dropdown;
        if (!dropdown) return;
        const opts = wrapper._allOptions;
        const allLabel = wrapper._allLabel;
        const search = wrapper._search.trim();
        const needsSearch = opts.length > MF_RENDER_CAP;
        const fz = fzf();

        let filtered;
        if (search && fz) {
            const scored = [];
            for (const o of opts) {
                const m = fz.fzfMatch(search, o.text);
                if (m && m.score > 0) scored.push({ o, score: m.score });
            }
            scored.sort((a, b) => b.score - a.score);
            filtered = scored.map((s) => s.o);
        } else {
            filtered = opts;
        }
        const capped = filtered.slice(0, MF_RENDER_CAP);
        const overflow = filtered.length - capped.length;

        let html = "";
        if (needsSearch) {
            const v = wrapper._search.replace(/"/g, "&quot;");
            html += `<div class="multi-filter-search-row"><input type="text" class="multi-filter-search" placeholder="Search…" value="${v}" spellcheck="false"></div>`;
        }
        const allChecked = wrapper._selected.size === 0 ? " checked" : "";
        html += `<label class="multi-filter-item multi-filter-all"><input type="checkbox"${allChecked} data-value="all"> <span>${esc(allLabel)}</span></label>`;
        html += `<div class="multi-filter-sep"></div>`;

        const pinned = new Set();
        if (wrapper._selected.size > 0) {
            for (const val of wrapper._selected) {
                const opt = opts.find((o) => o.value === val);
                if (opt) {
                    html += `<label class="multi-filter-item multi-filter-pinned"><input type="checkbox" checked data-value="${esc(opt.value)}"> <span>${mfHighlight(opt.text, search)}</span></label>`;
                    pinned.add(val);
                }
            }
            if (pinned.size > 0) html += `<div class="multi-filter-sep"></div>`;
        }
        for (const opt of capped) {
            if (pinned.has(opt.value)) continue;
            const chk = wrapper._selected.has(opt.value) ? " checked" : "";
            html += `<label class="multi-filter-item"><input type="checkbox"${chk} data-value="${esc(opt.value)}"> <span>${mfHighlight(opt.text, search)}</span></label>`;
        }
        if (overflow > 0) html += `<div class="multi-filter-overflow">${overflow.toLocaleString()} more — type to search</div>`;

        dropdown.innerHTML = html;
        if (needsSearch) {
            const input = dropdown.querySelector(".multi-filter-search");
            if (input) {
                let debounce;
                input.addEventListener("input", function () {
                    clearTimeout(debounce);
                    debounce = setTimeout(function () {
                        wrapper._search = input.value;
                        rebuildMf(wrapper);
                        const ni = dropdown.querySelector(".multi-filter-search");
                        if (ni) { ni.focus(); ni.selectionStart = ni.selectionEnd = ni.value.length; }
                    }, 150);
                });
                input.addEventListener("click", (e) => e.stopPropagation());
            }
        }
    }

    function updateMfLabel(wrapper) {
        const label = wrapper.querySelector(".multi-filter-label");
        if (!label) return;
        if (wrapper._selected.size === 0) {
            label.textContent = wrapper._allLabel;
            label.classList.remove("multi-filter-active");
        } else if (wrapper._selected.size === 1) {
            const val = [...wrapper._selected][0];
            const opt = (wrapper._allOptions || []).find((o) => o.value === val);
            label.textContent = opt ? opt.text : val;
            label.classList.add("multi-filter-active");
        } else {
            label.textContent = wrapper._selected.size + " selected";
            label.classList.add("multi-filter-active");
        }
    }

    function syncMfToSelect(wrapper) {
        const select = wrapper._select;
        select.value = wrapper._selected.size === 0 ? "" : [...wrapper._selected][0];
        if (typeof Event !== "undefined" && typeof select.dispatchEvent === "function") {
            select.dispatchEvent(new Event("change", { bubbles: true }));
        }
    }
    function mfChanged(wrapper) {
        if (mfCfg && typeof mfCfg.onChange === "function") {
            mfCfg.onChange(wrapper._select, wrapper._selected.size ? wrapper._selected : null, wrapper._action);
        }
    }

    function multiFilterInit(opts) {
        mfCfg = opts || {};
        document.querySelectorAll(".filter-select").forEach(function (select) {
            if (select.dataset.multiInit) return;
            select.dataset.multiInit = "1";
            const action = select.dataset.action;
            select.style.display = "none";

            const wrapper = document.createElement("div");
            wrapper.className = "multi-filter";
            wrapper.title = select.title || "";
            const btn = document.createElement("button");
            btn.className = "multi-filter-btn";
            btn.type = "button";
            btn.innerHTML = `<span class="multi-filter-label">All</span><span class="multi-filter-arrow">&#9660;</span>`;
            wrapper.appendChild(btn);

            const dropdown = document.createElement("div");
            dropdown.className = "multi-filter-dropdown";
            document.body.appendChild(dropdown);
            select.parentNode.insertBefore(wrapper, select.nextSibling);

            wrapper._selected = new Set();
            wrapper._select = select;
            wrapper._action = action;
            const initOpts = [...select.options].filter((o) => o.value !== "" && o.value !== "all");
            wrapper._allOptions = initOpts.map((o) => ({ value: o.value, text: o.text }));
            wrapper._allLabel = (select.options[0] && select.options[0].text) || "All";
            wrapper._search = "";
            wrapper._dropdown = dropdown;
            dropdown._wrapper = wrapper;

            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                document.querySelectorAll(".multi-filter-dropdown.open").forEach((d) => { if (d !== dropdown) d.classList.remove("open"); });
                const willOpen = !dropdown.classList.contains("open");
                dropdown.classList.toggle("open");
                if (willOpen) {
                    positionMfDropdown(btn, dropdown);
                    const input = dropdown.querySelector(".multi-filter-search");
                    if (input) input.focus();
                }
            });

            dropdown.addEventListener("change", function (e) {
                const cb = e.target;
                if (!cb.matches('input[type="checkbox"]')) return;
                const val = cb.dataset.value;
                if (val === "all") {
                    if (cb.checked) {
                        wrapper._selected.clear();
                        dropdown.querySelectorAll("input[data-value]").forEach((c) => { c.checked = c.dataset.value === "all"; });
                    }
                } else {
                    if (cb.checked) wrapper._selected.add(val); else wrapper._selected.delete(val);
                    const allCb = dropdown.querySelector('input[data-value="all"]');
                    if (allCb) allCb.checked = wrapper._selected.size === 0;
                }
                updateMfLabel(wrapper);
                syncMfToSelect(wrapper);
                mfChanged(wrapper);
            });
            dropdown.addEventListener("click", (e) => e.stopPropagation());
            rebuildMf(wrapper);
        });
        document.addEventListener("click", function () {
            document.querySelectorAll(".multi-filter-dropdown.open").forEach((d) => d.classList.remove("open"));
        });
    }

    function multiFilterRefresh(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        const wrapper = select.nextElementSibling;
        if (!wrapper || !wrapper.classList.contains("multi-filter")) return;
        const options = [...select.options].filter((o) => o.value !== "" && o.value !== "all");
        wrapper._allLabel = (select.options[0] && select.options[0].text) || "All";
        wrapper._allOptions = options.map((o) => ({ value: o.value, text: o.text }));
        wrapper._search = "";
        const valid = new Set(options.map((o) => o.value));
        for (const v of wrapper._selected) if (!valid.has(v)) wrapper._selected.delete(v);
        rebuildMf(wrapper);
        updateMfLabel(wrapper);
    }
    function multiFilterGetValues(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return null;
        const wrapper = select.nextElementSibling;
        if (!wrapper || !wrapper.classList.contains("multi-filter")) return null;
        return wrapper._selected.size === 0 ? null : wrapper._selected;
    }
    function multiFilterSetValue(selectId, value) {
        const select = document.getElementById(selectId);
        if (!select) return;
        const wrapper = select.nextElementSibling;
        if (!wrapper || !wrapper.classList.contains("multi-filter")) return;
        if (value === "all") wrapper._selected.clear();
        else wrapper._selected.add(String(value));
        rebuildMf(wrapper);
        updateMfLabel(wrapper);
        syncMfToSelect(wrapper);
    }

    const multiFilter = {
        init: multiFilterInit,
        refresh: multiFilterRefresh,
        getValues: multiFilterGetValues,
        setValue: multiFilterSetValue,
    };

    window.ZGui = window.ZGui || {};
    window.ZGui.table = {
        columns: { initResize: initColumnResize, save: saveColumnWidths, load: loadColumnWidths },
        sort: sort,
        batch: batch,
        multiFilter: multiFilter,
    };
})();
