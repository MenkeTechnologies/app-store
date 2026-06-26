// zgui-core/donut.js — a donut / ring proportion chart (multi-segment), distinct from the
// single-value radial `gauge` and the line/bar `chart`. SVG, no dependency. window.ZGui.donut.
//   ZGui.donut({ segments:[{value,color,label}], size?, thickness?, centerLabel?, centerSub? })
//     -> { el, set(segments) }
(function () {
    "use strict";
    const NS = "http://www.w3.org/2000/svg";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    const PALETTE = ["var(--cyan)", "var(--magenta)", "var(--accent)", "var(--green)", "var(--red)"];
    function donut(opts) {
        opts = opts || {};
        const size = opts.size || 120;
        const thickness = opts.thickness || 16;
        const r = (size - thickness) / 2;
        const cx = size / 2;
        const circ = 2 * Math.PI * r;

        const el = document.createElement("div");
        el.className = "zg-donut";
        const svg = document.createElementNS(NS, "svg");
        svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
        svg.setAttribute("width", size);
        svg.setAttribute("height", size);
        el.appendChild(svg);
        const center = document.createElement("div");
        center.className = "zg-donut-center";
        el.appendChild(center);

        function set(segments) {
            segments = segments || [];
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            const track = document.createElementNS(NS, "circle");
            track.setAttribute("cx", cx); track.setAttribute("cy", cx); track.setAttribute("r", r);
            track.setAttribute("fill", "none");
            track.setAttribute("stroke", "var(--border)");
            track.setAttribute("stroke-width", thickness);
            svg.appendChild(track);

            const total = segments.reduce((a, s) => a + (s.value || 0), 0) || 1;
            let offset = 0;
            segments.forEach((s, i) => {
                const frac = (s.value || 0) / total;
                const arc = document.createElementNS(NS, "circle");
                arc.setAttribute("cx", cx); arc.setAttribute("cy", cx); arc.setAttribute("r", r);
                arc.setAttribute("fill", "none");
                arc.setAttribute("stroke", s.color || PALETTE[i % PALETTE.length]);
                arc.setAttribute("stroke-width", thickness);
                arc.setAttribute("stroke-dasharray", `${frac * circ} ${circ}`);
                arc.setAttribute("stroke-dashoffset", -offset * circ);
                arc.setAttribute("transform", `rotate(-90 ${cx} ${cx})`);
                if (s.label) { const t = document.createElementNS(NS, "title"); t.textContent = `${s.label}: ${s.value}`; arc.appendChild(t); }
                svg.appendChild(arc);
                offset += frac;
            });
            center.innerHTML = (opts.centerLabel != null ? `<span class="zg-donut-label">${esc(opts.centerLabel)}</span>` : "")
                + (opts.centerSub != null ? `<span class="zg-donut-sub">${esc(opts.centerSub)}</span>` : "");
        }
        set(opts.segments);
        return { el, set };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.donut = donut;
})();
