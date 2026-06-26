// zgui-core/anchor.js — a table-of-contents nav that scroll-spies: it highlights the link whose target
// section is currently in view and smooth-scrolls to a section when its link is clicked. Ported behavior
// from Ant Design's <Anchor> (items[{href,title,children}], targetOffset, onChange, onClick, an ink bar).
// window.ZGui.anchor.
//   ZGui.anchor(container, { items:[{href,title,children?}], targetOffset:0, container:scrollEl,
//       onChange(href), onClick(href) }) -> { el, setActive(href), destroy() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function anchor(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const items = opts.items || [];
        const offset = opts.targetOffset || 0;
        const scrollEl = opts.container || window;

        const root = document.createElement("div"); root.className = "zg-anchor";
        const ink = document.createElement("span"); ink.className = "zg-anchor-ink"; root.appendChild(ink);
        const links = [];
        function build(list, depth, into) {
            list.forEach((it) => {
                const a = document.createElement("a");
                a.className = "zg-anchor-link"; a.href = it.href; a.textContent = it.title; a.dataset.href = it.href; a.style.paddingLeft = (12 + depth * 14) + "px";
                a.addEventListener("click", (e) => { e.preventDefault(); scrollTo(it.href); if (typeof opts.onClick === "function") opts.onClick(it.href); });
                into.appendChild(a); links.push(a);
                if (it.children && it.children.length) build(it.children, depth + 1, into);
            });
        }
        build(items, 0, root);
        host.appendChild(root);

        function targetOf(href) { const id = href.charAt(0) === "#" ? href.slice(1) : href; return document.getElementById(id) || document.querySelector(href); }
        function scrollTop() { return scrollEl === window ? window.pageYOffset : scrollEl.scrollTop; }
        function scrollTo(href) {
            const el = targetOf(href); if (!el) return;
            const top = el.getBoundingClientRect().top + scrollTop() - offset;
            if (scrollEl === window) window.scrollTo({ top, behavior: "smooth" }); else scrollEl.scrollTo({ top, behavior: "smooth" });
            setActive(href);
        }
        let activeHref = null;
        function setActive(href) {
            activeHref = href;
            let activeEl = null;
            links.forEach((a) => { const on = a.dataset.href === href; a.classList.toggle("active", on); if (on) activeEl = a; });
            if (activeEl) { ink.style.top = activeEl.offsetTop + "px"; ink.style.height = activeEl.offsetHeight + "px"; ink.style.opacity = "1"; }
            else ink.style.opacity = "0";
            if (typeof opts.onChange === "function") opts.onChange(href);
        }
        function spy() {
            // active = the last section whose top has passed the offset line
            let cur = null;
            for (const a of links) { const el = targetOf(a.dataset.href); if (!el) continue; if (el.getBoundingClientRect().top - offset <= 5) cur = a.dataset.href; }
            if (cur && cur !== activeHref) setActive(cur);
        }
        const evTarget = scrollEl === window ? window : scrollEl;
        evTarget.addEventListener("scroll", spy, { passive: true });
        spy();
        return { el: root, setActive, destroy() { evTarget.removeEventListener("scroll", spy); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.anchor = anchor;
})();
