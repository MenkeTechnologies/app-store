// zgui-core/manager-list.js — a grouped "manager" list: cards (one per group, left-accent border +
// header name/count) each holding item rows (icon · label · badge · hover-reveal action buttons).
// Distilled from Audio-Haxor's .tag-manager-card/.tag-manager-item (the tag/notes managers). The
// generic CRUD-list-of-collections pattern — actions fire a callback; the app owns the data. Namespaced
// zg-mlist-* to avoid colliding with app `.tag-manager-*`. window.ZGui.managerList.
//
//   ZGui.managerList(container, groups, { onAction(action, item, group), accent:'yellow' }) -> { el, set(groups) }
//
//   groups: [{ name, count?, accent?, items: [{ icon?, label, badge?, actions?: [{icon, action, title?}] }] }]
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function managerList(container, groups, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const defAccent = opts.accent || "yellow";
        host.classList.add("zg-mlist");
        function set(list) {
            host.innerHTML = (list || []).map((g, gi) => {
                const accent = g.accent || defAccent;
                const items = (g.items || []).map((it, ii) => {
                    const icon = it.icon != null ? '<span class="zg-mlist-icon">' + it.icon + "</span>" : "";
                    const badge = it.badge != null ? '<span class="zg-mlist-badge">' + esc(it.badge) + "</span>" : "";
                    const actions = (it.actions || []).map((a) => '<button type="button" class="zg-mlist-act" data-action="' + esc(a.action) + '" data-g="' + gi + '" data-i="' + ii + '" title="' + esc(a.title || a.action) + '">' + (a.icon || "") + "</button>").join("");
                    return '<div class="zg-mlist-item" data-g="' + gi + '" data-i="' + ii + '">' + icon
                        + '<span class="zg-mlist-name">' + esc(it.label == null ? "" : it.label) + "</span>" + badge
                        + (actions ? '<span class="zg-mlist-actions">' + actions + "</span>" : "") + "</div>";
                }).join("");
                const count = g.count != null ? '<span class="zg-mlist-count">' + esc(g.count) + "</span>" : "";
                return '<div class="zg-mlist-card" data-accent="' + esc(accent) + '" style="border-left-color:var(--' + esc(accent) + ')">'
                    + '<div class="zg-mlist-head"><span class="zg-mlist-title">' + esc(g.name || "") + "</span>" + count + "</div>"
                    + '<div class="zg-mlist-items">' + items + "</div></div>";
            }).join("");
        }
        host.addEventListener("click", (e) => {
            const btn = e.target.closest(".zg-mlist-act"); if (!btn) return;
            const g = (list2 || [])[+btn.dataset.g]; const it = g && g.items[+btn.dataset.i];
            if (typeof opts.onAction === "function") opts.onAction(btn.dataset.action, it, g);
        });
        let list2 = groups;
        const api = { el: host, set(l) { list2 = l; set(l); } };
        api.set(groups);
        return api;
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.managerList = managerList;
})();
