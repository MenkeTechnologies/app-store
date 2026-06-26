// zgui-core/stat-strip.js — a horizontal strip of labeled stats, each an optional pulsing diamond dot
// + a label + a glowing Orbitron value (the "TOTAL / MP3 / FLAC …" inventory header). Ported from
// Audio-Haxor's .audio-stats row + .stat-dot diamonds. Optionally drag-reorderable. window.ZGui.statStrip.
//   ZGui.statStrip(container, items, { draggable, onReorder(order) }) -> { el, set(items), update(i,value) }
//     items: [{ label, value, dot? }]  dot ∈ cyan|green|orange|yellow|magenta|red|muted
//   ZGui.statChip({ label, value, dot }) -> HTMLElement   (a single pair, exposed for reuse)
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    const DOTS = ["cyan", "green", "orange", "yellow", "magenta", "red", "muted"];

    function statChip(item) {
        const pair = document.createElement("span");
        pair.className = "zg-statchip";
        const dot = item.dot && DOTS.indexOf(item.dot) >= 0 ? `<span class="zg-stat-dot ${item.dot}"></span>` : "";
        pair.innerHTML = `${dot}<span class="zg-stat-label">${esc(item.label)}</span><span class="zg-stat-value">${esc(item.value)}</span>`;
        return pair;
    }

    function statStrip(container, items, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        items = (items || []).slice();
        const root = document.createElement("div");
        root.className = "zg-statstrip";
        host.appendChild(root);

        function render() {
            root.innerHTML = "";
            items.forEach((it, i) => {
                const chip = statChip(it);
                chip.dataset.i = i;
                if (opts.draggable) { chip.draggable = true; chip.classList.add("is-draggable"); }
                root.appendChild(chip);
            });
        }
        // HTML5 drag-reorder (faithful to Haxor's per-pair drag), only when opts.draggable.
        if (opts.draggable) {
            let from = -1;
            root.addEventListener("dragstart", (e) => { const c = e.target.closest(".zg-statchip"); if (c) { from = +c.dataset.i; c.classList.add("is-dragging"); } });
            root.addEventListener("dragend", (e) => { const c = e.target.closest(".zg-statchip"); if (c) c.classList.remove("is-dragging"); });
            root.addEventListener("dragover", (e) => e.preventDefault());
            root.addEventListener("drop", (e) => {
                e.preventDefault();
                const c = e.target.closest(".zg-statchip"); if (!c || from < 0) return;
                const to = +c.dataset.i; if (to === from) return;
                const moved = items.splice(from, 1)[0]; items.splice(to, 0, moved); from = -1;
                render();
                if (typeof opts.onReorder === "function") opts.onReorder(items.map((x) => x.label));
            });
        }
        render();
        return {
            el: root,
            set(next) { items = (next || []).slice(); render(); },
            update(i, value) { if (items[i]) { items[i].value = value; const v = root.children[i] && root.children[i].querySelector(".zg-stat-value"); if (v) v.textContent = value; } },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.statStrip = statStrip;
    window.ZGui.statChip = statChip;
})();
