// zgui-core/step-sequencer.js — a step grid (drum/note pattern): one row per track, N step cells you
// toggle on/off, beat-grouped, with a moving playhead column. A core DAW component. window.ZGui.stepSequencer.
//   ZGui.stepSequencer(container, { rows:[{label,color,steps:[bool|{on,vel}]}], steps:16, group:4,
//       onToggle(rowIndex,step,on), onVelocity(rowIndex,step,vel), playStep:-1 }) ->
//       { el, set(rows), setPlayStep(i), toggle(r,s), getRows() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function stepSequencer(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const steps = opts.steps || 16, group = opts.group || 4;
        let rows = (opts.rows || []).map((r) => ({ label: r.label, color: r.color, steps: normalize(r.steps) }));
        function normalize(arr) { const out = []; for (let i = 0; i < steps; i++) { const v = arr && arr[i]; out.push(v && typeof v === "object" ? { on: !!v.on, vel: v.vel == null ? 1 : v.vel } : { on: !!v, vel: 1 }); } return out; }

        const root = document.createElement("div"); root.className = "zg-stepseq"; root.style.setProperty("--zg-steps", steps);
        host.appendChild(root);

        function render() {
            root.innerHTML = rows.map((r, ri) =>
                `<div class="zg-stepseq-row"${r.color ? ` style="--zg-step-col:${r.color}"` : ""}>`
                + `<div class="zg-stepseq-label" title="${esc(r.label || "")}">${esc(r.label || "")}</div>`
                + `<div class="zg-stepseq-cells">`
                + r.steps.map((c, si) => `<button class="zg-stepseq-cell${c.on ? " on" : ""}${si % group === 0 ? " beat" : ""}" data-r="${ri}" data-s="${si}" style="--zg-vel:${c.vel}"></button>`).join("")
                + "</div></div>").join("");
            setPlayStep(playStep);
        }
        let playStep = opts.playStep == null ? -1 : opts.playStep;
        function setPlayStep(i) { playStep = i; root.querySelectorAll(".zg-stepseq-cell.playing").forEach((c) => c.classList.remove("playing")); if (i >= 0) root.querySelectorAll(`.zg-stepseq-cell[data-s="${i}"]`).forEach((c) => c.classList.add("playing")); }
        function toggle(ri, si) { const c = rows[ri].steps[si]; c.on = !c.on; const el = root.querySelector(`.zg-stepseq-cell[data-r="${ri}"][data-s="${si}"]`); if (el) el.classList.toggle("on", c.on); if (typeof opts.onToggle === "function") opts.onToggle(ri, si, c.on); }

        root.addEventListener("click", (e) => { const cell = e.target.closest(".zg-stepseq-cell"); if (cell) toggle(+cell.dataset.r, +cell.dataset.s); });
        // wheel over a lit cell nudges velocity
        root.addEventListener("wheel", (e) => {
            const cell = e.target.closest(".zg-stepseq-cell"); if (!cell) return; const c = rows[+cell.dataset.r].steps[+cell.dataset.s]; if (!c.on) return;
            e.preventDefault(); c.vel = Math.max(0.1, Math.min(1, c.vel + (e.deltaY < 0 ? 0.1 : -0.1))); cell.style.setProperty("--zg-vel", c.vel);
            if (typeof opts.onVelocity === "function") opts.onVelocity(+cell.dataset.r, +cell.dataset.s, c.vel);
        }, { passive: false });

        render();
        return { el: root, set(r) { rows = (r || []).map((x) => ({ label: x.label, color: x.color, steps: normalize(x.steps) })); render(); }, setPlayStep, toggle, getRows() { return rows; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.stepSequencer = stepSequencer;
})();
