// zgui-core/parallel-lanes.js — N concurrent tasks as racing lanes: each lane a progress track with a
// moving runner, a live ETA and a status color. Concurrency-native progress (vs one linear bar) for
// fan-out work (16 instances / 18 threads). window.ZGui.parallelLanes.
//   ZGui.parallelLanes(container, { lanes:[{id,label,progress,eta,status}], onSelect(lane,i) }) ->
//       { el, set(lanes), update(id,patch) }
//   progress 0..1; status ∈ run|done|err|wait.
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function parallelLanes(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let lanes = (opts.lanes || []).slice();
        const root = document.createElement("div"); root.className = "zg-pllanes";
        host.appendChild(root);

        function laneHtml(l, i) {
            const pct = Math.round((l.progress || 0) * 100), st = l.status || "run";
            return `<div class="zg-pllane ${st}" data-i="${i}" data-id="${esc(l.id != null ? l.id : i)}">`
                + `<div class="zg-pllane-label">${esc(l.label)}</div>`
                + `<div class="zg-pllane-track"><div class="zg-pllane-fill" style="width:${pct}%"></div><div class="zg-pllane-runner" style="left:${pct}%"></div></div>`
                + `<div class="zg-pllane-meta">${st === "done" ? "✓" : st === "err" ? "✗" : pct + "%"}${l.eta ? " · " + esc(l.eta) : ""}</div></div>`;
        }
        function render() { root.innerHTML = lanes.map(laneHtml).join(""); }
        function updateOne(i) { const el = root.children[i]; if (!el) return render(); const l = lanes[i], pct = Math.round((l.progress || 0) * 100), st = l.status || "run"; el.className = "zg-pllane " + st; el.querySelector(".zg-pllane-fill").style.width = pct + "%"; el.querySelector(".zg-pllane-runner").style.left = pct + "%"; el.querySelector(".zg-pllane-meta").textContent = (st === "done" ? "✓" : st === "err" ? "✗" : pct + "%") + (l.eta ? " · " + l.eta : ""); }
        root.addEventListener("click", (e) => { const l = e.target.closest(".zg-pllane"); if (l && typeof opts.onSelect === "function") opts.onSelect(lanes[+l.dataset.i], +l.dataset.i); });
        render();
        return { el: root, set(l) { lanes = (l || []).slice(); render(); }, update(id, patch) { const i = lanes.findIndex((x) => String(x.id) === String(id)); if (i < 0) return; Object.assign(lanes[i], patch); updateOne(i); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.parallelLanes = parallelLanes;
})();
