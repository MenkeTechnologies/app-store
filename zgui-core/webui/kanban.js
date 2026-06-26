// zgui-core/kanban.js — a board of columns holding draggable cards; drag a card within or across columns
// to reorder/move it. A common board pattern (Trello/Jira-style). window.ZGui.kanban.
//   ZGui.kanban(container, { columns:[{id,title,color,cards:[{id,title,tags,meta}]}],
//       onMove(cardId,fromCol,toCol,index), onCardClick(card,col), addCard:false, onAddCard(colId) }) ->
//       { el, set(columns), get(), addCard(colId,card) }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function kanban(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let columns = (opts.columns || []).map((c) => Object.assign({}, c, { cards: (c.cards || []).slice() }));

        const root = document.createElement("div"); root.className = "zg-kanban";
        host.appendChild(root);
        let dragId = null, dragFrom = null;

        function cardHtml(card) {
            const tags = (card.tags || []).map((t) => `<span class="zg-kanban-tag" data-kind="${esc(t.kind || "cyan")}">${esc(t.label != null ? t.label : t)}</span>`).join("");
            return `<div class="zg-kanban-card" draggable="true" data-card="${esc(card.id)}"><div class="zg-kanban-card-title">${esc(card.title)}</div>${tags ? `<div class="zg-kanban-tags">${tags}</div>` : ""}${card.meta ? `<div class="zg-kanban-card-meta">${esc(card.meta)}</div>` : ""}</div>`;
        }
        function render() {
            root.innerHTML = columns.map((c) =>
                `<div class="zg-kanban-col" data-col="${esc(c.id)}"${c.color ? ` style="--zg-kb-col:${c.color}"` : ""}>`
                + `<div class="zg-kanban-colhead"><span class="zg-kanban-dot"></span>${esc(c.title)}<span class="zg-kanban-count">${c.cards.length}</span></div>`
                + `<div class="zg-kanban-cards" data-drop="${esc(c.id)}">${c.cards.map(cardHtml).join("")}</div>`
                + (opts.addCard ? `<button class="zg-kanban-add" data-add="${esc(c.id)}">+ Add</button>` : "")
                + "</div>").join("");
        }
        function colOf(id) { return columns.find((c) => String(c.id) === String(id)); }
        function findCard(id) { for (const c of columns) { const i = c.cards.findIndex((x) => String(x.id) === String(id)); if (i >= 0) return { col: c, i }; } return null; }

        root.addEventListener("dragstart", (e) => { const card = e.target.closest(".zg-kanban-card"); if (card) { dragId = card.dataset.card; const f = findCard(dragId); dragFrom = f && f.col.id; card.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; } });
        root.addEventListener("dragend", (e) => { const card = e.target.closest(".zg-kanban-card"); if (card) card.classList.remove("dragging"); root.querySelectorAll(".zg-kanban-cards.over").forEach((x) => x.classList.remove("over")); });
        root.addEventListener("dragover", (e) => { const zone = e.target.closest(".zg-kanban-cards"); if (!zone) return; e.preventDefault(); zone.classList.add("over"); });
        root.addEventListener("dragleave", (e) => { const zone = e.target.closest(".zg-kanban-cards"); if (zone && !zone.contains(e.relatedTarget)) zone.classList.remove("over"); });
        root.addEventListener("drop", (e) => {
            const zone = e.target.closest(".zg-kanban-cards"); if (!zone || dragId == null) return;
            e.preventDefault();
            const toColId = zone.dataset.drop, src = findCard(dragId); if (!src) return;
            const card = src.col.cards.splice(src.i, 1)[0];
            const target = colOf(toColId);
            // insert before the card we dropped onto, else append
            const overCard = e.target.closest(".zg-kanban-card");
            let idx = target.cards.length;
            if (overCard) { const oi = target.cards.findIndex((x) => String(x.id) === String(overCard.dataset.card)); if (oi >= 0) idx = oi; }
            target.cards.splice(idx, 0, card);
            render();
            if (typeof opts.onMove === "function") opts.onMove(dragId, dragFrom, toColId, idx);
            dragId = dragFrom = null;
        });
        root.addEventListener("click", (e) => {
            const add = e.target.closest("[data-add]"); if (add) { if (typeof opts.onAddCard === "function") opts.onAddCard(add.dataset.add); return; }
            const card = e.target.closest(".zg-kanban-card"); if (card && typeof opts.onCardClick === "function") { const f = findCard(card.dataset.card); opts.onCardClick(f && f.col.cards[f.i], f && f.col); }
        });

        render();
        return { el: root, set(c) { columns = (c || []).map((x) => Object.assign({}, x, { cards: (x.cards || []).slice() })); render(); }, get() { return columns; }, addCard(colId, card) { const c = colOf(colId); if (c) { c.cards.push(card); render(); } } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.kanban = kanban;
})();
