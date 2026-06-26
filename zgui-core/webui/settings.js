// zgui-core/settings.js — the searchable settings scaffold, distilled from Audio-Haxor's
// settings-search.js + the .settings-section/.settings-row markup convention. Provides the
// client-side filter engine plus light row/section builders so apps render a consistent panel.
// window.ZGui.settings.
//
//   ZGui.settings.initSearch({
//       input: '#settingsSearchInput',     // the search box
//       container: '#tabSettings',         // root holding .settings-section blocks
//       empty: '#settingsSearchEmpty',     // "no matches" element (optional)
//       clearBtn: '#clearSettingsSearchBtn'// clear button (optional)
//   })
//   ZGui.settings.section(heading, rowsHtml)  -> '<div class="settings-section">…'
//   ZGui.settings.row({ title, desc, control })  -> '<div class="settings-row">…'
//
// Markup contract: .settings-section > .settings-heading + .settings-row(.settings-title/.settings-desc).
(function () {
    "use strict";

    const esc = window.escapeHtml || function (s) {
        const d = document.createElement("div");
        d.textContent = s == null ? "" : String(s);
        return d.innerHTML;
    };
    const norm = (s) => (s || "").toLowerCase().trim();

    function collectRowText(row) {
        const parts = [];
        const title = row.querySelector(".settings-title");
        if (title) parts.push(title.textContent || "");
        const desc = row.querySelector(".settings-desc");
        if (desc) parts.push(desc.textContent || "");
        row.querySelectorAll("select").forEach(function (s) {
            for (const opt of s.options) parts.push(opt.textContent || "");
        });
        return norm(parts.join(" "));
    }

    function initSearch(opts) {
        opts = opts || {};
        const input = document.querySelector(opts.input || "#settingsSearchInput");
        if (!input) return;
        const rootSel = opts.container || "#tabSettings";
        const emptyEl = opts.empty ? document.querySelector(opts.empty) : null;
        const clearBtn = opts.clearBtn ? document.querySelector(opts.clearBtn) : null;
        let debounce = null;

        function filter() {
            const q = norm(input.value);
            if (clearBtn) clearBtn.style.display = q ? "" : "none";
            const sections = document.querySelectorAll(`${rootSel} .settings-section`);
            let totalVisible = 0;
            for (const section of sections) {
                const heading = section.querySelector(".settings-heading");
                const sectionText = norm(heading ? heading.textContent : "");
                const sectionMatches = !q || sectionText.includes(q);
                let hasVisible = false;
                section.querySelectorAll(".settings-row").forEach(function (row) {
                    if (!q) { row.style.display = ""; hasVisible = true; return; }
                    const match = sectionMatches || collectRowText(row).includes(q);
                    row.style.display = match ? "" : "none";
                    if (match) hasVisible = true;
                });
                section.style.display = (hasVisible || sectionMatches) ? "" : "none";
                if (hasVisible || sectionMatches) totalVisible++;
            }
            if (emptyEl) emptyEl.style.display = (q && totalVisible === 0) ? "" : "none";
        }

        input.addEventListener("input", function () { clearTimeout(debounce); debounce = setTimeout(filter, 80); });
        input.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && input.value) { e.stopPropagation(); e.preventDefault(); input.value = ""; filter(); }
        }, true);
        if (clearBtn) clearBtn.addEventListener("click", function () { input.value = ""; input.focus(); filter(); });
        filter();
        return { filter };
    }

    function section(heading, rowsHtml) {
        return `<div class="settings-section"><div class="settings-heading">${esc(heading)}</div>${rowsHtml || ""}</div>`;
    }
    // Haxor markup contract: .settings-row > .settings-label(.settings-title + .settings-desc) + control.
    // (settings.css targets .settings-label — NOT .settings-meta — so the builder must match it exactly.)
    function row(o) {
        o = o || {};
        const label = `<div class="settings-label"><span class="settings-title">${esc(o.title || "")}</span>${o.desc ? `<span class="settings-desc">${esc(o.desc)}</span>` : ""}</div>`;
        const control = o.control != null ? (typeof o.control === "string" ? o.control : "") : "";
        return `<div class="settings-row">${label}${control}</div>`;
    }
    // The Haxor settings TOGGLE control: OFF/ON text label + a track/thumb pill (cyan when active).
    // Returns the HTML string to drop into row({control}); apps wire the click via [data-action].
    function toggle(o) {
        o = o || {};
        const on = !!o.on;
        const action = o.action ? ` data-action="${esc(o.action)}"` : "";
        return `<button type="button" class="settings-toggle${on ? " active" : ""}"${action} aria-pressed="${on}">`
            + `<span class="settings-toggle-label">${on ? "ON" : "OFF"}</span>`
            + `<span class="settings-toggle-track"><span class="settings-toggle-thumb"></span></span></button>`;
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.settings = { initSearch: initSearch, section: section, row: row, toggle: toggle };
})();
