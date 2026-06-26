// zgui-core/context-menu.js — the BASE right-click context menu, the generic core
// extracted from Audio-Haxor context-menu.js (showContextMenu/hideContextMenu + viewport
// positioning). Consumers pass their own item lists; the chrome + CSS live here so the 14
// apps stop drifting. window.ZGui.contextMenu.
//
// items: array of `{ label, icon?, action?, disabled? }` or the literal '---' separator.
(function () {
  "use strict";
  const escapeHtml = window.escapeHtml || function (s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  };

  let menu = null;
  function ensure() {
    if (menu) return menu;
    menu = document.createElement("div");
    menu.className = "ctx-menu";
    menu._actions = {};
    document.body.appendChild(menu);
    menu.addEventListener("click", function (e) {
      const item = e.target.closest(".ctx-menu-item");
      if (!item || item.classList.contains("ctx-disabled")) return;
      const action = menu._actions[item.dataset.ctxIdx];
      hide();
      if (action) action();
    });
    document.addEventListener("click", function (e) { if (menu && !menu.contains(e.target)) hide(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
    return menu;
  }

  // Show the menu at the event's cursor, kept inside the viewport.
  function show(e, items) {
    if (e && e.preventDefault) e.preventDefault();
    const m = ensure();
    m._actions = {};
    m.innerHTML = (items || []).map(function (item, i) {
      if (item === "---") return '<div class="ctx-menu-sep"></div>';
      if (item.action) m._actions[i] = item.action;
      const cls = item.disabled ? " ctx-disabled" : "";
      const label = escapeHtml(item.label != null ? String(item.label) : "");
      return '<div class="ctx-menu-item' + cls + '" data-ctx-idx="' + i + '">' +
        '<span class="ctx-icon">' + (item.icon || "") + "</span>" + label + "</div>";
    }).join("");
    m.classList.add("visible");
    const rect = m.getBoundingClientRect();
    let x = e.clientX, y = e.clientY;
    if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 4;
    if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 4;
    m.style.left = x + "px";
    m.style.top = y + "px";
  }

  function hide() { if (menu) { menu.classList.remove("visible"); menu._actions = {}; } }

  // Bind a `contextmenu` handler on an element/selector; `itemsFn(event)` returns the items.
  function bind(target, itemsFn) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (el) el.addEventListener("contextmenu", function (e) { show(e, itemsFn(e) || []); });
  }

  window.ZGui = window.ZGui || {};
  window.ZGui.contextMenu = { show: show, hide: hide, bind: bind };
})();
