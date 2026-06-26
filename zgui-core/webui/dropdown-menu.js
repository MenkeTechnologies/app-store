// zgui-core/dropdown-menu.js — a button that opens a menu of items (vs context-menu's right-click).
// window.ZGui.dropdownMenu.
//   ZGui.dropdownMenu(trigger, { items:[{label,icon?,value?,disabled?,danger?}|{separator:true}], onSelect }) -> { el, open, close, setItems }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function dropdownMenu(trigger, opts) {
        const btn = typeof trigger === "string" ? document.querySelector(trigger) : trigger;
        if (!btn) return null;
        opts = opts || {};
        let items = opts.items || [];
        const menu = document.createElement("div");
        menu.className = "zg-dropdown-menu"; menu.hidden = true;
        document.body.appendChild(menu);
        function render() {
            menu.innerHTML = items.map((it, i) => it.separator
                ? '<div class="zg-dropdown-sep"></div>'
                : `<button type="button" class="zg-dropdown-item${it.danger ? " danger" : ""}${it.disabled ? " disabled" : ""}" data-idx="${i}"${it.disabled ? " disabled" : ""}>${it.icon ? `<span class="zg-dropdown-ic">${it.icon}</span>` : ""}<span>${esc(it.label)}</span></button>`
            ).join("");
        }
        function position() {
            const r = btn.getBoundingClientRect();
            menu.style.top = (r.bottom + 4) + "px";
            menu.style.left = Math.max(8, Math.min(r.left, (window.innerWidth || 1000) - menu.offsetWidth - 8)) + "px";
        }
        function open() { render(); menu.hidden = false; position(); }
        function close() { menu.hidden = true; }
        btn.addEventListener("click", (e) => { e.stopPropagation(); menu.hidden ? open() : close(); });
        menu.addEventListener("click", (e) => {
            const b = e.target.closest(".zg-dropdown-item"); if (!b || b.disabled) return;
            const it = items[+b.dataset.idx]; close();
            if (typeof opts.onSelect === "function") opts.onSelect(it.value != null ? it.value : it.label, it);
        });
        document.addEventListener("click", (e) => { if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) close(); });
        return { el: menu, open, close, setItems(list) { items = list || []; if (!menu.hidden) render(); } };
    }
    window.ZGui = window.ZGui || {}; window.ZGui.dropdownMenu = dropdownMenu;
})();
