// zgui-core/expose.js — a window-exposé / switcher: a tile grid of windows, each with a title, an
// optional FOCUSED badge, a meta line and a monospace text preview of its contents. Click (or arrow +
// Enter) chooses a window; Esc / Close / backdrop dismisses. Extracted from zterm's window exposé so
// any app (terminal, editor, session manager) can present a "pick a window/pane" overlay. The consumer
// supplies the window list + onChoose/onClose; no IPC here. window.ZGui.expose.
//   ZGui.expose(container, { windows:[{id,title,cwd,pid,columns,lines,preview,focused,meta}], title,
//       hint, onChoose(id), onClose }) -> { el, set(windows), focusFirst(), grid }
// set() patches tiles in place by id (creates new, removes closed, updates only changed fields), so a
// caller can poll it on a timer without flicker or losing keyboard focus.
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])));
    function badge(text) {
        if (window.ZGui && typeof window.ZGui.badge === "function") { const b = window.ZGui.badge(text, { kind: "green", fill: true }); return b.outerHTML || (b.el && b.el.outerHTML) || ""; }
        return `<span class="zg-expose-badge">${esc(text)}</span>`;
    }

    function expose(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const root = document.createElement("div"); root.className = "zg-expose";
        const header = document.createElement("div"); header.className = "zg-expose-header";
        header.innerHTML = `<span class="zg-expose-title">${esc(opts.title || "All Windows")}</span>`
            + `<span class="zg-expose-hint">${esc(opts.hint || "Click a window to focus it · Esc to close")}</span>`;
        const closeBtn = (window.ZGui && window.ZGui.button)
            ? window.ZGui.button({ label: "Close", onClick: () => done() })
            : (() => { const b = document.createElement("button"); b.textContent = "Close"; b.className = "zg-expose-close"; b.onclick = () => done(); return b; })();
        header.appendChild(closeBtn.el || closeBtn);
        const grid = document.createElement("div"); grid.className = "zg-expose-grid";
        root.appendChild(header); root.appendChild(grid);
        host.appendChild(root);

        function done() { if (typeof opts.onClose === "function") opts.onClose(); }
        function choose(id) { if (typeof opts.onChoose === "function") opts.onChoose(id); }

        function metaLine(w) {
            if (w.meta) return esc(w.meta);
            const bits = [];
            if (w.cwd) bits.push(esc(w.cwd));
            if (w.pid != null) bits.push("pid " + esc(w.pid));
            if (w.columns != null && w.lines != null) bits.push(esc(w.columns) + "×" + esc(w.lines));
            return bits.join("  ·  ");
        }
        const tiles = new Map();   // id -> { el, titleEl, metaEl, preEl }
        let firstPaint = true;
        function titleHtml(w, i) { return esc(w.title || ("Window " + (i + 1))) + (w.focused ? " " + badge("FOCUSED") : ""); }
        function createTile(w, i) {
            const el = document.createElement("div"); el.className = "zg-expose-tile" + (w.focused ? " focused" : ""); el.tabIndex = 0;
            const titleEl = document.createElement("div"); titleEl.className = "zg-expose-tiletitle";
            const metaEl = document.createElement("div"); metaEl.className = "zg-expose-tilemeta";
            const preEl = document.createElement("pre"); preEl.className = "zg-expose-preview";
            el.append(titleEl, metaEl, preEl);
            el.addEventListener("click", () => choose(w.id));
            el.addEventListener("keydown", (ev) => {
                if (ev.key === "Enter") { ev.preventDefault(); choose(w.id); return; }
                if (ev.key === "ArrowLeft" || ev.key === "ArrowRight" || ev.key === "ArrowUp" || ev.key === "ArrowDown") { ev.preventDefault(); moveFocus(el, ev.key); }
            });
            return { el, titleEl, metaEl, preEl };
        }
        // how many tiles sit in the first row (CSS grid is responsive, so measure rather than assume)
        function colCount(arr) {
            if (arr.length < 2) return 1;
            const top0 = arr[0].offsetTop; let c = 1;
            for (let k = 1; k < arr.length; k++) { if (arr[k].offsetTop === top0) c++; else break; }
            return c || 1;
        }
        // grid-aware focus move: Left/Right step one tile, Up/Down jump a whole row (by column count)
        function moveFocus(fromEl, key) {
            const arr = Array.prototype.slice.call(grid.querySelectorAll(".zg-expose-tile"));
            const i = arr.indexOf(fromEl); if (i < 0) return;
            const cols = colCount(arr);
            let j = i;
            if (key === "ArrowLeft") j = i - 1;
            else if (key === "ArrowRight") j = i + 1;
            else if (key === "ArrowUp") j = i - cols;
            else if (key === "ArrowDown") j = i + cols;
            if (j < 0 || j >= arr.length) return;
            if (arr[j] && arr[j].focus) arr[j].focus();
        }
        function patch(t, w, i) {
            const th = titleHtml(w, i); if (t.titleEl.innerHTML !== th) t.titleEl.innerHTML = th;
            const mt = metaLine(w); if (t.metaEl.textContent !== mt) t.metaEl.textContent = mt;
            const pv = w.preview || ""; if (t.preEl.textContent !== pv) t.preEl.textContent = pv;
            t.el.classList.toggle("focused", !!w.focused);
        }
        // patch tiles in place by id — create new, update changed, remove closed; never full-rebuild,
        // so polling keeps focus and doesn't flicker.
        function set(windows) {
            const wins = windows || [];
            if (!wins.length) { tiles.clear(); grid.innerHTML = '<div class="zg-expose-empty">No windows.</div>'; firstPaint = true; return; }
            if (grid.querySelector(".zg-expose-empty")) grid.innerHTML = "";
            const seen = new Set();
            wins.forEach((w, i) => {
                const id = w.id != null ? w.id : i; seen.add(id);
                let t = tiles.get(id);
                if (!t) { t = createTile(w, i); t.el.dataset.id = id; tiles.set(id, t); grid.appendChild(t.el); }
                patch(t, w, i);
            });
            for (const [id, t] of tiles) { if (!seen.has(id)) { t.el.remove(); tiles.delete(id); } }
            if (firstPaint) { firstPaint = false; focusFirst(); }
        }
        function focusFirst() { const f = grid.querySelector(".zg-expose-tile.focused") || grid.querySelector(".zg-expose-tile"); if (f && f.focus) f.focus(); }

        root.addEventListener("keydown", (ev) => {
            if (ev.key === "Escape") { ev.preventDefault(); done(); return; }
            // if an arrow is pressed while focus isn't on a tile (e.g. on the Close button or nowhere),
            // grab the focused/first tile so navigation always engages.
            if (ev.key === "ArrowLeft" || ev.key === "ArrowRight" || ev.key === "ArrowUp" || ev.key === "ArrowDown") {
                const ae = document.activeElement;
                if (!ae || !ae.classList || !ae.classList.contains("zg-expose-tile")) { ev.preventDefault(); focusFirst(); }
            }
        });
        root.addEventListener("click", (e) => { if (e.target === root) done(); });   // backdrop
        set(opts.windows);
        return { el: root, grid, set, focusFirst };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.expose = expose;
})();
