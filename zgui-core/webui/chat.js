// zgui-core/chat.js — a chat message list: bubbles aligned left (incoming) / right (outgoing) with an
// optional avatar, sender name, timestamp and status. Append-friendly + auto-scrolls to the newest.
// A common messaging pattern (no single canonical framework). window.ZGui.chat.
//   ZGui.chat(container, { messages:[{id,text,side:'in'|'out',name,avatar,time,status}],
//       onSend(text), input:true, placeholder }) -> { el, add(msg), set(msgs), clear(), scrollToEnd() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function chat(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const root = document.createElement("div"); root.className = "zg-chat";
        const list = document.createElement("div"); list.className = "zg-chat-list";
        root.appendChild(list);
        let inputEl = null;
        if (opts.input) {
            const bar = document.createElement("div"); bar.className = "zg-chat-inputbar";
            inputEl = document.createElement("input"); inputEl.className = "zg-chat-input"; inputEl.placeholder = opts.placeholder || "Message…";
            const send = document.createElement("button"); send.className = "zg-chat-send"; send.textContent = "➤"; send.title = "Send";
            function fire() { const t = inputEl.value.trim(); if (!t) return; inputEl.value = ""; if (typeof opts.onSend === "function") opts.onSend(t); }
            send.addEventListener("click", fire);
            inputEl.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); fire(); } });
            bar.appendChild(inputEl); bar.appendChild(send); root.appendChild(bar);
        }
        host.appendChild(root);

        function avatarNode(m) {
            if (m.avatar && m.avatar.nodeType === 1) return m.avatar.outerHTML;
            if (window.ZGui && window.ZGui.avatar && m.name) { const a = window.ZGui.avatar({ name: m.name, size: 28 }); return (a.el || a).outerHTML; }
            return "";
        }
        function bubbleHtml(m) {
            const side = m.side === "out" ? "out" : "in";
            const av = side === "in" ? avatarNode(m) : "";
            const head = (m.name || m.time) ? `<div class="zg-chat-head">${m.name ? `<span class="zg-chat-name">${esc(m.name)}</span>` : ""}${m.time ? `<span class="zg-chat-time">${esc(m.time)}</span>` : ""}</div>` : "";
            const status = (side === "out" && m.status) ? `<span class="zg-chat-status">${esc(m.status)}</span>` : "";
            return `<div class="zg-chat-row ${side}" data-id="${esc(m.id != null ? m.id : "")}">${av}<div class="zg-chat-bubblewrap">${head}<div class="zg-chat-bubble">${esc(m.text)}</div>${status}</div></div>`;
        }
        function scrollToEnd() { list.scrollTop = list.scrollHeight; }
        function add(m) { list.insertAdjacentHTML("beforeend", bubbleHtml(m)); scrollToEnd(); }
        function set(msgs) { list.innerHTML = (msgs || []).map(bubbleHtml).join(""); scrollToEnd(); }

        set(opts.messages);
        return { el: root, list, add, set, clear() { list.innerHTML = ""; }, scrollToEnd, input: inputEl };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.chat = chat;
})();
