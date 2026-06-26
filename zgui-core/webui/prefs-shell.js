// zgui-core/prefs-shell.js — a two-pane preferences/settings window: a topbar (logo + title +
// actions), an icon+title+subtitle sidebar nav, and a detail pane rendered per item. Distilled
// from zgo's Alfred-style prefs (.pf-head/.pf-nav/.pf-nav-item/.pf-detail/.pf-pane-head) so every
// app stops rebuilding its settings shell. Themed via var(--cyan), so it follows the active
// colorscheme (green under Matrix, cyan under the default). window.ZGui.prefsShell.
//   ZGui.prefsShell(host, { title, logo, actions:[Node|string], items:[{id,icon,name,sub,render(pane)}], active, onSelect }) -> { el, select(id), pane(), nav(), setItems(items) }
//   ZGui.prefsShell.paneHead(icon, title, desc) -> Node      // the pane's icon+title+description
//   ZGui.prefsShell.section(label) -> Node                   // an uppercase section heading
(function () {
  "use strict";
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function asNode(x) { return (x && x.nodeType === 1) ? x : (x && x.el && x.el.nodeType === 1) ? x.el : el("span", null, x == null ? "" : String(x)); }

  function prefsShell(host, opts) {
    opts = opts || {};
    const root = el("div", "zg-prefs");

    const head = el("div", "zg-prefs-head");
    if (opts.logo) head.appendChild(el("span", "zg-prefs-logo", opts.logo));
    head.appendChild(el("span", "zg-prefs-title", opts.title || "Preferences"));
    const actions = el("div", "zg-prefs-actions");
    (opts.actions || []).forEach(function (a) { actions.appendChild(asNode(a)); });
    head.appendChild(actions);
    root.appendChild(head);

    const body = el("div", "zg-prefs-body");
    const nav = el("div", "zg-prefs-nav");
    const detail = el("div", "zg-prefs-detail");
    body.appendChild(nav);
    body.appendChild(detail);
    root.appendChild(body);
    if (host) host.appendChild(root);

    let items = opts.items || [];
    let activeId = null;

    function buildNav() {
      nav.innerHTML = "";
      items.forEach(function (it) {
        const row = el("div", "zg-prefs-item");
        row.dataset.id = it.id;
        row.appendChild(el("span", "zg-prefs-item-icon", it.icon || ""));
        const txt = el("div", "zg-prefs-item-text");
        txt.appendChild(el("div", "zg-prefs-item-name", it.name || it.id));
        if (it.sub) txt.appendChild(el("div", "zg-prefs-item-sub", it.sub));
        row.appendChild(txt);
        row.addEventListener("click", function () { select(it.id); });
        nav.appendChild(row);
      });
    }
    function select(id) {
      const it = items.filter(function (x) { return x.id === id; })[0] || items[0];
      if (!it) return;
      activeId = it.id;
      Array.prototype.forEach.call(nav.children, function (row) { row.classList.toggle("active", row.dataset.id === it.id); });
      detail.innerHTML = "";
      if (typeof it.render === "function") it.render(detail);
      if (opts.onSelect) opts.onSelect(it.id, it);
    }

    buildNav();
    select(opts.active || (items[0] && items[0].id));

    return {
      el: root,
      select: select,
      pane: function () { return detail; },
      nav: function () { return nav; },
      setItems: function (next) { items = next || []; buildNav(); select(activeId || (items[0] && items[0].id)); },
    };
  }

  prefsShell.paneHead = function (icon, title, desc) {
    const frag = document.createDocumentFragment();
    const h = el("div", "zg-prefs-pane-head");
    if (icon) h.appendChild(el("span", "zg-prefs-pane-icon", icon));
    h.appendChild(el("span", "zg-prefs-pane-title", title || ""));
    frag.appendChild(h);
    if (desc) frag.appendChild(el("p", "zg-prefs-pane-desc", desc));
    return frag;
  };
  prefsShell.section = function (label) { return el("div", "zg-prefs-section", label); };

  window.ZGui = window.ZGui || {};
  window.ZGui.prefsShell = prefsShell;
})();
