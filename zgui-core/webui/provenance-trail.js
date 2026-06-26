// zgui-core/provenance-trail.js — a breadcrumb of DATA LINEAGE (not navigation): each hop is a transform
// in a value's history (source → parse → filter → join → output), with a kind glyph, a label and a detail
// popover. Shows where a value came from and every step it passed through. window.ZGui.provenanceTrail.
//   ZGui.provenanceTrail(container, { hops:[{label,kind,detail}], onSelect(hop,i) }) -> { el, set(hops) }
//   kind ∈ source|transform|filter|join|merge|model|output (drives the glyph + color).
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    const GLYPH = { source: "⊙", transform: "ƒ", filter: "⩦", join: "⋈", merge: "⊕", model: "✦", output: "⇨" };
    function provenanceTrail(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let hops = opts.hops || [];
        const root = document.createElement("div"); root.className = "zg-provtrail";
        host.appendChild(root);

        function render() {
            root.innerHTML = hops.map((h, i) => {
                const kind = h.kind || "transform";
                return (i > 0 ? '<span class="zg-provtrail-arrow">→</span>' : "")
                    + `<button class="zg-provtrail-hop" data-kind="${kind}" data-i="${i}" title="${esc(h.detail || "")}">`
                    + `<span class="zg-provtrail-glyph">${GLYPH[kind] || GLYPH.transform}</span>`
                    + `<span class="zg-provtrail-label">${esc(h.label)}</span></button>`;
            }).join("");
        }
        let pop = null;
        function closePop() { if (pop) { pop.remove(); pop = null; } }
        root.addEventListener("click", (e) => {
            const b = e.target.closest(".zg-provtrail-hop"); if (!b) return;
            const i = +b.dataset.i, h = hops[i];
            if (typeof opts.onSelect === "function") opts.onSelect(h, i);
            closePop();
            if (h.detail) { pop = document.createElement("div"); pop.className = "zg-provtrail-pop"; pop.textContent = h.detail; const r = b.getBoundingClientRect(); pop.style.left = (r.left + window.pageXOffset) + "px"; pop.style.top = (r.bottom + window.pageYOffset + 4) + "px"; document.body.appendChild(pop); setTimeout(() => document.addEventListener("pointerdown", function off(ev) { if (pop && !pop.contains(ev.target)) { closePop(); document.removeEventListener("pointerdown", off, true); } }, true), 0); }
        });
        render();
        return { el: root, set(h) { hops = h || []; render(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.provenanceTrail = provenanceTrail;
})();
