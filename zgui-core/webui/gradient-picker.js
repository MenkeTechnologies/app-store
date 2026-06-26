// zgui-core/gradient-picker.js — build a CSS gradient: draggable color stops on a bar (double-click
// to add, pick a color for the selected stop, remove it), with a live preview + the CSS string.
// window.ZGui.gradientPicker.
//   ZGui.gradientPicker(host, { stops:[{pos,color}], type:'linear'|'radial', angle:90, onChange }) -> { el, get(), css() }
(function () {
  "use strict";
  function gradientPicker(host, opts) {
    opts = opts || {};
    const type = opts.type || "linear";
    const angle = opts.angle != null ? opts.angle : 90;
    let stops = (opts.stops && opts.stops.slice()) || [{ pos: 0, color: "#05d9e8" }, { pos: 1, color: "#ff2a6d" }];
    let sel = 0;

    const wrap = document.createElement("div"); wrap.className = "zg-grad";
    const bar = document.createElement("div"); bar.className = "zg-grad-bar";
    const ctrl = document.createElement("div"); ctrl.className = "zg-grad-ctrl";
    const color = document.createElement("input"); color.type = "color"; color.className = "zg-grad-color";
    const del = document.createElement("button"); del.type = "button"; del.className = "zg-grad-del"; del.textContent = "Remove stop";
    ctrl.appendChild(color); ctrl.appendChild(del);
    const preview = document.createElement("div"); preview.className = "zg-grad-preview";
    const exprEl = document.createElement("code"); exprEl.className = "zg-grad-expr";
    wrap.appendChild(bar); wrap.appendChild(ctrl); wrap.appendChild(preview); wrap.appendChild(exprEl);
    if (host) host.appendChild(wrap);

    function sorted() { return stops.slice().sort(function (a, b) { return a.pos - b.pos; }); }
    function listCss() { return sorted().map(function (s) { return s.color + " " + Math.round(s.pos * 100) + "%"; }).join(", "); }
    function css() { return type === "radial" ? "radial-gradient(circle, " + listCss() + ")" : "linear-gradient(" + angle + "deg, " + listCss() + ")"; }
    function toHex(c) { return /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#000000"; }
    function render() {
      bar.style.background = "linear-gradient(90deg, " + listCss() + ")";
      Array.prototype.slice.call(bar.querySelectorAll(".zg-grad-stop")).forEach(function (n) { n.remove(); });
      stops.forEach(function (s, i) {
        const h = document.createElement("span");
        h.className = "zg-grad-stop" + (i === sel ? " zg-grad-sel" : "");
        h.style.left = (s.pos * 100) + "%"; h.style.background = s.color;
        h.addEventListener("pointerdown", function (e) { sel = i; startDrag(e, i); render(); e.stopPropagation(); });
        bar.appendChild(h);
      });
      color.value = toHex(stops[sel].color);
      preview.style.background = css();
      exprEl.textContent = css();
      if (opts.onChange) opts.onChange(css());
    }
    function startDrag(e, i) {
      function mv(ev) { const r = bar.getBoundingClientRect(); stops[i].pos = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)); render(); }
      function up() { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }
      document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
    }
    bar.addEventListener("dblclick", function (e) { const r = bar.getBoundingClientRect(); const pos = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); stops.push({ pos: pos, color: "#39ff14" }); sel = stops.length - 1; render(); });
    color.addEventListener("input", function () { stops[sel].color = color.value; render(); });
    del.addEventListener("click", function () { if (stops.length > 2) { stops.splice(sel, 1); sel = 0; render(); } });
    render();
    return { el: wrap, get: function () { return stops.slice(); }, css: css };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.gradientPicker = gradientPicker;
})();
