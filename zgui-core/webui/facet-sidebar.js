// zgui-core/facet-sidebar.js — a vertical faceted-filter SIDEBAR (BANK / AUTHOR / TYPE … columns,
// each an "(All)" reset + value rows with counts). Selecting values narrows the result: AND across
// facets, OR within one. Ported from zpwr-patch-core's browser brz-facets. Distinct from
// ZGui.facetChips (compact chip popovers) and ZGui.multiFilter (a select dropdown). window.ZGui.facetSidebar.
//   ZGui.facetSidebar({ facets:[{name, label?, values:[{value,count}|value]}], selected?, onChange }) ->
//       { el, get(), set(sel), match(itemFacets) }
//   onChange(selection) where selection = { facetName: [values] }.  match(itemFacets) -> bool, AND/OR.
(function () {
    "use strict";
    function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }

    function facetSidebar(opts) {
        opts = opts || {};
        const facets = opts.facets || [];
        const sel = {};   // facet name -> Set(values)
        if (opts.selected) for (const k in opts.selected) sel[k] = new Set(opts.selected[k]);

        const root = el("div", "zg-facets");
        function get() { const o = {}; for (const k in sel) if (sel[k].size) o[k] = [...sel[k]]; return o; }
        function emit() { if (typeof opts.onChange === "function") opts.onChange(get()); }
        function render() {
            root.innerHTML = "";
            facets.forEach((f) => {
                const col = el("div", "zg-facet", root);
                el("div", "zg-facet-head", col).textContent = (f.label || f.name).toUpperCase();
                const lst = el("div", "zg-facet-list", col);
                const noSel = !sel[f.name] || !sel[f.name].size;
                const all = el("div", "zg-facet-item" + (noSel ? " on" : ""), lst);
                el("span", "zg-facet-name", all).textContent = "(All)";
                all.onclick = () => { delete sel[f.name]; render(); emit(); };
                (f.values || []).forEach((v) => {
                    const value = v && v.value != null ? v.value : v;
                    const count = v && v.count != null ? v.count : null;
                    const on = sel[f.name] && sel[f.name].has(value);
                    const it = el("div", "zg-facet-item" + (on ? " on" : ""), lst);
                    el("span", "zg-facet-name", it).textContent = value;
                    if (count != null) el("span", "zg-facet-count", it).textContent = count;
                    it.onclick = () => {
                        const s = sel[f.name] = sel[f.name] || new Set();
                        s.has(value) ? s.delete(value) : s.add(value);
                        if (!s.size) delete sel[f.name];
                        render(); emit();
                    };
                });
            });
        }
        // an item matches when, for EVERY selected facet, it has at least one of that facet's selected
        // values (AND across facets, OR within). itemFacets = { facetName: value | [values] }.
        function match(itemFacets) {
            itemFacets = itemFacets || {};
            for (const k in sel) {
                if (!sel[k].size) continue;
                const vals = [].concat(itemFacets[k] == null ? [] : itemFacets[k]);
                if (!vals.some((v) => sel[k].has(v))) return false;
            }
            return true;
        }
        render();
        return {
            el: root,
            get,
            set(s) { for (const k in sel) delete sel[k]; if (s) for (const k in s) sel[k] = new Set(s[k]); render(); },
            match,
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.facetSidebar = facetSidebar;
})();
