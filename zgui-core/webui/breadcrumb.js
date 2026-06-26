// zgui-core/breadcrumb.js — a clickable path breadcrumb, distilled from the file-path breadcrumb
// in zpwr-file-browser. Renders segments separated by a chevron; clicking a segment fires onNav
// with its value (e.g. the cumulative path up to that crumb). window.ZGui.breadcrumb.
//
//   ZGui.breadcrumb.render(container, segments, {
//       onNav: (value, index) => {},   // clicking a crumb
//       separator: '›',
//   })
//   segments: [{ label, value }]
//
//   ZGui.breadcrumb.fromPath('/a/b/c', { sep:'/', onNav }) — convenience: split a filesystem path
//   into cumulative crumbs and render. Returns the segments array.
(function () {
    "use strict";

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }

    function render(container, segments, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const sep = opts.separator || "›";
        host.classList.add("zg-breadcrumb");
        while (host.firstChild) host.removeChild(host.firstChild);
        (segments || []).forEach((seg, i) => {
            if (i > 0) host.appendChild(el("span", "zg-crumb-sep", sep));
            const last = i === segments.length - 1;
            const c = el("span", "zg-crumb" + (last ? " is-current" : ""), seg.label);
            if (!last && typeof opts.onNav === "function") {
                c.addEventListener("click", () => opts.onNav(seg.value, i));
            }
            host.appendChild(c);
        });
        return host;
    }

    function fromPath(path, opts) {
        opts = opts || {};
        const sep = opts.sep || "/";
        const parts = String(path).split(sep).filter(Boolean);
        let acc = path.startsWith(sep) ? "" : null;
        const segments = [];
        if (path.startsWith(sep)) segments.push({ label: sep, value: sep });
        parts.forEach((p) => {
            acc = (acc === "" || acc === null) ? (path.startsWith(sep) ? sep + p : p) : acc + sep + p;
            segments.push({ label: p, value: acc });
        });
        if (opts.container) render(opts.container, segments, opts);
        return segments;
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.breadcrumb = { render: render, fromPath: fromPath };
})();
