// zgui-core/pipe-graph.js — a left→right dataflow of a pipeline: each stage is a node, edges widen with
// byte volume and pulse with throughput; a stalled stage goes red. Live `cmd1 | cmd2 | cmd3` introspection.
// window.ZGui.pipeGraph.
//   ZGui.pipeGraph(container, { stages:[{label,bytes,rate,status}], onSelect(stage,i) }) ->
//       { el, set(stages), update(i,patch), pulse(i) }
//   status ∈ ok|stall|err ; rate drives the pulse speed; bytes drives edge thickness.
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function fmtBytes(b) { if (b == null) return ""; if (b < 1024) return b + "B"; if (b < 1048576) return (b / 1024).toFixed(1) + "K"; if (b < 1073741824) return (b / 1048576).toFixed(1) + "M"; return (b / 1073741824).toFixed(1) + "G"; }
    function pipeGraph(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let stages = (opts.stages || []).slice();
        const root = document.createElement("div"); root.className = "zg-pipegraph";
        host.appendChild(root);

        function maxBytes() { return Math.max.apply(null, stages.map((s) => s.bytes || 0).concat([1])); }
        function render() {
            const mb = maxBytes();
            let html = "";
            stages.forEach((s, i) => {
                if (i > 0) { const prev = stages[i - 1]; const w = 1 + Math.round(((prev.bytes || 0) / mb) * 6); const speed = Math.max(0.4, 2 - (prev.rate || 0)); const stalled = prev.status === "stall" || prev.status === "err"; html += `<div class="zg-pipegraph-edge ${stalled ? "stall" : "live"}" style="--zg-pe-w:${w}px;--zg-pe-speed:${speed}s"><span class="zg-pipegraph-flow"></span></div>`; }
                html += `<div class="zg-pipegraph-node ${s.status || "ok"}" data-i="${i}"><div class="zg-pipegraph-label">${esc(s.label)}</div><div class="zg-pipegraph-bytes">${fmtBytes(s.bytes)}${s.rate != null ? " · " + fmtBytes(s.rate) + "/s" : ""}</div></div>`;
            });
            root.innerHTML = html;
        }
        root.addEventListener("click", (e) => { const n = e.target.closest(".zg-pipegraph-node"); if (n && typeof opts.onSelect === "function") opts.onSelect(stages[+n.dataset.i], +n.dataset.i); });
        render();
        return { el: root, set(s) { stages = (s || []).slice(); render(); }, update(i, patch) { if (stages[i]) { Object.assign(stages[i], patch); render(); } }, pulse(i) { const n = root.querySelector(`.zg-pipegraph-node[data-i="${i}"]`); if (n) { n.classList.add("hit"); setTimeout(() => n.classList.remove("hit"), 150); } } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.pipeGraph = pipeGraph;
})();
