// zgui-core/cascader.js — a multi-level (cascading) select: a trigger that opens stacked columns,
// one per hierarchy level; choosing an option with children expands the next column, a leaf commits
// the path. Ported behavior from Ant Design's <Cascader> (nested options value/label/children,
// changeOnSelect, separator, onChange(value, selectedOptions)). window.ZGui.cascader.
//   ZGui.cascader(container, { options:[{value,label,children?,disabled?}], value:[…], placeholder,
//       changeOnSelect:false, separator:' / ', onChange(value, selectedOptions) }) ->
//       { el, get(), set(value), open(), close() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function cascader(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const sep = opts.separator || " / ";
        const changeOnSelect = !!opts.changeOnSelect;
        let value = (opts.value || []).slice();   // committed path of values
        let nav = [];                              // options chosen per column while browsing

        const root = document.createElement("div"); root.className = "zg-cascader";
        const trig = document.createElement("button"); trig.type = "button"; trig.className = "zg-cascader-trigger";
        const pop = document.createElement("div"); pop.className = "zg-cascader-pop"; pop.hidden = true;
        root.appendChild(trig); root.appendChild(pop); host.appendChild(root);

        function optsAt(level) {
            if (level === 0) return opts.options || [];
            const parent = nav[level - 1];
            return (parent && parent.children) || [];
        }
        function pathFromNav() { return nav.map((o) => o.value); }
        function labelsFromValue(v) {
            const labels = []; let list = opts.options || [];
            for (const val of v) { const o = (list || []).find((x) => x.value === val); if (!o) break; labels.push(o.label != null ? o.label : o.value); list = o.children; }
            return labels;
        }
        function renderTrigger() {
            const labels = labelsFromValue(value);
            if (labels.length) { trig.innerHTML = `<span class="zg-cascader-val">${labels.map(esc).join(esc(sep))}</span><span class="zg-cascader-caret">▾</span>`; trig.classList.remove("is-empty"); }
            else { trig.innerHTML = `<span class="zg-cascader-ph">${esc(opts.placeholder || "Select…")}</span><span class="zg-cascader-caret">▾</span>`; trig.classList.add("is-empty"); }
        }
        function commit(close) {
            value = pathFromNav();
            renderTrigger();
            if (typeof opts.onChange === "function") opts.onChange(value.slice(), nav.slice());
            if (close) hide();
        }
        function renderColumns() {
            pop.innerHTML = "";
            const depth = nav.length + 1;   // show one more column than chosen, while leaves exist
            for (let level = 0; level < depth; level++) {
                const list = optsAt(level); if (!list.length) break;
                const col = document.createElement("div"); col.className = "zg-cascader-col";
                list.forEach((o) => {
                    const it = document.createElement("div");
                    const hasKids = !!(o.children && o.children.length);
                    it.className = "zg-cascader-item" + (hasKids ? " has-children" : "") + (o.disabled ? " is-disabled" : "") + (nav[level] && nav[level].value === o.value ? " is-active" : "");
                    it.innerHTML = `<span>${esc(o.label != null ? o.label : o.value)}</span>${hasKids ? '<span class="zg-cascader-arrow">›</span>' : ""}`;
                    if (!o.disabled) it.addEventListener("click", () => {
                        nav = nav.slice(0, level); nav.push(o);
                        const leaf = !hasKids;
                        if (leaf || changeOnSelect) commit(leaf);
                        if (!leaf) renderColumns();
                        else renderColumns();
                    });
                    col.appendChild(it);
                });
                pop.appendChild(col);
            }
        }
        function show() { nav = []; let list = opts.options || []; for (const v of value) { const o = (list || []).find((x) => x.value === v); if (!o) break; nav.push(o); list = o.children; } renderColumns(); pop.hidden = false; root.classList.add("is-open"); document.addEventListener("pointerdown", outside, true); }
        function hide() { pop.hidden = true; root.classList.remove("is-open"); document.removeEventListener("pointerdown", outside, true); }
        function outside(e) { if (!root.contains(e.target)) hide(); }
        trig.addEventListener("click", () => (pop.hidden ? show() : hide()));

        renderTrigger();
        return {
            el: root,
            get() { return value.slice(); },
            set(v) { value = (v || []).slice(); renderTrigger(); },
            open: show, close: hide,
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.cascader = cascader;
})();
