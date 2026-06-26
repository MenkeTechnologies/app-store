// zgui-core/command-palette.js — the BASE command palette (⌘/Ctrl+K). The chrome,
// keyboard handling, fzf filtering (via ZGui.fzf) and CSS live here; CONSUMERS register
// their own items so the 14 apps share one palette instead of drifting. window.ZGui.palette.
//
// item: { label, hint?, icon?, run() }.  register(item | [items]); open(); bindHotkey().
(function () {
  "use strict";
  const escapeHtml = window.escapeHtml || function (s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  };

  const items = [];
  let overlay = null;

  function register(list) { (Array.isArray(list) ? list : [list]).forEach(function (i) { if (i && i.label) items.push(i); }); }
  function clear() { items.length = 0; }

  // Highlight matched chars via the shared fzf (falls back to escaped text).
  function labelHtml(text, q) {
    const fz = window.ZGui && window.ZGui.fzf;
    if (fz && q) {
      const m = fz.fzfMatch(q, text);
      if (m) return fz.highlightWithIndices(text, m.indices);
    }
    return escapeHtml(text);
  }

  function open() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "palette-overlay";
    const box = document.createElement("div");
    box.className = "palette-box";
    const input = document.createElement("input");
    input.className = "palette-input";
    input.placeholder = "Type a command…";
    input.spellcheck = false;
    const results = document.createElement("div");
    results.className = "palette-results";
    box.appendChild(input);
    box.appendChild(results);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    let filtered = items.slice(), sel = 0;
    function render() {
      const q = input.value.trim();
      const fz = window.ZGui && window.ZGui.fzf;
      filtered = q && fz
        ? items.map(function (it) { const m = fz.fzfMatch(q, it.label); return m ? { it: it, score: m.score } : null; })
            .filter(Boolean).sort(function (a, b) { return b.score - a.score; }).map(function (x) { return x.it; })
        : items.slice();
      sel = 0;
      results.innerHTML = "";
      filtered.forEach(function (it) {
        // Audio-Haxor markup: row > icon · name(fuzzy-highlighted) · [detail] · [shortcut kbd | hint] · [type badge].
        const row = document.createElement("div");
        row.className = "palette-row";
        const ic = document.createElement("span");
        ic.className = "palette-icon";
        ic.innerHTML = it.icon || "&#9656;";
        const name = document.createElement("span");
        name.className = "palette-name";
        name.innerHTML = labelHtml(it.name != null ? it.name : it.label, q);
        row.appendChild(ic);
        row.appendChild(name);
        if (it.detail) {
          const d = document.createElement("span");
          d.className = "palette-detail";
          d.textContent = it.detail;
          row.appendChild(d);
        }
        if (it.shortcut) {
          const s = document.createElement("span");
          s.className = "palette-shortcut";
          const k = document.createElement("kbd");
          k.textContent = it.shortcut;
          s.appendChild(k);
          row.appendChild(s);
        } else if (it.hint) {
          const h = document.createElement("span");
          h.className = "palette-hint";
          h.textContent = it.hint;
          row.appendChild(h);
        }
        if (it.type) {            // colored per-type badge (.palette-type-{type}); typeLabel overrides the text
          const b = document.createElement("span");
          b.className = "palette-badge palette-type-" + it.type;
          b.textContent = it.typeLabel != null ? it.typeLabel : it.type;
          row.appendChild(b);
        }
        row.addEventListener("click", function () { run(it); });
        results.appendChild(row);
      });
      hi();
    }
    function hi() {
      const rows = results.querySelectorAll(".palette-row");
      rows.forEach(function (r, i) { r.classList.toggle("palette-selected", i === sel); });
      const c = rows[sel];
      if (c && c.scrollIntoView) c.scrollIntoView({ block: "nearest" });
    }
    function run(it) { close(); if (it && it.run) it.run(); }

    input.addEventListener("input", render);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, filtered.length - 1); hi(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); hi(); }
      else if (e.key === "Enter") { e.preventDefault(); if (filtered[sel]) run(filtered[sel]); }
      else if (e.key === "Escape") { e.preventDefault(); close(); }
    });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    render();
    input.focus();
  }

  function close() { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); overlay = null; }

  // ⌘/Ctrl+K toggles the palette.
  function bindHotkey() {
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); overlay ? close() : open(); }
    });
  }

  window.ZGui = window.ZGui || {};
  window.ZGui.palette = { register: register, clear: clear, open: open, close: close, bindHotkey: bindHotkey, items: items };
})();
