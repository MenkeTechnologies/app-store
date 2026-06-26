// zgui-core/mentions.js — a textarea that opens a filtered dropdown when you type a prefix (default
// "@"), inserting the chosen option at the caret. Ported behavior from Ant Design's <Mentions>
// (value, options[{value,label}], prefix, split, onSearch, onSelect, onChange). window.ZGui.mentions.
//   ZGui.mentions(container, { value, options:[{value,label}], prefix:'@', split:' ', placeholder,
//       rows:3, onSearch(text,prefix), onSelect(option,prefix), onChange(value) }) ->
//       { el, textarea, get(), set(v), setOptions(o) }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function mentions(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const prefixes = Array.isArray(opts.prefix) ? opts.prefix : [opts.prefix || "@"];
        const split = opts.split == null ? " " : opts.split;
        let options = opts.options || [];

        const root = document.createElement("div"); root.className = "zg-mentions";
        const ta = document.createElement("textarea"); ta.className = "zg-mentions-input"; ta.rows = opts.rows || 3;
        ta.placeholder = opts.placeholder || ""; if (opts.value) ta.value = opts.value;
        const drop = document.createElement("div"); drop.className = "zg-mentions-drop"; drop.hidden = true;
        root.appendChild(ta); root.appendChild(drop); host.appendChild(root);

        let measure = null;  // { prefix, start } of the active mention being typed
        let active = 0, filtered = [];

        function findMention() {
            const pos = ta.selectionStart, text = ta.value.slice(0, pos);
            for (const p of prefixes) {
                const idx = text.lastIndexOf(p);
                if (idx < 0) continue;
                const before = idx === 0 ? "" : text.charAt(idx - 1);
                const query = text.slice(idx + p.length);
                if ((idx === 0 || /\s/.test(before)) && !/\s/.test(query)) return { prefix: p, start: idx, query };
            }
            return null;
        }
        function render() {
            drop.innerHTML = filtered.map((o, i) =>
                `<div class="zg-mentions-item${i === active ? " active" : ""}" data-i="${i}">${esc(o.label != null ? o.label : o.value)}</div>`).join("");
        }
        function show(m) {
            const q = m.query.toLowerCase();
            filtered = options.filter((o) => String(o.label != null ? o.label : o.value).toLowerCase().includes(q));
            if (typeof opts.onSearch === "function") opts.onSearch(m.query, m.prefix);
            if (!filtered.length) return hide();
            active = 0; measure = m; render(); drop.hidden = false;
        }
        function hide() { drop.hidden = true; measure = null; filtered = []; }
        function choose(i) {
            const o = filtered[i]; if (!o || !measure) return;
            const pos = ta.selectionStart;
            const insert = measure.prefix + (o.value) + split;
            ta.value = ta.value.slice(0, measure.start) + insert + ta.value.slice(pos);
            const caret = measure.start + insert.length; ta.selectionStart = ta.selectionEnd = caret;
            hide(); ta.focus();
            if (typeof opts.onSelect === "function") opts.onSelect(o, measure.prefix);
            if (typeof opts.onChange === "function") opts.onChange(ta.value);
        }
        ta.addEventListener("input", () => { const m = findMention(); if (m) show(m); else hide(); if (typeof opts.onChange === "function") opts.onChange(ta.value); });
        ta.addEventListener("keydown", (e) => {
            if (drop.hidden) return;
            if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % filtered.length; render(); }
            else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + filtered.length) % filtered.length; render(); }
            else if (e.key === "Enter") { e.preventDefault(); choose(active); }
            else if (e.key === "Escape") { e.preventDefault(); hide(); }
        });
        drop.addEventListener("pointerdown", (e) => { const it = e.target.closest("[data-i]"); if (it) { e.preventDefault(); choose(+it.dataset.i); } });
        ta.addEventListener("blur", () => setTimeout(hide, 120));

        return { el: root, textarea: ta, get() { return ta.value; }, set(v) { ta.value = v == null ? "" : v; }, setOptions(o) { options = o || []; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.mentions = mentions;
})();
