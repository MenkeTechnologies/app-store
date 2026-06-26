// zgui-core/hover-card.js — a floating card that opens when the pointer hovers a target and stays open
// while the pointer is over the target OR the card, closing after a delay once it leaves both. Ported
// behavior from Mantine's <HoverCard> (openDelay / closeDelay / position). window.ZGui.hoverCard.
//   ZGui.hoverCard(target, { content:node|html|string, openDelay:120, closeDelay:120,
//       position:'bottom' }) -> { el, show(), hide(), destroy() }
(function () {
    "use strict";
    function hoverCard(target, opts) {
        const trg = target && (target.el || target);
        if (!trg) return null;
        opts = opts || {};
        const openDelay = opts.openDelay == null ? 120 : opts.openDelay;
        const closeDelay = opts.closeDelay == null ? 120 : opts.closeDelay;
        const position = opts.position || "bottom";
        let card = null, openT = null, closeT = null;

        function build() {
            const c = document.createElement("div"); c.className = "zg-hovercard zg-hovercard-" + position;
            if (opts.content && opts.content.nodeType === 1) c.appendChild(opts.content);
            else if (opts.html != null) c.innerHTML = opts.html;
            else c.textContent = opts.content != null ? opts.content : "";
            c.addEventListener("pointerenter", cancelClose);
            c.addEventListener("pointerleave", scheduleClose);
            return c;
        }
        function place() {
            const r = trg.getBoundingClientRect(), cw = card.offsetWidth, ch = card.offsetHeight, gap = 8;
            let x = r.left + r.width / 2 - cw / 2, y = r.bottom + gap;
            if (position === "top") y = r.top - ch - gap;
            else if (position === "left") { x = r.left - cw - gap; y = r.top + r.height / 2 - ch / 2; }
            else if (position === "right") { x = r.right + gap; y = r.top + r.height / 2 - ch / 2; }
            card.style.left = Math.max(8, Math.min(x, window.innerWidth - cw - 8)) + window.pageXOffset + "px";
            card.style.top = (y + window.pageYOffset) + "px";
        }
        function show() { cancelClose(); if (card) return; card = build(); document.body.appendChild(card); place(); }
        function hide() { cancelOpen(); if (card) { card.remove(); card = null; } }
        function cancelOpen() { if (openT) { clearTimeout(openT); openT = null; } }
        function cancelClose() { if (closeT) { clearTimeout(closeT); closeT = null; } }
        function scheduleOpen() { cancelClose(); if (card || openT) return; openT = setTimeout(() => { openT = null; show(); }, openDelay); }
        function scheduleClose() { cancelOpen(); closeT = setTimeout(() => { closeT = null; hide(); }, closeDelay); }

        trg.addEventListener("pointerenter", scheduleOpen);
        trg.addEventListener("pointerleave", scheduleClose);
        return { el: trg, show, hide, destroy() { hide(); trg.removeEventListener("pointerenter", scheduleOpen); trg.removeEventListener("pointerleave", scheduleClose); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.hoverCard = hoverCard;
})();
