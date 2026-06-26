// zgui-core/mod-cord-overlay.js — generalizes patch cables from jacks to ANY control: register source
// and target elements anywhere in a container, then drag a glowing bezier cord from a source to a target
// to assign modulation. Cords redraw on scroll/resize; an optional live signal pip flows along each.
// window.ZGui.modCordOverlay.
//   ZGui.modCordOverlay(container, { onConnect(srcId,tgtId), onDisconnect(srcId,tgtId), color }) ->
//       { el, register(el,{id,role,color}), connect(a,b), disconnect(a,b), flow(srcId,tgtId,t), clear() }
(function () {
    "use strict";
    const NS = "http://www.w3.org/2000/svg";
    function modCordOverlay(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const cs = (typeof getComputedStyle === "function") ? getComputedStyle(host) : null;
        if (!cs || cs.position === "static") host.style.position = "relative";
        const svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", "zg-cordoverlay");
        host.appendChild(svg);
        const nodes = {};          // id -> { el, role, color }
        const cords = [];          // { src, tgt, path, pip }
        let dragFrom = null, tempPath = null;

        function center(el) { const r = el.getBoundingClientRect(), hr = host.getBoundingClientRect(); return { x: r.left + r.width / 2 - hr.left + host.scrollLeft, y: r.top + r.height / 2 - hr.top + host.scrollTop }; }
        function curve(a, b) { const dx = Math.abs(b.x - a.x) * 0.5; return `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`; }
        function redraw() { cords.forEach((c) => { if (nodes[c.src] && nodes[c.tgt]) c.path.setAttribute("d", curve(center(nodes[c.src].el), center(nodes[c.tgt].el))); }); }

        function register(el, o) { o = o || {}; const id = o.id; nodes[id] = { el, role: o.role || "source", color: o.color }; el.classList.add("zg-cord-node", "zg-cord-" + (o.role || "source")); el.dataset.cordId = id; return id; }
        function makePath(color) { const p = document.createElementNS(NS, "path"); p.setAttribute("class", "zg-cord"); p.setAttribute("stroke", color || opts.color || "var(--cyan)"); svg.appendChild(p); return p; }
        function connect(a, b) { if (cords.some((c) => c.src === a && c.tgt === b)) return; const p = makePath(nodes[a] && nodes[a].color); cords.push({ src: a, tgt: b, path: p }); redraw(); if (typeof opts.onConnect === "function") opts.onConnect(a, b); }
        function disconnect(a, b) { const i = cords.findIndex((c) => c.src === a && c.tgt === b); if (i < 0) return; svg.removeChild(cords[i].path); cords.splice(i, 1); if (typeof opts.onDisconnect === "function") opts.onDisconnect(a, b); }

        host.addEventListener("pointerdown", (e) => { const n = e.target.closest(".zg-cord-source"); if (!n) return; dragFrom = n.dataset.cordId; tempPath = makePath(nodes[dragFrom] && nodes[dragFrom].color); tempPath.classList.add("temp"); e.preventDefault(); });
        host.addEventListener("pointermove", (e) => { if (!dragFrom || !tempPath) return; const hr = host.getBoundingClientRect(); const b = { x: e.clientX - hr.left + host.scrollLeft, y: e.clientY - hr.top + host.scrollTop }; tempPath.setAttribute("d", curve(center(nodes[dragFrom].el), b)); });
        host.addEventListener("pointerup", (e) => { if (!dragFrom) return; const t = e.target.closest(".zg-cord-target"); if (tempPath) { svg.removeChild(tempPath); tempPath = null; } if (t) connect(dragFrom, t.dataset.cordId); dragFrom = null; });
        host.addEventListener("scroll", redraw);
        if (window.ResizeObserver) new ResizeObserver(redraw).observe(host);

        return {
            el: svg, register, connect, disconnect, redraw,
            flow(src, tgt, t) { const c = cords.find((x) => x.src === src && x.tgt === tgt); if (!c || !nodes[src] || !nodes[tgt]) return; const a = center(nodes[src].el), b = center(nodes[tgt].el); if (!c.pip) { c.pip = document.createElementNS(NS, "circle"); c.pip.setAttribute("r", "3"); c.pip.setAttribute("class", "zg-cord-pip"); c.pip.setAttribute("fill", (nodes[src].color) || "var(--cyan)"); svg.appendChild(c.pip); } const tt = Math.max(0, Math.min(1, t)); c.pip.setAttribute("cx", a.x + (b.x - a.x) * tt); c.pip.setAttribute("cy", a.y + (b.y - a.y) * tt); },
            clear() { cords.splice(0).forEach((c) => { svg.removeChild(c.path); if (c.pip) svg.removeChild(c.pip); }); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.modCordOverlay = modCordOverlay;
})();
