// zgui-core/multi-filter.js — multi-select checkbox filter dropdowns, ported faithfully from
// Audio-Haxor's multi-filter.js. Enhances a hidden `<select>` (or a plain options list) into a
// button + body-mounted fixed dropdown of checkboxes: an "All" toggle, pinned-selected-at-top,
// fzf search (via ZGui.fzf) with a render cap so a 17k-option list never spawns 17k nodes, and
// viewport-aware above/below placement. The haxor `triggerFilter(action)` call-site registry is
// replaced by an onChange(valuesOrNull) callback. window.ZGui.multiFilter.
//
//   const mf = ZGui.multiFilter(button, {
//       options: [{value,text}, …],   // or attach to a <select> via from()
//       allLabel: 'All',
//       onChange(selectedSetOrNull),  // null === "all" (nothing selected)
//   }) -> { setOptions(opts, allLabel), selected(): Set|null, set(value), clear(), open(), close() }
//
//   ZGui.multiFilter.from(selectEl, { onChange })  // replace a hidden <select>, seeding from its <option>s
(function () {
    "use strict";
    const RENDER_CAP = 200, MIN_WIDTH = 160, PAD = 8;
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    const fzf = () => (window.ZGui && window.ZGui.fzf) || null;
    const tr = (k, d, v) => (window.ZGui && window.ZGui.i18n) ? window.ZGui.i18n.t(d || k, v) : (d || k);

    function position(btn, dd) {
        if (!btn || !dd) return;
        const r = btn.getBoundingClientRect();
        const vw = window.innerWidth || document.documentElement.clientWidth || 0;
        const vh = window.innerHeight || document.documentElement.clientHeight || 0;
        const naturalW = Math.max(r.width, MIN_WIDTH);
        const width = Math.min(naturalW, Math.max(MIN_WIDTH, vw - PAD * 2));
        dd.style.width = width + "px";
        const roomBelow = Math.max(0, vh - r.bottom - PAD);
        const roomAbove = Math.max(0, r.top - PAD);
        const placeAbove = roomBelow < 160 && roomAbove > roomBelow;
        dd.style.maxHeight = Math.max(120, placeAbove ? roomAbove : roomBelow) + "px";
        let left = r.left;
        if (left + width > vw - PAD) left = Math.max(PAD, vw - PAD - width);
        if (left < PAD) left = PAD;
        dd.style.left = left + "px";
        if (placeAbove) { dd.style.top = ""; dd.style.bottom = (vh - r.top + 2) + "px"; }
        else { dd.style.bottom = ""; dd.style.top = (r.bottom + 2) + "px"; }
    }
    // reposition any open dropdown on scroll/resize
    function repositionOpen() {
        const open = document.querySelector(".multi-filter-dropdown.open");
        if (!open || !open._btn) return;
        position(open._btn, open);
    }
    if (typeof window !== "undefined") {
        window.addEventListener("resize", repositionOpen);
        window.addEventListener("scroll", repositionOpen, true);
        document.addEventListener("click", () => document.querySelectorAll(".multi-filter-dropdown.open").forEach((d) => d.classList.remove("open")));
    }

    function multiFilter(button, opts) {
        const btn = typeof button === "string" ? document.querySelector(button) : button;
        if (!btn) return null;
        opts = opts || {};
        btn.classList.add("multi-filter-btn");
        if (!btn.querySelector(".multi-filter-label")) btn.innerHTML = '<span class="multi-filter-label"></span><span class="multi-filter-arrow">&#9660;</span>';
        const dd = document.createElement("div");
        dd.className = "multi-filter-dropdown";
        dd._btn = btn;
        document.body.appendChild(dd);

        const state = { selected: new Set(), options: opts.options || [], allLabel: opts.allLabel || "All", search: "" };

        function updateLabel() {
            const lbl = btn.querySelector(".multi-filter-label");
            if (!lbl) return;
            if (state.selected.size === 0) { lbl.textContent = state.allLabel; lbl.classList.remove("multi-filter-active"); }
            else if (state.selected.size === 1) { const v = [...state.selected][0]; const o = state.options.find((x) => x.value === v); lbl.textContent = o ? o.text : v; lbl.classList.add("multi-filter-active"); }
            else { lbl.textContent = tr("menu.batch_selected", "{n} selected", { n: state.selected.size }); lbl.classList.add("multi-filter-active"); }
        }
        function rebuild() {
            const f = fzf();
            const search = state.search.trim();
            const needsSearch = state.options.length > RENDER_CAP;
            let filtered = state.options;
            if (search && f) {
                const scored = [];
                for (const o of state.options) { const s = f.searchScore(search, [o.text], "fuzzy"); if (s > 0) scored.push({ o, s }); }
                scored.sort((a, b) => b.s - a.s);
                filtered = scored.map((x) => x.o);
            }
            const capped = filtered.slice(0, RENDER_CAP);
            const overflow = filtered.length - capped.length;
            const hl = (text) => (search && f) ? f.highlightWithIndices(text, f.getMatchIndices(search, text, "fuzzy")) : esc(text);
            let html = "";
            if (needsSearch) html += '<div class="multi-filter-search-row"><input type="text" class="multi-filter-search" placeholder="' + esc(tr("ui.search", "Search…")) + '" value="' + state.search.replace(/"/g, "&quot;") + '" spellcheck="false"></div>';
            html += '<label class="multi-filter-item multi-filter-all"><input type="checkbox"' + (state.selected.size === 0 ? " checked" : "") + ' data-value="all"> <span>' + esc(state.allLabel) + "</span></label><div class=\"multi-filter-sep\"></div>";
            const pinned = new Set();
            if (state.selected.size > 0) {
                for (const v of state.selected) { const o = state.options.find((x) => x.value === v); if (o) { html += '<label class="multi-filter-item multi-filter-pinned"><input type="checkbox" checked data-value="' + esc(o.value) + '"> <span>' + hl(o.text) + "</span></label>"; pinned.add(v); } }
                if (pinned.size) html += '<div class="multi-filter-sep"></div>';
            }
            for (const o of capped) { if (pinned.has(o.value)) continue; html += '<label class="multi-filter-item"><input type="checkbox"' + (state.selected.has(o.value) ? " checked" : "") + ' data-value="' + esc(o.value) + '"> <span>' + hl(o.text) + "</span></label>"; }
            if (overflow > 0) html += '<div class="multi-filter-overflow">' + tr("ui.n_more_search", "{n} more — type to search", { n: overflow.toLocaleString() }) + "</div>";
            dd.innerHTML = html;
            if (needsSearch) {
                const input = dd.querySelector(".multi-filter-search");
                if (input) {
                    let deb;
                    input.addEventListener("input", () => { clearTimeout(deb); deb = setTimeout(() => { state.search = input.value; rebuild(); const ni = dd.querySelector(".multi-filter-search"); if (ni) { ni.focus(); ni.selectionStart = ni.selectionEnd = ni.value.length; } }, 150); });
                    input.addEventListener("click", (e) => e.stopPropagation());
                }
            }
        }
        function changed() { updateLabel(); if (typeof opts.onChange === "function") opts.onChange(state.selected.size ? state.selected : null); }

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            document.querySelectorAll(".multi-filter-dropdown.open").forEach((d) => { if (d !== dd) d.classList.remove("open"); });
            const willOpen = !dd.classList.contains("open");
            dd.classList.toggle("open");
            if (willOpen) { rebuild(); position(btn, dd); const i = dd.querySelector(".multi-filter-search"); if (i) i.focus(); }
        });
        dd.addEventListener("click", (e) => e.stopPropagation());
        dd.addEventListener("change", (e) => {
            const cb = e.target;
            if (!cb.matches || !cb.matches('input[type="checkbox"]')) return;
            const val = cb.dataset.value;
            if (val === "all") { if (cb.checked) { state.selected.clear(); dd.querySelectorAll("input[data-value]").forEach((c) => { c.checked = c.dataset.value === "all"; }); } }
            else {
                if (cb.checked) state.selected.add(val); else state.selected.delete(val);
                const allCb = dd.querySelector('input[data-value="all"]');
                if (allCb) allCb.checked = state.selected.size === 0;
            }
            rebuild(); changed();
        });

        updateLabel();
        const api = {
            setOptions(o, allLabel) { state.options = o || []; if (allLabel != null) state.allLabel = allLabel; const valid = new Set(state.options.map((x) => x.value)); for (const v of [...state.selected]) if (!valid.has(v)) state.selected.delete(v); state.search = ""; updateLabel(); if (dd.classList.contains("open")) rebuild(); },
            selected() { return state.selected.size ? state.selected : null; },
            set(value) { if (value === "all") state.selected.clear(); else state.selected.add(String(value)); updateLabel(); changed(); },
            clear() { state.selected.clear(); updateLabel(); changed(); },
            open() { btn.click(); },
            close() { dd.classList.remove("open"); },
        };
        return api;
    }
    // Enhance a hidden <select>: seed options from its <option>s, mirror selection back to it.
    multiFilter.from = function (selectEl, opts) {
        const select = typeof selectEl === "string" ? document.querySelector(selectEl) : selectEl;
        if (!select) return null;
        opts = opts || {};
        select.style.display = "none";
        const btn = document.createElement("button");
        btn.type = "button";
        select.parentNode.insertBefore(btn, select.nextSibling);
        const optsList = [...select.options].filter((o) => o.value !== "" && o.value !== "all").map((o) => ({ value: o.value, text: o.text }));
        const allLabel = (select.options[0] && select.options[0].text) || "All";
        const mf = multiFilter(btn, {
            options: optsList, allLabel: allLabel,
            onChange(sel) {
                select.value = sel ? [...sel][0] : "";
                if (typeof Event !== "undefined" && select.dispatchEvent) select.dispatchEvent(new Event("change", { bubbles: true }));
                if (typeof opts.onChange === "function") opts.onChange(sel);
            },
        });
        mf.refresh = function () { const list = [...select.options].filter((o) => o.value !== "" && o.value !== "all").map((o) => ({ value: o.value, text: o.text })); mf.setOptions(list, (select.options[0] && select.options[0].text) || "All"); };
        return mf;
    };
    window.ZGui = window.ZGui || {};
    window.ZGui.multiFilter = multiFilter;
})();
