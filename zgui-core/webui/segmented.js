// zgui-core/segmented.js — a segmented control / pill view-switcher (the inline tab strip used
// inside a panel, distinct from the app-level tab strip in tabs.js). Distilled from the pattern
// in zcontainer (.zc-subtabs) + zreq's editor sub-tabs. window.ZGui.segmented.
//
//   ZGui.segmented.create(container, items, {
//       value: 'logs',                 // initially-active id
//       onChange: (id) => {},          // fired when the active segment changes
//   }) -> { el, value(), set(id) }
//
//   items: [{ id, label }] or [[id, label], …]
(function () {
    "use strict";

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }
    function norm(items) {
        return (items || []).map((it) => Array.isArray(it) ? { id: it[0], label: it[1] } : it);
    }

    function create(container, items, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const list = norm(items);
        let active = opts.value != null ? opts.value : (list[0] && list[0].id);

        const wrap = el("div", "zg-segmented");
        const btns = {};
        list.forEach((it) => {
            const b = el("button", "zg-segment" + (it.id === active ? " is-active" : ""), it.label);
            b.type = "button";
            b.addEventListener("click", () => set(it.id, true));
            btns[it.id] = b;
            wrap.appendChild(b);
        });
        host.appendChild(wrap);

        function set(id, fire) {
            if (!btns[id] || id === active) { if (id === active) return; }
            active = id;
            Object.keys(btns).forEach((k) => btns[k].classList.toggle("is-active", k === id));
            if (fire && typeof opts.onChange === "function") opts.onChange(id);
        }

        return { el: wrap, value() { return active; }, set: (id) => set(id, false) };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.segmented = { create: create };
})();
