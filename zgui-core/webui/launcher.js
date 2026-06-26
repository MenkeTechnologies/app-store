// zgui-core/launcher.js — a standalone spotlight/launcher window: a brand sigil + query input, a
// rich two-line result list (icon + title + subtitle + a right "kind" badge), keyboard nav, and a
// footer hint legend + result count. Distilled from zgo's main window (.zgo-search/.zgo-row/.zgo-foot).
// Distinct from command-palette (a compact ⌘K overlay) — this is an app's full search window, with a
// built-in subsequence filter or a host-supplied onQuery. window.ZGui.launcher.
//   ZGui.launcher(host, { sigil, placeholder, items:[{icon,title,subtitle,kind,data}], onQuery(q)->items|Promise, onOpen(item), onAction(item), onClose, hints, filter:true }) -> { el, input, setItems(items), value(), select(i), focus() }
(function () {
  "use strict";
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  const DEFAULT_HINTS = [{ key: "↑↓", label: "nav" }, { key: "↵", label: "open" }, { key: "→", label: "actions" }];
  function subseq(q, hay) { q = (q || "").toLowerCase(); hay = (hay || "").toLowerCase(); let i = 0; for (let j = 0; j < hay.length && i < q.length; j++) if (hay[j] === q[i]) i++; return i === q.length; }

  function launcher(host, opts) {
    opts = opts || {};
    const root = el("div", "zg-launch");
    const search = el("div", "zg-launch-search");
    if (opts.sigil) search.appendChild(el("div", "zg-launch-sigil", opts.sigil));
    const input = document.createElement("input");
    input.className = "zg-launch-input"; input.placeholder = opts.placeholder || "Search…"; input.spellcheck = false;
    search.appendChild(input);
    root.appendChild(search);
    const results = el("ul", "zg-launch-results");
    root.appendChild(results);
    const foot = el("div", "zg-launch-foot");
    const hint = el("div", "zg-launch-hint");
    (opts.hints || DEFAULT_HINTS).forEach(function (h, i) {
      if (i) hint.appendChild(el("span", "zg-launch-hsep", "·"));
      hint.appendChild(el("b", null, h.key));
      hint.appendChild(document.createTextNode(" " + h.label + " "));
    });
    const count = el("div", "zg-launch-count", "");
    foot.appendChild(hint); foot.appendChild(count);
    root.appendChild(foot);
    if (host) host.appendChild(root);

    let all = opts.items || [];
    let shown = all.slice();
    let sel = 0;

    function render() {
      results.innerHTML = "";
      shown.forEach(function (it, i) {
        const li = el("li", "zg-launch-row" + (i === sel ? " sel" : ""));
        li.appendChild(el("div", "zg-launch-icon", it.icon || "›"));
        const body = el("div", "zg-launch-body");
        body.appendChild(el("div", "zg-launch-title", it.title || ""));
        if (it.subtitle) body.appendChild(el("div", "zg-launch-sub", it.subtitle));
        li.appendChild(body);
        if (it.kind) li.appendChild(el("div", "zg-launch-kind", it.kind));
        li.addEventListener("click", function () { sel = i; open(); });
        results.appendChild(li);
      });
      if (!shown.length) results.appendChild(el("li", "zg-launch-empty", opts.emptyText || "No results"));
      count.textContent = typeof opts.count === "function" ? opts.count(shown) : (shown.length + (shown.length === 1 ? " result" : " results"));
      hi();
    }
    function hi() {
      const rows = results.querySelectorAll(".zg-launch-row");
      rows.forEach(function (r, i) { r.classList.toggle("sel", i === sel); });
      const c = rows[sel]; if (c && c.scrollIntoView) c.scrollIntoView({ block: "nearest" });
    }
    function query() {
      const q = input.value;
      if (typeof opts.onQuery === "function") {
        const r = opts.onQuery(q);
        if (r && typeof r.then === "function") { r.then(function (list) { shown = list || []; sel = 0; render(); }); return; }
        shown = r || [];
      } else if (opts.filter === false) {
        shown = all.slice();
      } else {
        const qt = q.trim();
        shown = qt ? all.filter(function (it) { return subseq(qt, (it.title || "") + " " + (it.subtitle || "")); }) : all.slice();
      }
      sel = 0; render();
    }
    function open() { const it = shown[sel]; if (it && opts.onOpen) opts.onOpen(it); }
    function action() { const it = shown[sel]; if (it && opts.onAction) opts.onAction(it); }

    input.addEventListener("input", query);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); hi(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); hi(); }
      else if (e.key === "Enter") { e.preventDefault(); open(); }
      else if (e.key === "ArrowRight" && input.selectionStart === input.value.length) { e.preventDefault(); action(); }
      else if (e.key === "Escape") { e.preventDefault(); if (opts.onClose) opts.onClose(); }
    });
    render();

    return {
      el: root, input: input,
      setItems: function (items) { all = items || []; query(); },              // set the filterable source, then re-filter by the query
      show: function (items) { shown = items || []; sel = 0; render(); },        // display a list verbatim (no filter) — for app-driven sub-lists
      selected: function () { return shown[sel]; },                             // the currently-highlighted item
      value: function () { return input.value; },
      select: function (i) { sel = Math.max(0, Math.min(i, shown.length - 1)); hi(); },
      setCount: function (t) { count.textContent = t == null ? "" : t; },        // override the footer count text imperatively
      focus: function () { input.focus(); },
    };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.launcher = launcher;
})();
