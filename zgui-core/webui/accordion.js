// zgui-core/accordion.js — collapsible sections (distinct from the side drawer). Generic pattern
// — apps re-toggle section bodies inline; this centralizes it. window.ZGui.accordion.
//
//   ZGui.accordion(container, [{ title, body, open }], { multi:true, onToggle }) -> { el, toggle(i), openAll(), closeAll() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    function accordion(container, sections, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        host.classList.add("zg-accordion");
        const items = [];
        (sections || []).forEach((s, i) => {
            const item = el("div", "zg-acc-item", host);
            const head = el("button", "zg-acc-head", item); head.type = "button";
            el("span", "zg-acc-caret", head, "▾");
            el("span", "zg-acc-title", head).innerHTML = esc(s.title);
            const body = el("div", "zg-acc-body", item);
            if (s.body != null) { if (typeof s.body === "string") body.innerHTML = s.body; else body.appendChild(s.body); }
            function setOpen(v) { item.classList.toggle("open", v); if (typeof opts.onToggle === "function") opts.onToggle(i, v); }
            head.addEventListener("click", () => {
                const willOpen = !item.classList.contains("open");
                if (willOpen && opts.multi === false) items.forEach((it) => it.classList.remove("open"));
                setOpen(willOpen);
            });
            if (s.open) item.classList.add("open");
            items.push(item);
        });
        return {
            el: host,
            toggle(i) { if (items[i]) items[i].classList.toggle("open"); },
            openAll() { items.forEach((it) => it.classList.add("open")); },
            closeAll() { items.forEach((it) => it.classList.remove("open")); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.accordion = accordion;
})();
