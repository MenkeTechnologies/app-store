// zgui-core/command-flow.js — a live ribbon of recent shell commands as flowing tiles: exit-status
// color, a duration mini-bar, a pipe-depth glyph; click a tile to drill into its output, the ↻ to re-run.
// Time-as-space command history (a scrollback alternative). window.ZGui.commandFlow.
//   ZGui.commandFlow(container, { commands:[{cmd,status,ms,pipes}], max:60, onDrill(cmd,i), onRerun(cmd,i) }) ->
//       { el, push(cmd), set(commands), clear() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function commandFlow(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const max = opts.max || 60;
        let cmds = (opts.commands || []).slice(-max);
        const root = document.createElement("div"); root.className = "zg-cmdflow";
        host.appendChild(root);

        function maxMs() { return Math.max.apply(null, cmds.map((c) => c.ms || 0).concat([1])); }
        function tile(c, i) {
            const ok = (c.status || 0) === 0, mm = maxMs();
            const dur = Math.max(2, Math.round(((c.ms || 0) / mm) * 100));
            const pipes = c.pipes ? '<span class="zg-cmdflow-pipes">' + "•".repeat(Math.min(6, c.pipes)) + "</span>" : "";
            return `<div class="zg-cmdflow-tile ${ok ? "ok" : "err"}" data-i="${i}" title="${esc(c.cmd)} — ${c.status == null ? "" : "exit " + c.status} ${c.ms != null ? c.ms + "ms" : ""}">`
                + `<button class="zg-cmdflow-rerun" data-rerun="${i}" title="Re-run">↻</button>`
                + `<div class="zg-cmdflow-cmd">${esc(c.cmd)}</div>${pipes}`
                + `<div class="zg-cmdflow-bar"><span style="width:${dur}%"></span></div></div>`;
        }
        function render() { root.innerHTML = cmds.map(tile).join(""); root.scrollLeft = root.scrollWidth; }
        root.addEventListener("click", (e) => {
            const rr = e.target.closest("[data-rerun]"); if (rr) { e.stopPropagation(); if (typeof opts.onRerun === "function") opts.onRerun(cmds[+rr.dataset.rerun], +rr.dataset.rerun); return; }
            const t = e.target.closest(".zg-cmdflow-tile"); if (t && typeof opts.onDrill === "function") opts.onDrill(cmds[+t.dataset.i], +t.dataset.i);
        });
        render();
        return { el: root, push(c) { cmds.push(c); if (cmds.length > max) cmds.shift(); render(); }, set(c) { cmds = (c || []).slice(-max); render(); }, clear() { cmds = []; render(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.commandFlow = commandFlow;
})();
