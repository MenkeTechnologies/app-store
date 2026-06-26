// zgui-core/logo.js — the brand logo block as a standalone component (glowing gradient icon +
// shimmer wordmark + optional subtitle / version / git-rev), extracted from ZGui.header so it can
// be used on its own — on a splash screen, an about box, a tray popover — not only in the header.
// ZGui.header consumes this. Styled by the `.zs-logo-*` rules in components.css. window.ZGui.logo.
//
//   ZGui.logo({ glyph, title, subtitle, version, gitRev, onClick }) -> { el, setVersion(v), setGitRev(r) }
(function () {
    "use strict";

    const esc = window.escapeHtml || function (s) {
        const d = document.createElement("div");
        d.textContent = s == null ? "" : String(s);
        return d.innerHTML;
    };

    function logo(opts) {
        opts = opts || {};
        const el = document.createElement("div");
        el.className = "zs-logo";
        const click = opts.onClick || opts.onLogoClick;
        if (typeof click === "function") {
            el.style.cursor = "pointer";
            el.addEventListener("click", click);
        }
        el.innerHTML = `
            <div class="zs-logo-icon">${opts.glyph || "&#9670;"}</div>
            <div class="zs-logo-text">
                <h1 class="zs-logo-title">${esc(opts.title || "")}</h1>
                ${opts.subtitle ? `<span class="zs-logo-sub">${esc(opts.subtitle)}</span>` : ""}
                <span class="zs-logo-version"${opts.version ? "" : " hidden"}>${esc(opts.version || "")}</span>
                <span class="zs-logo-git"${opts.gitRev ? "" : " hidden"}>${esc(opts.gitRev || "")}</span>
            </div>`;
        const verEl = el.querySelector(".zs-logo-version");
        const gitEl = el.querySelector(".zs-logo-git");
        return {
            el: el,
            setVersion(v) { if (verEl) { verEl.textContent = v == null ? "" : v; verEl.hidden = !v; } },
            setGitRev(r) { if (gitEl) { gitEl.textContent = r == null ? "" : r; gitEl.hidden = !r; } },
        };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.logo = logo;
})();
