// zgui-core/cron-editor.js — build a 5-field cron expression (minute hour day-of-month month
// day-of-week) from labelled inputs, with the live expression + a plain-English summary.
// window.ZGui.cronEditor.
//   ZGui.cronEditor(host, { value:'* * * * *', onChange }) -> { el, get(), set(expr) }
(function () {
  "use strict";
  const FIELDS = [
    { key: "min", label: "Min", placeholder: "0-59" },
    { key: "hour", label: "Hour", placeholder: "0-23" },
    { key: "dom", label: "Day", placeholder: "1-31" },
    { key: "month", label: "Month", placeholder: "1-12" },
    { key: "dow", label: "Weekday", placeholder: "0-6" },
  ];
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function pad(v) { return /^\d+$/.test(v) ? String(v).padStart(2, "0") : v; }
  function describe(p) {
    const m = p[0], h = p[1], dom = p[2], mon = p[3], dow = p[4];
    if (p.every(function (x) { return x === "*"; })) return "Every minute";
    let s;
    if (h !== "*" && m !== "*") s = "At " + pad(h) + ":" + pad(m);
    else if (m !== "*") s = "At minute " + m;
    else if (h !== "*") s = "Every minute past hour " + h;
    else s = "Every minute";
    if (dom !== "*") s += ", on day " + dom + " of the month";
    if (mon !== "*") s += ", in month " + mon;
    if (dow !== "*") s += ", on " + (/^\d$/.test(dow) ? DOW[+dow] || dow : dow);
    return s;
  }
  function cronEditor(host, opts) {
    opts = opts || {};
    const wrap = document.createElement("div"); wrap.className = "zg-cron";
    const row = document.createElement("div"); row.className = "zg-cron-row"; wrap.appendChild(row);
    const inputs = {};
    const initial = (opts.value || "* * * * *").trim().split(/\s+/);
    FIELDS.forEach(function (f, i) {
      const cell = document.createElement("div"); cell.className = "zg-cron-cell";
      const lbl = document.createElement("label"); lbl.className = "zg-cron-label"; lbl.textContent = f.label;
      const inp = document.createElement("input"); inp.className = "zg-cron-input zs-input"; inp.value = initial[i] || "*"; inp.placeholder = f.placeholder; inp.spellcheck = false;
      inp.addEventListener("input", update);
      cell.appendChild(lbl); cell.appendChild(inp); row.appendChild(cell);
      inputs[f.key] = inp;
    });
    const out = document.createElement("div"); out.className = "zg-cron-out";
    const expr = document.createElement("code"); expr.className = "zg-cron-expr";
    const human = document.createElement("span"); human.className = "zg-cron-human";
    out.appendChild(expr); out.appendChild(human); wrap.appendChild(out);
    if (host) host.appendChild(wrap);

    function parts() { return FIELDS.map(function (f) { return inputs[f.key].value.trim() || "*"; }); }
    function update() { const p = parts(); const s = p.join(" "); expr.textContent = s; human.textContent = describe(p); if (opts.onChange) opts.onChange(s); }
    function set(e) { const a = (e || "").trim().split(/\s+/); FIELDS.forEach(function (f, i) { inputs[f.key].value = a[i] || "*"; }); update(); }
    update();
    return { el: wrap, get: function () { return parts().join(" "); }, set: set };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.cronEditor = cronEditor;
})();
