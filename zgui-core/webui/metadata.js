// zgui-core/metadata.js — a read-only metadata display: label/value pairs in an auto-fit grid,
// distilled from Audio-Haxor's .meta-item/.meta-label/.meta-value (file/track info panels). For
// properties / details / "about" panels. Namespaced zg-meta-* to avoid colliding with app `.meta-*`.
// (Editable key/value belongs to ZGui.kvEditor; this is the read-only counterpart.) window.ZGui.metaGrid.
//
//   ZGui.metaGrid(container, [{ label, value, wide?, html? }], { columns:2 }) -> { el, set(items) }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function metaGrid(container, items, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        host.classList.add("zg-meta");
        if (opts.columns) host.style.gridTemplateColumns = "repeat(" + opts.columns + ", minmax(0, 1fr))";
        function set(list) {
            host.innerHTML = (list || []).map((it) => {
                const v = it.html != null ? it.html : esc(it.value == null ? "" : it.value);
                return '<div class="zg-meta-item' + (it.wide ? " zg-meta-wide" : "") + '">'
                    + '<span class="zg-meta-label">' + esc(it.label || "") + "</span>"
                    + '<span class="zg-meta-value">' + v + "</span></div>";
            }).join("");
        }
        set(items);
        return { el: host, set: set };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.metaGrid = metaGrid;
})();
