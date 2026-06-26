// zgui-core/spoiler.js — collapse content taller than maxHeight behind a show-more/less toggle; if the
// content is shorter than maxHeight, no toggle appears. Ported behavior from Mantine's <Spoiler>.
// window.ZGui.spoiler.
//   ZGui.spoiler(container, { content:node|html|string, maxHeight:100, showLabel:'Show more',
//       hideLabel:'Show less', expanded:false, onExpandedChange(bool) }) -> { el, body, toggle(), expand(), collapse() }
(function () {
    "use strict";
    function spoiler(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const maxH = opts.maxHeight == null ? 100 : opts.maxHeight;
        let expanded = !!opts.expanded;

        const root = document.createElement("div"); root.className = "zg-spoiler";
        const body = document.createElement("div"); body.className = "zg-spoiler-body";
        if (opts.content && opts.content.nodeType === 1) body.appendChild(opts.content);
        else if (opts.html != null) body.innerHTML = opts.html;
        else body.textContent = opts.content != null ? opts.content : "";
        const ctl = document.createElement("button"); ctl.type = "button"; ctl.className = "zg-spoiler-control"; ctl.hidden = true;
        root.appendChild(body); root.appendChild(ctl);
        host.appendChild(root);

        function apply() {
            const overflow = body.scrollHeight > maxH + 1;
            ctl.hidden = !overflow;
            if (!overflow || expanded) { body.style.maxHeight = "none"; root.classList.toggle("is-expanded", expanded && overflow); }
            else { body.style.maxHeight = maxH + "px"; root.classList.remove("is-expanded"); }
            ctl.textContent = expanded ? (opts.hideLabel || "Show less") : (opts.showLabel || "Show more");
        }
        function setExpanded(v) { expanded = !!v; apply(); if (typeof opts.onExpandedChange === "function") opts.onExpandedChange(expanded); }
        ctl.addEventListener("click", () => setExpanded(!expanded));
        // measure after layout
        if (window.requestAnimationFrame) requestAnimationFrame(apply); else apply();

        return { el: root, body, toggle: () => setExpanded(!expanded), expand: () => setExpanded(true), collapse: () => setExpanded(false) };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.spoiler = spoiler;
})();
