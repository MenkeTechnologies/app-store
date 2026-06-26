// zgui-core/popconfirm.js — a lightweight inline confirmation bubble anchored to a trigger element
// (lighter than a full modal). Ported behavior from Ant Design's <Popconfirm> (title, description,
// okText, cancelText, onConfirm, onCancel, icon, placement). window.ZGui.popconfirm.
//   ZGui.popconfirm(trigger, { title, description, okText:'OK', cancelText:'Cancel', icon:'⚠',
//       placement:'top', danger:false, onConfirm, onCancel }) -> { open(), close(), el }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function popconfirm(trigger, opts) {
        const trg = trigger && (trigger.el || trigger);
        if (!trg) return null;
        opts = opts || {};
        const placement = opts.placement || "top";
        let pop = null;

        function close() { if (pop) { pop.remove(); pop = null; document.removeEventListener("pointerdown", outside, true); } }
        function outside(e) { if (pop && !pop.contains(e.target) && e.target !== trg && !trg.contains(e.target)) close(); }
        function open() {
            if (pop) return close();
            pop = document.createElement("div"); pop.className = "zg-popconfirm zg-popconfirm-" + placement;
            pop.innerHTML =
                `<div class="zg-popconfirm-body"><span class="zg-popconfirm-icon">${esc(opts.icon || "⚠")}</span>`
                + `<div><div class="zg-popconfirm-title">${esc(opts.title || "Are you sure?")}</div>`
                + (opts.description ? `<div class="zg-popconfirm-desc">${esc(opts.description)}</div>` : "") + "</div></div>"
                + `<div class="zg-popconfirm-btns"><button class="zg-popconfirm-cancel">${esc(opts.cancelText || "Cancel")}</button>`
                + `<button class="zg-popconfirm-ok${opts.danger ? " danger" : ""}">${esc(opts.okText || "OK")}</button></div>`;
            document.body.appendChild(pop);
            // position relative to the trigger
            const r = trg.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight, gap = 8;
            let x = r.left + r.width / 2 - pw / 2, y = r.top - ph - gap;
            if (placement === "bottom") y = r.bottom + gap;
            else if (placement === "left") { x = r.left - pw - gap; y = r.top + r.height / 2 - ph / 2; }
            else if (placement === "right") { x = r.right + gap; y = r.top + r.height / 2 - ph / 2; }
            pop.style.left = Math.max(8, Math.min(x, window.innerWidth - pw - 8)) + window.pageXOffset + "px";
            pop.style.top = (y + window.pageYOffset) + "px";
            pop.querySelector(".zg-popconfirm-ok").addEventListener("click", () => { close(); if (typeof opts.onConfirm === "function") opts.onConfirm(); });
            pop.querySelector(".zg-popconfirm-cancel").addEventListener("click", () => { close(); if (typeof opts.onCancel === "function") opts.onCancel(); });
            setTimeout(() => document.addEventListener("pointerdown", outside, true), 0);
        }
        trg.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); open(); });
        return { open, close, el: trg };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.popconfirm = popconfirm;
})();
