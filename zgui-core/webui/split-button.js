// zgui-core/split-button.js — a primary action button joined to a caret that opens a
// dropdown of secondary actions. Distinct from `button-group` (peers) and `dropdown-menu`
// (caret only). window.ZGui.splitButton.
//   ZGui.splitButton({ label, icon, onClick, variant, items:[{label,icon,onClick,danger}] })
//     -> { el, open(), close() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function splitButton(opts) {
        opts = opts || {};
        const el = document.createElement("div");
        el.className = "zg-splitbtn" + (opts.variant ? " zg-splitbtn-" + opts.variant : "");

        const main = document.createElement("button");
        main.type = "button";
        main.className = "zg-splitbtn-main";
        main.innerHTML = (opts.icon ? `<span class="zg-splitbtn-icon">${opts.icon}</span>` : "") + esc(opts.label || "");
        main.addEventListener("click", () => { if (typeof opts.onClick === "function") opts.onClick(); });

        const caret = document.createElement("button");
        caret.type = "button";
        caret.className = "zg-splitbtn-caret";
        caret.innerHTML = "&#9662;";

        const menu = document.createElement("div");
        menu.className = "zg-splitbtn-menu";
        (opts.items || []).forEach((it) => {
            if (it === "-" || it.separator) { const sep = document.createElement("div"); sep.className = "zg-splitbtn-sep"; menu.appendChild(sep); return; }
            const mi = document.createElement("button");
            mi.type = "button";
            mi.className = "zg-splitbtn-item" + (it.danger ? " zg-danger" : "");
            mi.innerHTML = (it.icon ? `<span class="zg-splitbtn-iicon">${it.icon}</span>` : "") + esc(it.label || "");
            mi.addEventListener("click", () => { close(); if (typeof it.onClick === "function") it.onClick(); });
            menu.appendChild(mi);
        });

        let open = false;
        function setOpen(v) { open = !!v; el.classList.toggle("zg-open", open); }
        function close() { setOpen(false); }
        caret.addEventListener("click", (e) => { e.stopPropagation(); setOpen(!open); });
        document.addEventListener("click", (e) => { if (open && !el.contains(e.target)) close(); });

        el.appendChild(main);
        el.appendChild(caret);
        el.appendChild(menu);
        return { el, open: () => setOpen(true), close };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.splitButton = splitButton;
})();
