// zgui-core/patchbay.js — the modular patching kit, distilled from zpwr-patch-core's synth graph:
// jacks (ports), bezier patch cables between them, and module/block cards. The synth's full engine
// is JUCE-graph-coupled (gain, bus routing, zoom/scroll); this is the GENERIC kernel — connect any
// two `[data-key]` jacks with a drag, draw the cable, fire callbacks. Reusable for modular synths,
// node editors, signal-flow / patch UIs. window.ZGui.{jack, patchbay, module}.
//
//   ZGui.jack(parent, { kind:'in'|'out', key, label }) -> <span class="jack …" data-key>
//   ZGui.patchbay(container, { onConnect(from,to), onDisconnect(from,to), color })
//        -> { el, setConnections([{from,to,color}]), connect(f,t), disconnect(f,t), redraw() }
//   ZGui.module({ title, bypassed, onBypass, onDelete, reorderable }) -> { el, head, body,
//        addInput(key,label), addOutput(key,label) }
(function () {
    "use strict";
    const SVGNS = "http://www.w3.org/2000/svg";
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    function svg(t, attrs, p) { const e = document.createElementNS(SVGNS, t); for (const k in (attrs || {})) e.setAttribute(k, attrs[k]); if (p) p.appendChild(e); return e; }

    function jack(parent, opts) {
        opts = opts || {};
        const kind = opts.kind === "out" ? "out" : "in";
        const j = el("span", "jack jack-" + kind, parent);
        if (opts.key != null) j.dataset.key = opts.key;
        j.title = kind === "out" ? "Output — drag to an input to wire it" : "Input — drag a source here";
        if (opts.label != null) j.title = opts.label + " — " + j.title;
        return j;
    }

    function patchbay(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        if (getComputedStyle(host).position === "static") host.style.position = "relative";
        const layer = svg("svg", { class: "zg-cables" }, host);
        layer.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;overflow:visible";
        let conns = [];

        function jackCenter(key) {
            const e = host.querySelector(`[data-key="${key}"]`);
            if (!e) return null;
            const r = e.getBoundingClientRect(), hr = host.getBoundingClientRect();
            return { x: r.left + r.width / 2 - hr.left + host.scrollLeft, y: r.top + r.height / 2 - hr.top + host.scrollTop };
        }
        function cablePath(a, b) {
            const dx = Math.max(28, Math.abs(b.x - a.x) * 0.4);
            return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
        }
        function redraw() {
            layer.innerHTML = "";
            layer.setAttribute("width", host.scrollWidth);
            layer.setAttribute("height", host.scrollHeight);
            conns.forEach((c) => {
                const a = jackCenter(c.from), b = jackCenter(c.to);
                if (!a || !b) return;
                const hit = svg("path", { d: cablePath(a, b), fill: "none", stroke: "transparent", "stroke-width": "12", "pointer-events": "stroke", style: "cursor:pointer" }, layer);
                svg("path", { d: cablePath(a, b), fill: "none", stroke: c.color || opts.color || "var(--cyan)", "stroke-width": "2.5", "stroke-linecap": "round", filter: "drop-shadow(0 0 3px " + (c.color || "var(--cyan-glow)") + ")" }, layer);
                hit.addEventListener("pointerdown", (e) => { e.stopPropagation(); disconnect(c.from, c.to); });
            });
        }
        function connect(from, to) {
            if (conns.some((c) => c.from === from && c.to === to)) return;
            conns.push({ from, to });
            redraw();
            if (typeof opts.onConnect === "function") opts.onConnect(from, to);
        }
        function disconnect(from, to) {
            conns = conns.filter((c) => !(c.from === from && c.to === to));
            redraw();
            if (typeof opts.onDisconnect === "function") opts.onDisconnect(from, to);
        }

        // drag-to-wire: pointerdown on a jack → temp cable follows the cursor → drop on a jack.
        let dragKey = null, ghost = null;
        host.addEventListener("pointerdown", (e) => {
            const j = e.target.closest(".jack");
            if (!j || !j.dataset.key) return;
            dragKey = j.dataset.key;
            ghost = svg("path", { fill: "none", stroke: "var(--cyan)", "stroke-width": "2.5", "stroke-dasharray": "5 4", "stroke-linecap": "round" }, layer);
            e.preventDefault();
        });
        host.addEventListener("pointermove", (e) => {
            if (!dragKey || !ghost) return;
            const a = jackCenter(dragKey), hr = host.getBoundingClientRect();
            const b = { x: e.clientX - hr.left + host.scrollLeft, y: e.clientY - hr.top + host.scrollTop };
            if (a) ghost.setAttribute("d", cablePath(a, b));
            const over = e.target.closest && e.target.closest(".jack");
            host.querySelectorAll(".jack.snap").forEach((x) => x.classList.remove("snap"));
            if (over && over.dataset.key && over.dataset.key !== dragKey) over.classList.add("snap");
        });
        host.addEventListener("pointerup", (e) => {
            if (!dragKey) return;
            const over = e.target.closest && e.target.closest(".jack");
            if (over && over.dataset.key && over.dataset.key !== dragKey) connect(dragKey, over.dataset.key);
            if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
            host.querySelectorAll(".jack.snap").forEach((x) => x.classList.remove("snap"));
            ghost = null; dragKey = null;
        });
        window.addEventListener("resize", redraw);

        return {
            el: layer,
            setConnections(list) { conns = (list || []).map((c) => ({ from: c.from, to: c.to, color: c.color })); redraw(); },
            connect, disconnect, redraw,
            get connections() { return conns.slice(); },
        };
    }

    function module(opts) {
        opts = opts || {};
        // opts.bezel → the brushed-metal hardware bezel (module.png 9-slice border-image + raised
        // shadow + accent strip); see chassis.css. Without it, the flat .block card style is used.
        const card = el("div", "block" + (opts.bezel ? " zg-module-bezel" : ""));
        const head = el("div", "block-head", card);
        if (opts.reorderable !== false) { const grip = el("span", "block-grip", head, "⠿"); grip.title = "Drag to reorder"; }
        el("span", "block-title", head).innerHTML = (window.escapeHtml ? window.escapeHtml(opts.title || "") : (opts.title || ""));
        if (opts.onBypass) {
            const byp = el("button", "block-byp" + (opts.bypassed ? " on" : ""), head, "⏻"); byp.type = "button"; byp.title = "Bypass";
            byp.addEventListener("click", () => { byp.classList.toggle("on"); opts.onBypass(byp.classList.contains("on")); });
        }
        if (opts.onDelete) { const del = el("button", "block-del", head, "✕"); del.type = "button"; del.title = "Remove"; del.addEventListener("click", () => opts.onDelete()); }
        const inRow = el("div", "block-jacks block-in", card);
        const body = el("div", "block-body", card);
        const outRow = el("div", "block-jacks block-out", card);
        return {
            el: card, head, body,
            addInput(key, label) { const w = el("span", "jack-wrap", inRow); if (label != null) el("span", "jack-lbl", w, label); return jack(w, { kind: "in", key, label }); },
            addOutput(key, label) { const w = el("span", "jack-wrap", outRow); if (label != null) el("span", "jack-lbl", w, label); return jack(w, { kind: "out", key, label }); },
        };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.jack = jack;
    window.ZGui.patchbay = patchbay;
    window.ZGui.module = module;
})();
