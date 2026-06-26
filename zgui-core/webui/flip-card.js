// zgui-core/flip-card.js — a 3D flip card with a front and back face. Flip on click
// (default) or programmatically. window.ZGui.flipCard.
//   ZGui.flipCard({ front:html|node, back:html|node, trigger?:'click'|'hover'|'none', axis?:'y'|'x' })
//     -> { el, flip(), show(side), flipped() }
(function () {
    "use strict";
    function face(cls, content) {
        const f = document.createElement("div");
        f.className = "zg-flip-face " + cls;
        if (content && content.nodeType) f.appendChild(content);
        else f.innerHTML = String(content == null ? "" : content);
        return f;
    }
    function flipCard(opts) {
        opts = opts || {};
        const el = document.createElement("div");
        el.className = "zg-flip zg-flip-" + (opts.axis === "x" ? "x" : "y");
        const inner = document.createElement("div");
        inner.className = "zg-flip-inner";
        inner.appendChild(face("zg-flip-front", opts.front));
        inner.appendChild(face("zg-flip-back", opts.back));
        el.appendChild(inner);

        let flipped = false;
        function set(v) { flipped = !!v; el.classList.toggle("zg-flipped", flipped); }
        const trigger = opts.trigger || "click";
        if (trigger === "click") el.addEventListener("click", () => set(!flipped));
        else if (trigger === "hover") {
            el.addEventListener("mouseenter", () => set(true));
            el.addEventListener("mouseleave", () => set(false));
        }
        return { el, flip: () => set(!flipped), show: (side) => set(side === "back"), flipped: () => flipped };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.flipCard = flipCard;
})();
