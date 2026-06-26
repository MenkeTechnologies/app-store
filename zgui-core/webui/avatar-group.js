// zgui-core/avatar-group.js — a row of overlapping avatars with a "+N" overflow chip. Builds on
// ZGui.avatar. Common across MUI / Mantine / PrimeReact (AvatarGroup). window.ZGui.avatarGroup.
//   ZGui.avatarGroup({ avatars:[{name,src,status}], max:4, size:32, onOverflowClick }) -> { el }
(function () {
    "use strict";
    function avatarGroup(opts) {
        opts = opts || {};
        const size = opts.size || 32, max = opts.max || 4;
        const list = opts.avatars || [];
        const root = document.createElement("div"); root.className = "zg-avatargroup"; root.style.setProperty("--zg-ag-size", size + "px");
        const shown = list.slice(0, max);
        shown.forEach((a) => {
            let node;
            if (window.ZGui && window.ZGui.avatar) { const r = window.ZGui.avatar({ name: a.name, src: a.src, size, status: a.status }); node = r.el || r; }
            else { node = document.createElement("div"); node.textContent = (a.name || "?").charAt(0); }
            node.classList.add("zg-avatargroup-item");
            root.appendChild(node);
        });
        const extra = list.length - shown.length;
        if (extra > 0) {
            const more = document.createElement("div"); more.className = "zg-avatargroup-item zg-avatargroup-more"; more.textContent = "+" + extra;
            more.style.width = more.style.height = size + "px";
            if (typeof opts.onOverflowClick === "function") { more.style.cursor = "pointer"; more.addEventListener("click", opts.onOverflowClick); }
            root.appendChild(more);
        }
        return { el: root };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.avatarGroup = avatarGroup;
})();
