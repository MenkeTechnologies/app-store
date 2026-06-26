// zgui-core/pad-grid.js — a grid of trigger pads (drum machine / sampler / launchpad): each pad has a
// label, a color, and optional solo/mute toggles; clicking triggers it and flashes "playing". Extracted
// from the Bitwig DRUM MACHINE cell grid. window.ZGui.padGrid.
//   ZGui.padGrid(container, { cols:4, pads:[{id,label,color,empty,solo,mute}], showSM:true,
//       onTrigger(pad,i), onToggle(pad,prop,on), onAdd(i) }) ->
//       { el, set(pads), flash(i), setPad(i,patch) }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function padGrid(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let pads = (opts.pads || []).slice();
        const cols = opts.cols || 4;

        const root = document.createElement("div"); root.className = "zg-padgrid";
        root.style.gridTemplateColumns = `repeat(${cols},1fr)`;
        host.appendChild(root);

        function padHtml(p, i) {
            if (!p || p.empty) return `<div class="zg-pad empty" data-i="${i}"><button class="zg-pad-add" data-add="${i}">+</button></div>`;
            const sm = opts.showSM !== false
                ? `<div class="zg-pad-sm"><button class="zg-pad-s${p.solo ? " on" : ""}" data-tgl="solo" data-i="${i}">S</button><button class="zg-pad-m${p.mute ? " on" : ""}" data-tgl="mute" data-i="${i}">M</button></div>` : "";
            return `<div class="zg-pad" data-i="${i}"${p.color ? ` style="--zg-pad-col:${p.color}"` : ""}>`
                + `<button class="zg-pad-play" data-play="${i}" title="Trigger">▶</button>`
                + `<div class="zg-pad-label" title="${esc(p.label || "")}">${esc(p.label || "")}</div>${sm}</div>`;
        }
        function render() { root.innerHTML = pads.map(padHtml).join(""); }
        function flash(i) { const el = root.querySelector(`.zg-pad[data-i="${i}"]`); if (el) { el.classList.add("playing"); setTimeout(() => el.classList.remove("playing"), 160); } }

        root.addEventListener("click", (e) => {
            const add = e.target.closest("[data-add]"); if (add) { if (typeof opts.onAdd === "function") opts.onAdd(+add.dataset.add); return; }
            const tgl = e.target.closest("[data-tgl]");
            if (tgl) { const i = +tgl.dataset.i, prop = tgl.dataset.tgl; pads[i][prop] = !pads[i][prop]; tgl.classList.toggle("on", pads[i][prop]); if (typeof opts.onToggle === "function") opts.onToggle(pads[i], prop, pads[i][prop]); return; }
            const play = e.target.closest("[data-play]"); const cell = e.target.closest(".zg-pad:not(.empty)");
            if (play || cell) { const i = +((play || cell).dataset.play || cell.dataset.i); flash(i); if (typeof opts.onTrigger === "function") opts.onTrigger(pads[i], i); }
        });

        render();
        return { el: root, set(p) { pads = (p || []).slice(); render(); }, flash, setPad(i, patch) { pads[i] = Object.assign({}, pads[i], patch); render(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.padGrid = padGrid;
})();
