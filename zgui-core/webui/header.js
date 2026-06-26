// zgui-core/header.js — the generic app header strip, distilled from Audio-Haxor's header
// markup: a draggable top bar with a glowing logo icon, shimmer title, optional version / git-rev,
// a right-side stats row, and an actions slot. window.ZGui.header.
//
//   ZGui.header.build({
//       glyph: '♫',                 // logo icon glyph
//       title: 'AUDIO HAXOR',
//       subtitle: 'Audio Asset Manager',   // optional tagline
//       version: 'v1.2.3',          // optional
//       gitRev: 'a1b2c3d',          // optional, shown small under the title
//       onLogoClick(),              // optional click handler for the logo
//       stats: [ { label:'CPU', value:'8', title:'CPU cores', id:'hdrCpu' }, … ],
//       actions: HTMLElement | HTMLElement[],   // optional right-side controls (buttons, switcher…)
//   }) -> { el, setVersion(v), setGitRev(r), setStat(id, value) }
//
// The stats row is drag-reorderable when ZGui.drag is present (persists under `headerStatsOrder`).
(function () {
    "use strict";

    const esc = window.escapeHtml || function (s) {
        const d = document.createElement("div");
        d.textContent = s == null ? "" : String(s);
        return d.innerHTML;
    };

    function build(opts) {
        opts = opts || {};
        const header = document.createElement("div");
        header.className = "zs-header";

        const top = document.createElement("div");
        top.className = "zs-header-top";

        // The logo block is the standalone ZGui.logo component (single-sourced); fall back to an
        // inline build if logo.js isn't loaded.
        const logoApi = (window.ZGui && typeof window.ZGui.logo === "function")
            ? window.ZGui.logo({ glyph: opts.glyph, title: opts.title, subtitle: opts.subtitle, version: opts.version, gitRev: opts.gitRev, onClick: opts.onLogoClick })
            : null;
        let logo;
        if (logoApi) {
            logo = logoApi.el;
        } else {
            logo = document.createElement("div");
            logo.className = "zs-logo";
            if (typeof opts.onLogoClick === "function") { logo.style.cursor = "pointer"; logo.addEventListener("click", opts.onLogoClick); }
            logo.innerHTML = `
                <div class="zs-logo-icon">${opts.glyph || "&#9670;"}</div>
                <div class="zs-logo-text">
                    <h1 class="zs-logo-title">${esc(opts.title || "")}</h1>
                    ${opts.subtitle ? `<span class="zs-logo-sub">${esc(opts.subtitle)}</span>` : ""}
                    <span class="zs-logo-version"${opts.version ? "" : " hidden"}>${esc(opts.version || "")}</span>
                    <span class="zs-logo-git"${opts.gitRev ? "" : " hidden"}>${esc(opts.gitRev || "")}</span>
                </div>`;
        }

        const actions = document.createElement("div");
        actions.className = "zs-header-actions";

        const stats = document.createElement("div");
        stats.className = "zs-header-info";
        const statMap = {};
        (opts.stats || []).forEach((s) => {
            const item = document.createElement("div");
            item.className = "zs-header-info-item";
            if (s.title) item.title = s.title;
            if (s.id) item.dataset.stat = s.id;
            item.innerHTML = `${s.label ? `<span class="zs-header-info-label">${esc(s.label)}</span>` : ""}<span class="zs-header-info-value">${esc(s.value != null ? s.value : "")}</span>`;
            stats.appendChild(item);
            if (s.id) statMap[s.id] = item.querySelector(".zs-header-info-value");
        });
        if (stats.children.length) actions.appendChild(stats);

        if (opts.actions) {
            (Array.isArray(opts.actions) ? opts.actions : [opts.actions]).forEach((a) => { if (a) actions.appendChild(a); });
        }

        top.appendChild(logo);
        top.appendChild(actions);
        header.appendChild(top);

        // Drag-reorder the stats row when the shared engine is loaded.
        const drag = window.ZGui && window.ZGui.drag;
        if (stats.children.length && drag) {
            drag.init(stats, ".zs-header-info-item", "headerStatsOrder", {
                direction: "horizontal",
                getKey: (el) => el.dataset.stat || el.textContent.trim().slice(0, 20),
                toastKey: "toast.reordered_header_stats",
            });
        }

        const verEl = logo.querySelector(".zs-logo-version");
        const gitEl = logo.querySelector(".zs-logo-git");
        return {
            el: header,
            setVersion(v) { if (verEl) { verEl.textContent = v || ""; verEl.hidden = !v; } },
            setGitRev(r) { if (gitEl) { gitEl.textContent = r || ""; gitEl.hidden = !r; } },
            setStat(id, value) { if (statMap[id]) statMap[id].textContent = value != null ? value : ""; },
        };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.header = { build: build };
})();
