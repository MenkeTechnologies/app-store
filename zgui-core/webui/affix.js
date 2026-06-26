// zgui-core/affix.js — pin a child element to the viewport once the page scrolls past it. A
// placeholder preserves layout while the child is fixed. Ported behavior from Ant Design's <Affix>
// (offsetTop / offsetBottom / target / onChange(affixed)). window.ZGui.affix.
//   ZGui.affix(child, { offsetTop:0, offsetBottom, target, onChange(affixed) }) -> { el, update(), destroy() }
(function () {
    "use strict";
    function affix(child, opts) {
        const inner = child && (child.el || child);
        if (!inner) return null;
        opts = opts || {};
        const target = opts.target || window;
        const wrap = document.createElement("div"); wrap.className = "zg-affix";
        if (inner.parentNode) inner.parentNode.insertBefore(wrap, inner);
        wrap.appendChild(inner);
        let affixed = false;

        function scrollTop() { return target === window ? window.pageYOffset : target.scrollTop; }
        function viewBottom() { return target === window ? window.innerHeight : target.getBoundingClientRect().bottom; }
        function update() {
            const r = wrap.getBoundingClientRect();
            const h = inner.offsetHeight, w = wrap.offsetWidth;
            let want = false, style = {};
            if (opts.offsetTop != null && r.top <= opts.offsetTop) { want = true; style = { position: "fixed", top: opts.offsetTop + "px", width: w + "px" }; }
            else if (opts.offsetBottom != null && r.bottom >= viewBottom() - opts.offsetBottom) { want = true; style = { position: "fixed", bottom: opts.offsetBottom + "px", width: w + "px" }; }
            if (want) { wrap.style.height = h + "px"; Object.assign(inner.style, style); inner.classList.add("is-affixed"); }
            else { wrap.style.height = ""; inner.style.position = inner.style.top = inner.style.bottom = inner.style.width = ""; inner.classList.remove("is-affixed"); }
            if (want !== affixed) { affixed = want; if (typeof opts.onChange === "function") opts.onChange(affixed); }
        }
        const evTarget = target === window ? window : target;
        evTarget.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        update();
        return { el: wrap, update, destroy() { evTarget.removeEventListener("scroll", update); window.removeEventListener("resize", update); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.affix = affix;
})();
