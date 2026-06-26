// zgui-core/node-graph.js — a left→right lane graph editor: nodes arranged in titled columns,
// bezier SVG edges between them, click-to-select and click-to-connect (pick a source node, then a
// target). Distilled from zgo's Alfred workflow canvas — the GENERIC kernel; the host supplies the
// node/edge model + callbacks and colours each category via a node `className`. window.ZGui.nodeGraph.
//
//   ZGui.nodeGraph(host, {
//       columns:[{ id, title }],
//       nodes:[{ id, column, name, type, className }],
//       edges:[{ from, to }],
//       selected, connectSource,
//       onSelect(id), onConnect(from, to), onBackground()
//   }) -> { el, setData(opts), select(id), setConnectSource(id), redraw(), destroy() }
//
// Edges run from a node's right edge to the target's left edge. The host owns the model: callbacks
// fire on interaction, the host mutates its state and calls setData() to re-render.
(function () {
  "use strict";
  const SVGNS = "http://www.w3.org/2000/svg";
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function raf(fn) { (window.requestAnimationFrame || function (f) { f(); })(fn); }

  function nodeGraph(host, opts) {
    host = typeof host === "string" ? document.querySelector(host) : host;
    if (!host) return null;
    let cfg = Object.assign({ columns: [], nodes: [], edges: [] }, opts || {});

    const canvas = el("div", "zg-graph");
    host.appendChild(canvas);
    const nodeEls = {};
    let svgRef = null;

    function render() {
      canvas.textContent = "";
      const svg = document.createElementNS(SVGNS, "svg");
      svg.setAttribute("class", "zg-graph-svg");
      canvas.appendChild(svg);

      const cols = el("div", "zg-graph-cols");
      const colEls = {};
      (cfg.columns || []).forEach(function (c) {
        const col = el("div", "zg-graph-col");
        if (c.title != null) col.appendChild(el("div", "zg-graph-col-head", c.title));
        colEls[c.id] = col;
        cols.appendChild(col);
      });

      Object.keys(nodeEls).forEach(function (k) { delete nodeEls[k]; });
      (cfg.nodes || []).forEach(function (n) {
        const col = colEls[n.column];
        if (!col) return;
        const node = el("div", "zg-graph-node" + (n.className ? " " + n.className : ""));
        node.dataset.id = n.id;
        if (n.name != null) node.appendChild(el("div", "zg-graph-node-name", n.name));
        if (n.type != null) node.appendChild(el("div", "zg-graph-node-type", n.type));
        if (cfg.selected === n.id) node.classList.add("zg-graph-node--sel");
        if (cfg.connectSource === n.id) node.classList.add("zg-graph-node--connect");
        node.addEventListener("click", function (e) { e.stopPropagation(); onNode(n.id); });
        col.appendChild(node);
        nodeEls[n.id] = node;
      });
      canvas.appendChild(cols);

      svgRef = svg;
      raf(function () { drawEdges(svg); });
    }

    function onNode(id) {
      if (cfg.connectSource && cfg.connectSource !== id) {
        if (typeof cfg.onConnect === "function") cfg.onConnect(cfg.connectSource, id);
        return;
      }
      if (typeof cfg.onSelect === "function") cfg.onSelect(id);
    }

    function drawEdges(svg) {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const base = canvas.getBoundingClientRect();
      let maxX = 0, maxY = 0;
      (cfg.edges || []).forEach(function (edge) {
        const sEl = nodeEls[edge.from], dEl = nodeEls[edge.to];
        if (!sEl || !dEl) return;
        const sr = sEl.getBoundingClientRect(), dr = dEl.getBoundingClientRect();
        const x1 = sr.right - base.left + canvas.scrollLeft;
        const y1 = sr.top + sr.height / 2 - base.top + canvas.scrollTop;
        const x2 = dr.left - base.left + canvas.scrollLeft;
        const y2 = dr.top + dr.height / 2 - base.top + canvas.scrollTop;
        const mx = (x1 + x2) / 2;
        const path = document.createElementNS(SVGNS, "path");
        path.setAttribute("class", "zg-graph-edge");
        path.setAttribute("d", "M" + x1 + "," + y1 + " C" + mx + "," + y1 + " " + mx + "," + y2 + " " + x2 + "," + y2);
        svg.appendChild(path);
        maxX = Math.max(maxX, x1, x2);
        maxY = Math.max(maxY, y1, y2);
      });
      svg.setAttribute("width", String(maxX + 40));
      svg.setAttribute("height", String(maxY + 40));
    }

    // A click that reaches the canvas (nodes stop propagation) is a background click.
    canvas.addEventListener("click", function () {
      if (typeof cfg.onBackground === "function") cfg.onBackground();
    });

    function onResize() { if (svgRef) drawEdges(svgRef); }
    window.addEventListener("resize", onResize);

    render();

    return {
      el: canvas,
      setData: function (next) { cfg = Object.assign(cfg, next || {}); render(); },
      select: function (id) { cfg.selected = id; render(); },
      setConnectSource: function (id) { cfg.connectSource = id; render(); },
      redraw: function () { if (svgRef) drawEdges(svgRef); },
      destroy: function () {
        window.removeEventListener("resize", onResize);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      },
    };
  }

  window.ZGui = window.ZGui || {};
  window.ZGui.nodeGraph = nodeGraph;
})();
