// zgui-core/toggle-group.js — a row of independently-toggleable buttons (multi-select),
// distinct from `segmented` (single-select) and `button-group` (action buttons). Good for
// format toolbars (bold/italic/…). window.ZGui.toggleGroup.
//   ZGui.toggleGroup({ items:[{id,label,icon,active?,title?}], onChange? })
//     -> { el, value(), toggle(id), set(id,on), get(id) }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function toggleGroup(opts) {
        opts = opts || {};
        const el = document.createElement("div");
        el.className = "zg-togglegroup";
        const state = {};
        const btns = {};
        (opts.items || []).forEach((it) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "zg-togglegroup-btn";
            b.innerHTML = (it.icon ? `<span class="zg-tg-icon">${it.icon}</span>` : "")
                + (it.label != null ? `<span class="zg-tg-label">${esc(it.label)}</span>` : "");
            if (it.title) b.title = it.title;
            state[it.id] = !!it.active;
            btns[it.id] = b;
            b.classList.toggle("active", state[it.id]);
            b.setAttribute("aria-pressed", String(state[it.id]));
            b.addEventListener("click", () => set(it.id, !state[it.id]));
            el.appendChild(b);
        });
        function set(id, on) {
            if (!(id in state)) return;
            state[id] = !!on;
            btns[id].classList.toggle("active", state[id]);
            btns[id].setAttribute("aria-pressed", String(state[id]));
            if (typeof opts.onChange === "function") opts.onChange(id, state[id], value());
        }
        function value() { return Object.keys(state).filter((k) => state[k]); }
        return { el, value, toggle: (id) => set(id, !state[id]), set, get: (id) => !!state[id] };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.toggleGroup = toggleGroup;
})();
