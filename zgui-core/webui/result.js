// zgui-core/result.js — an operation-outcome page (à la Ant Design Result): a status glyph, a
// title, a subtitle, and action buttons. Distinct from emptyState (a "no data" placeholder) — this
// is the result of an action (success/error/…) or an HTTP status page. window.ZGui.result.
//   ZGui.result(host, { status:'success'|'error'|'info'|'warning'|'404'|'403'|'500', title, subtitle, actions:[{label,primary,onClick}] }) -> { el }
(function () {
  "use strict";
  const esc = window.escapeHtml || function (s) { const d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; };
  const GLYPH = { success: "✓", error: "✕", info: "i", warning: "!", "404": "404", "403": "403", "500": "500" };
  function result(host, opts) {
    opts = opts || {};
    const status = opts.status || "info";
    const code = status === "404" || status === "403" || status === "500";
    const wrap = document.createElement("div");
    wrap.className = "zg-result zg-result-" + status;
    wrap.innerHTML =
      '<div class="zg-result-icon' + (code ? " zg-result-code" : "") + '">' + esc(GLYPH[status] || "i") + "</div>" +
      '<div class="zg-result-title">' + esc(opts.title || "") + "</div>" +
      (opts.subtitle ? '<div class="zg-result-sub">' + esc(opts.subtitle) + "</div>" : "") +
      '<div class="zg-result-actions"></div>';
    const actions = wrap.querySelector(".zg-result-actions");
    (opts.actions || []).forEach(function (a) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "zg-result-btn" + (a.primary ? " zg-result-btn-primary" : "");
      b.textContent = a.label;
      if (a.onClick) b.addEventListener("click", a.onClick);
      actions.appendChild(b);
    });
    if (host) host.appendChild(wrap);
    return { el: wrap };
  }
  window.ZGui = window.ZGui || {};
  window.ZGui.result = result;
})();
