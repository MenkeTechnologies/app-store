// zgui-core/transfer-list.js — a transfer / job QUEUE: rows of (kind · name · status), the status
// colored + showing a percent while running. Ported from zftp's .zf-transfers/.zf-tx (the FTP transfer
// queue). Generic for any background-job list: downloads, uploads, exports, scans, sync. The app feeds
// it items; this renders. Namespaced zg-tx-*. window.ZGui.transferList.
//
//   ZGui.transferList(container, items, { title }) -> { el, set(items) }
//   items: [{ kind, name, status, pct? }]   status ∈ queued | running | complete | error | cancelled
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    const tr = (k, d) => (window.ZGui && window.ZGui.i18n) ? window.ZGui.i18n.t(d || k) : (d || k);
    const KNOWN = { queued: 1, running: 1, complete: 1, error: 1, cancelled: 1 };
    function transferList(container, items, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        host.classList.add("zg-transfers");
        function set(list) {
            list = list || [];
            const title = opts.title != null ? '<div class="zg-tx-title">' + esc(opts.title) + "</div>" : "";
            host.innerHTML = title + list.map((tx) => {
                const status = KNOWN[tx.status] ? tx.status : "queued";
                const label = status === "running" && tx.pct != null ? status + " " + Math.round(tx.pct) + "%" : status;
                return '<div class="zg-tx">'
                    + '<span class="zg-tx-kind">' + esc(tx.kind || "") + "</span>"
                    + '<span class="zg-tx-name" title="' + esc(tx.name || "") + '">' + esc(tx.name || "") + "</span>"
                    + '<span class="zg-tx-stat ' + status + '">' + esc(label) + "</span></div>";
            }).join("");
        }
        set(items);
        return { el: host, set: set };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.transferList = transferList;
})();
