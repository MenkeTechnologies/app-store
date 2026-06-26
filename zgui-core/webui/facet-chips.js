// zgui-core/facet-chips.js — a row of faceted filter CHIPS, each opening a count-list popover for
// single-select-per-facet filtering. Distilled from Audio-Haxor's unified-browser.js chip kit
// (Format / Category / Key / Creator over the crate engine). Distinct from ZGui.multiFilter (a
// multi-select dropdown bound to a <select>): a facet chip is single-select, shows the chosen value
// inline on the chip with an ✕ to clear, and its popover lists each value with a count. The host app
// supplies the value+count lists (from its own faceted query) and reacts via onChange. ZGui.facetChips.
//
//   const fc = ZGui.facetChips(container, {
//       facets:  [{ key, label, glyph }],          // the chips
//       values:  { key: [{ value, count }] },      // per-facet value lists (counts)
//       selected:{ key: value|null },              // initial selection
//       onChange(key, value),                      // fired when a value is picked or cleared
//       emptyLabel: 'No values.',
//   }) -> { el, render(), setValues(map), setFacetValues(key, list), selected(): {…}, clear() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    const tr = (k, d, v) => (window.ZGui && window.ZGui.i18n) ? window.ZGui.i18n.t(d || k, v) : (d || k);

    function facetChips(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const facets = opts.facets || [];
        const values = Object.assign({}, opts.values);
        const selected = Object.assign({}, opts.selected);
        let openChip = null;
        if (getComputedStyle(host).position === "static") host.style.position = "relative";
        host.classList.add("zg-facet-host");
        const chips = document.createElement("div"); chips.className = "ub-chips";
        const pop = document.createElement("div"); pop.className = "ub-pop"; pop.hidden = true;
        host.appendChild(chips); host.appendChild(pop);

        function renderChips() {
            chips.innerHTML = facets.map((c) => {
                const val = selected[c.key];
                const on = val != null ? " active" : "";
                const open = openChip === c.key ? " open" : "";
                const label = val != null ? esc(val) : esc(c.label);
                return '<button type="button" class="ub-chip' + on + open + '" data-chip="' + esc(c.key) + '" title="' + esc(c.label) + '">'
                    + (c.glyph ? '<span class="ub-chip-glyph">' + c.glyph + "</span>" : "")
                    + '<span class="ub-chip-label">' + label + "</span>"
                    + (val != null ? '<span class="ub-chip-x" data-clear="' + esc(c.key) + '">✕</span>' : "")
                    + "</button>";
            }).join("");
        }
        function renderPop() {
            if (!openChip) { pop.hidden = true; pop.innerHTML = ""; return; }
            const def = facets.find((c) => c.key === openChip);
            const items = values[openChip] || [];
            const active = selected[openChip];
            pop.innerHTML = '<div class="ub-pop-head">' + esc(def.label) + "</div>"
                + (items.length
                    ? items.map((it) => {
                        const on = active != null && active === it.value ? " active" : "";
                        return '<button type="button" class="ub-facet' + on + '" data-val="' + esc(it.value) + '">'
                            + '<span class="ub-facet-val">' + esc(it.value || "(none)") + "</span>"
                            + '<span class="ub-facet-count">' + (it.count != null ? Number(it.count).toLocaleString() : "") + "</span></button>";
                    }).join("")
                    : '<div class="ub-pop-empty">' + esc(opts.emptyLabel || tr("ui.no_values", "No values.")) + "</div>");
            pop.hidden = false;
        }
        function closePop() { openChip = null; pop.hidden = true; pop.innerHTML = ""; }
        function render() { renderChips(); renderPop(); }

        chips.addEventListener("click", (e) => {
            const x = e.target.closest(".ub-chip-x");
            if (x) {
                e.stopPropagation();
                const key = x.getAttribute("data-clear");
                selected[key] = null; closePop(); renderChips();
                if (typeof opts.onChange === "function") opts.onChange(key, null);
                return;
            }
            const chip = e.target.closest(".ub-chip");
            if (!chip) return;
            const key = chip.getAttribute("data-chip");
            openChip = openChip === key ? null : key;
            renderChips(); renderPop();
        });
        pop.addEventListener("click", (e) => {
            const btn = e.target.closest(".ub-facet");
            if (!btn || !openChip) return;
            const key = openChip;
            const val = btn.getAttribute("data-val");
            selected[key] = selected[key] === val ? null : val;
            closePop(); renderChips();
            if (typeof opts.onChange === "function") opts.onChange(key, selected[key]);
        });
        // outside click closes the popover
        document.addEventListener("click", (e) => { if (!host.contains(e.target) && openChip) { closePop(); renderChips(); } });

        renderChips();
        return {
            el: host,
            render: render,
            setValues(map) { Object.assign(values, map || {}); renderPop(); },
            setFacetValues(key, list) { values[key] = list || []; if (openChip === key) renderPop(); },
            selected() { return Object.assign({}, selected); },
            set(key, value) { selected[key] = value; renderChips(); if (openChip === key) renderPop(); },
            clear() { for (const c of facets) selected[c.key] = null; closePop(); renderChips(); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.facetChips = facetChips;
})();
