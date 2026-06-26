// zgui-core/emoji-picker.js — a searchable emoji grid with category tabs and a recents row. A common
// pattern (Slack/Discord-style). Self-contained emoji set (no network). window.ZGui.emojiPicker.
//   ZGui.emojiPicker(container, { onPick(emoji,name), recents:[], columns:8 }) ->
//       { el, focusSearch() }
(function () {
    "use strict";
    // a compact curated set keyed by category; each entry [emoji, keywords].
    const CATS = [
        ["😀", "Smileys", [["😀", "grin happy"], ["😁", "beam"], ["😂", "joy laugh tears"], ["🙂", "smile"], ["😉", "wink"], ["😍", "love heart eyes"], ["😎", "cool sunglasses"], ["🤔", "think"], ["😅", "sweat"], ["😭", "cry sob"], ["😡", "angry mad"], ["🥳", "party celebrate"], ["😴", "sleep"], ["🤯", "mind blown"], ["🤝", "handshake deal"], ["🙏", "pray thanks"]]],
        ["✅", "Symbols", [["✅", "check done"], ["❌", "cross no"], ["⚠️", "warning"], ["⭐", "star"], ["🔥", "fire hot"], ["💯", "100 perfect"], ["❤️", "heart love"], ["👍", "thumbsup yes"], ["👎", "thumbsdown no"], ["🎉", "party tada"], ["🚀", "rocket ship launch"], ["💡", "idea bulb"], ["🔒", "lock secure"], ["🔑", "key"], ["⚡", "bolt fast"], ["♻️", "recycle"]]],
        ["💻", "Objects", [["💻", "laptop code"], ["🖥️", "desktop"], ["⌨️", "keyboard"], ["🖱️", "mouse"], ["📦", "package box"], ["📁", "folder"], ["📄", "file doc"], ["🔧", "wrench tool"], ["🐛", "bug"], ["📊", "chart"], ["🎵", "music note"], ["🎛️", "knobs mixer"], ["🎹", "piano keys"], ["🔊", "speaker"], ["🎚️", "fader slider"], ["💾", "save disk"]]],
        ["🐱", "Nature", [["🐱", "cat"], ["🐶", "dog"], ["🦊", "fox"], ["🐢", "turtle"], ["🌵", "cactus"], ["🌲", "tree"], ["🌊", "wave water"], ["☀️", "sun"], ["🌙", "moon night"], ["⭐", "star"], ["🌈", "rainbow"], ["❄️", "snow cold"], ["🍀", "clover luck"], ["🌸", "blossom flower"], ["🔮", "crystal ball"], ["💎", "gem diamond"]]],
    ];
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });

    function emojiPicker(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let catIdx = 0, query = "";
        const recents = (opts.recents || []).slice(0, 16);

        const root = document.createElement("div"); root.className = "zg-emoji";
        const search = document.createElement("input"); search.className = "zg-emoji-search"; search.placeholder = "Search emoji…";
        const tabs = document.createElement("div"); tabs.className = "zg-emoji-tabs";
        const grid = document.createElement("div"); grid.className = "zg-emoji-grid";
        if (opts.columns) grid.style.gridTemplateColumns = `repeat(${opts.columns},1fr)`;
        root.appendChild(search); root.appendChild(tabs); root.appendChild(grid); host.appendChild(root);

        function renderTabs() { tabs.innerHTML = (recents.length ? `<button class="zg-emoji-tab${catIdx === -1 ? " active" : ""}" data-c="-1" title="Recent">🕘</button>` : "") + CATS.map((c, i) => `<button class="zg-emoji-tab${i === catIdx ? " active" : ""}" data-c="${i}" title="${esc(c[1])}">${c[0]}</button>`).join(""); }
        function entries() {
            if (query) { const q = query.toLowerCase(); const out = []; CATS.forEach((c) => c[2].forEach((e) => { if (e[1].includes(q)) out.push(e); })); return out; }
            if (catIdx === -1) return recents.map((e) => [e, ""]);
            return CATS[catIdx][2];
        }
        function renderGrid() { grid.innerHTML = entries().map((e) => `<button class="zg-emoji-cell" data-e="${esc(e[0])}" data-n="${esc((e[1] || "").split(" ")[0])}" title="${esc(e[1] || "")}">${e[0]}</button>`).join("") || '<div class="zg-emoji-empty">No matches</div>'; }

        tabs.addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (!b) return; catIdx = +b.dataset.c; query = ""; search.value = ""; renderTabs(); renderGrid(); });
        search.addEventListener("input", () => { query = search.value.trim(); renderGrid(); });
        grid.addEventListener("click", (e) => { const c = e.target.closest(".zg-emoji-cell"); if (!c) return; const em = c.dataset.e; if (recents.indexOf(em) < 0) { recents.unshift(em); if (recents.length > 16) recents.pop(); } if (typeof opts.onPick === "function") opts.onPick(em, c.dataset.n); });

        renderTabs(); renderGrid();
        return { el: root, focusSearch() { search.focus(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.emojiPicker = emojiPicker;
})();
