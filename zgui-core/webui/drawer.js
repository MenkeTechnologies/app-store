// zgui-core/drawer.js — the base collapsible side-drawer widget, the generic chrome
// distilled from zpwr-clip-engine's browser-drawer (#zpwr-browser): a flex-in-flow panel with
// a header (collapse button + title) and a scrollable body that collapses to a thin rail.
// Consumers fill the body with their own content. window.ZGui.drawer.
//
// create({ side:'left'|'right', title, width, content, collapsed?, onToggle? }) -> api
//   api: { el, body, head, title, open(), close(), toggle(), setCollapsed(v), isCollapsed() }
(function () {
  "use strict";

  function create(opts) {
    opts = opts || {};
    const side = opts.side === "right" ? "right" : "left";
    const wrap = document.createElement("div");
    wrap.className = "zs-drawer zs-drawer-" + side;
    if (opts.width) wrap.style.setProperty("--zs-drawer-w", typeof opts.width === "number" ? opts.width + "px" : opts.width);

    const head = document.createElement("div");
    head.className = "zs-drawer-head";
    const collapseBtn = document.createElement("button");
    collapseBtn.type = "button";
    collapseBtn.className = "zs-drawer-collapse";
    collapseBtn.title = "Collapse";
    const titleEl = document.createElement("span");
    titleEl.className = "zs-drawer-title";
    titleEl.textContent = opts.title || "";
    head.appendChild(collapseBtn);
    head.appendChild(titleEl);

    const body = document.createElement("div");
    body.className = "zs-drawer-body";
    if (opts.content) {
      if (typeof opts.content === "string") body.innerHTML = opts.content;
      else body.appendChild(opts.content);
    }

    wrap.appendChild(head);
    wrap.appendChild(body);

    let collapsed = false;
    function glyph() {
      // Arrow points toward where the panel will go when toggled.
      if (side === "left") return collapsed ? "⟩" : "⟨";
      return collapsed ? "⟨" : "⟩";
    }
    function setCollapsed(v) {
      collapsed = !!v;
      wrap.classList.toggle("collapsed", collapsed);
      collapseBtn.textContent = glyph();
      if (typeof opts.onToggle === "function") opts.onToggle(collapsed);
    }
    collapseBtn.addEventListener("click", function () { setCollapsed(!collapsed); });
    setCollapsed(!!opts.collapsed);

    return {
      el: wrap, body: body, head: head, title: titleEl,
      open() { wrap.classList.add("open"); },
      close() { wrap.classList.remove("open"); },
      toggle() { wrap.classList.toggle("open"); },
      setCollapsed: setCollapsed,
      isCollapsed() { return collapsed; },
    };
  }

  window.ZGui = window.ZGui || {};
  window.ZGui.drawer = { create: create };
})();
