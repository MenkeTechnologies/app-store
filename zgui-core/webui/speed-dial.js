// zgui-core/speed-dial.js — a floating action button that expands a stack of action
// buttons (the FAB rotates to an ✕ when open). window.ZGui.speedDial.
//   ZGui.speedDial({ icon?, actions:[{icon,label,title,onClick}], direction?:'up'|'down'|'left'|'right' })
//     -> { el, open(), close(), toggle(), isOpen() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function speedDial(opts) {
        opts = opts || {};
        const el = document.createElement("div");
        el.className = "zg-speeddial zg-speeddial-" + (opts.direction || "up");

        const list = document.createElement("div");
        list.className = "zg-speeddial-actions";
        (opts.actions || []).forEach((a) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "zg-speeddial-action";
            b.innerHTML = `<span class="zg-speeddial-aicon">${a.icon || "&#9679;"}</span>`
                + (a.label != null ? `<span class="zg-speeddial-alabel">${esc(a.label)}</span>` : "");
            if (a.title) b.title = a.title;
            b.addEventListener("click", () => { setOpen(false); if (typeof a.onClick === "function") a.onClick(); });
            list.appendChild(b);
        });

        const main = document.createElement("button");
        main.type = "button";
        main.className = "zg-speeddial-main";
        main.innerHTML = `<span class="zg-speeddial-icon">${opts.icon || "&#43;"}</span>`;

        let open = false;
        function setOpen(v) {
            open = !!v;
            el.classList.toggle("zg-open", open);
            main.setAttribute("aria-expanded", String(open));
        }
        main.addEventListener("click", () => setOpen(!open));

        el.appendChild(list);
        el.appendChild(main);
        return { el, open: () => setOpen(true), close: () => setOpen(false), toggle: () => setOpen(!open), isOpen: () => open };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.speedDial = speedDial;
})();
