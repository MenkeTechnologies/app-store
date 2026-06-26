// zgui-core/collapsible.js — a single disclosure (header toggles a content region). window.ZGui.collapsible.
//   ZGui.collapsible(container, { title, open?, body, onToggle? }) -> { el, open(), close(), toggle(), isOpen() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function collapsible(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let open = !!opts.open;
        host.classList.add("zg-collapsible");
        const head = document.createElement("button");
        head.type = "button"; head.className = "zg-collapsible-head";
        head.innerHTML = `<span class="zg-collapsible-caret">▸</span><span class="zg-collapsible-title">${esc(opts.title || "")}</span>`;
        const body = document.createElement("div");
        body.className = "zg-collapsible-body";
        if (opts.body != null) { if (typeof opts.body === "string") body.innerHTML = opts.body; else body.appendChild(opts.body); }
        host.appendChild(head); host.appendChild(body);
        function apply() { host.classList.toggle("open", open); if (typeof opts.onToggle === "function") opts.onToggle(open); }
        apply();
        head.addEventListener("click", () => { open = !open; apply(); });
        return { el: host, body, open() { open = true; apply(); }, close() { open = false; apply(); }, toggle() { open = !open; apply(); }, isOpen() { return open; } };
    }
    window.ZGui = window.ZGui || {}; window.ZGui.collapsible = collapsible;
})();
