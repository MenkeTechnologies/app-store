// zgui-core/avatar.js — a user avatar: image or initials, optional status dot. window.ZGui.avatar.
//   ZGui.avatar({ name, src, size:32, status:'online'|'busy'|'away'|'offline', color }) -> HTMLElement
(function () {
    "use strict";
    function initials(name) { return String(name || "").trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?"; }
    function hue(s) { let h = 0; for (let i = 0; i < String(s).length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
    function avatar(opts) {
        opts = opts || {};
        const sz = opts.size || 32;
        const wrap = document.createElement("span"); wrap.className = "zg-avatar"; wrap.style.width = wrap.style.height = sz + "px"; wrap.style.fontSize = Math.round(sz * 0.4) + "px";
        if (opts.src) { const img = document.createElement("img"); img.src = opts.src; img.alt = opts.name || ""; wrap.appendChild(img); }
        else { wrap.textContent = initials(opts.name); wrap.style.background = opts.color || `hsl(${hue(opts.name || "")},55%,32%)`; }
        if (opts.status) { const dot = document.createElement("span"); dot.className = "zg-avatar-status zg-avatar-" + opts.status; wrap.appendChild(dot); }
        return wrap;
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.avatar = avatar;
})();
