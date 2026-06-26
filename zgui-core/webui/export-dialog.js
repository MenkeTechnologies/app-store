// zgui-core/export-dialog.js — the generic table import/export dialog, distilled from
// Audio-Haxor's export.js (the GENERIC chrome only — the per-tab data writers stay in the app).
// Owns the format-picker modal, selection highlight, progress bar, and the Tauri save-dialog
// handoff; the consumer supplies the actual writer via `onExport`. window.ZGui.exportDialog.
//
//   ZGui.exportDialog.open({
//       title: 'Audio Library',       // what is being exported (shown in the modal)
//       itemCount: 1234,              // row count badge (optional)
//       formats: [...] ,              // override the default json/toml/csv/tsv/pdf set
//       defaultName: 'export',        // default filename (no extension)
//       onExport(fmt, ext, filePath)  // required: returns a Promise that writes the file
//   })
//
//   ZGui.exportDialog.pickImport({ formats }) -> Promise<{ path, ext } | null>
//     thin import-side helper: opens the Tauri open-dialog filtered to the format extensions.
//
// Host may provide window.escapeHtml and window.showToast(msg, ms?, kind?); both have fallbacks.
(function () {
    "use strict";

    const esc = window.escapeHtml || function (s) {
        const d = document.createElement("div");
        d.textContent = s == null ? "" : String(s);
        return d.innerHTML;
    };
    function toast(msg, ms, kind) { if (typeof window.showToast === "function") window.showToast(msg, ms, kind); }

    const DEFAULT_FORMATS = [
        { id: "json", ext: "json", icon: "{ }", label: "JSON", desc: "Structured, machine-readable" },
        { id: "toml", ext: "toml", icon: "[T]", label: "TOML", desc: "Human-friendly config format" },
        { id: "csv", ext: "csv", icon: ",,,", label: "CSV", desc: "Comma-separated, spreadsheet-ready" },
        { id: "tsv", ext: "tsv", icon: "\\t", label: "TSV", desc: "Tab-separated values" },
        { id: "pdf", ext: "pdf", icon: "&#128196;", label: "PDF", desc: "Printable document" },
    ];

    function dialogApi() { return window.__TAURI_PLUGIN_DIALOG__ || null; }

    function close() {
        const m = document.getElementById("zs-export-modal");
        if (m) m.remove();
    }

    function open(ctx) {
        ctx = ctx || {};
        close();
        const formats = (ctx.formats && ctx.formats.length ? ctx.formats : DEFAULT_FORMATS);
        const title = ctx.title || "Export";
        const count = Math.max(0, Number(ctx.itemCount) || 0);
        const countLine = count ? `${count.toLocaleString()} items` : "";

        const html = `<div class="zs-export-overlay" id="zs-export-modal">
          <div class="zs-export-box">
            <div class="zs-export-head">
              <h2>Export ${esc(title)}</h2>
              <button class="zs-export-close" title="Close">&#10005;</button>
            </div>
            <div class="zs-export-body">
              ${countLine ? `<div class="zs-export-info"><span class="zs-export-count">${esc(countLine)}</span><span class="zs-export-type">${esc(title)}</span></div>` : ""}
              <div class="zs-export-formats">
                ${formats.map((f, i) => `
                  <label class="zs-export-opt ${i === 0 ? "selected" : ""}">
                    <input type="radio" name="zsExportFmt" value="${esc(f.id)}" ${i === 0 ? "checked" : ""}>
                    <span class="zs-export-fmt-icon">${f.icon || "{ }"}</span>
                    <span class="zs-export-fmt-info">
                      <span class="zs-export-fmt-label">${esc(f.label || f.id)}</span>
                      <span class="zs-export-fmt-desc">${esc(f.desc || "")}</span>
                    </span>
                    <span class="zs-export-fmt-ext">.${esc(f.ext || f.id)}</span>
                  </label>`).join("")}
              </div>
              <div class="zs-export-progress" style="display:none;">
                <div class="zs-export-progress-bar"><div class="zs-export-progress-fill"></div></div>
                <span class="zs-export-progress-text">Exporting…</span>
              </div>
              <div class="zs-export-actions">
                <button class="zs-btn zs-btn-primary zs-export-confirm">&#8615; Export</button>
                <button class="zs-btn zs-export-cancel">Cancel</button>
              </div>
            </div>
          </div>
        </div>`;
        document.body.insertAdjacentHTML("beforeend", html);
        const modal = document.getElementById("zs-export-modal");

        modal.querySelector(".zs-export-formats").addEventListener("change", (e) => {
            modal.querySelectorAll(".zs-export-opt").forEach((o) => o.classList.remove("selected"));
            e.target.closest(".zs-export-opt")?.classList.add("selected");
        });
        modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
        modal.querySelector(".zs-export-close").addEventListener("click", close);
        modal.querySelector(".zs-export-cancel").addEventListener("click", close);
        modal.querySelector(".zs-export-confirm").addEventListener("click", () => doExport(ctx, formats));
    }

    function selectedFormat(formats) {
        const checked = document.querySelector('#zs-export-modal input[name="zsExportFmt"]:checked');
        const id = checked ? checked.value : (formats[0] && formats[0].id);
        return formats.find((f) => f.id === id) || formats[0];
    }

    async function doExport(ctx, formats) {
        const fmt = selectedFormat(formats);
        if (!fmt) return;
        const ext = fmt.ext || fmt.id;
        let filePath = null;
        const api = dialogApi();
        if (api) {
            filePath = await api.save({
                title: `Export ${ctx.title || ""}`.trim(),
                defaultPath: ctx.defaultName ? `${ctx.defaultName}.${ext}` : undefined,
                filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
            });
            if (!filePath) return; // user cancelled the save dialog
        }

        const modal = document.getElementById("zs-export-modal");
        const progress = modal && modal.querySelector(".zs-export-progress");
        const actions = modal && modal.querySelector(".zs-export-actions");
        const fill = modal && modal.querySelector(".zs-export-progress-fill");
        if (progress) progress.style.display = "";
        if (actions) actions.style.display = "none";
        if (fill) { fill.style.width = "0%"; fill.style.animation = "progress-indeterminate 1.5s ease-in-out infinite"; }

        const title = ctx.title || "";
        close();
        toast(`Exporting ${title} as ${ext.toUpperCase()}…`);
        try {
            if (typeof ctx.onExport === "function") await ctx.onExport(fmt.id, ext, filePath);
            toast(`Exported ${title} as ${ext.toUpperCase()}`);
        } catch (err) {
            toast(`Export failed: ${(err && err.message) || err || "Unknown error"}`, 4000, "error");
        }
    }

    async function pickImport(opts) {
        opts = opts || {};
        const api = dialogApi();
        if (!api) return null;
        const formats = (opts.formats && opts.formats.length ? opts.formats : DEFAULT_FORMATS);
        const exts = formats.map((f) => f.ext || f.id);
        const path = await api.open({
            title: "Import",
            multiple: false,
            filters: [{ name: "Data", extensions: exts }],
        });
        if (!path) return null;
        const ext = String(path).split(".").pop().toLowerCase();
        return { path: path, ext: ext };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.exportDialog = { open: open, close: close, pickImport: pickImport, DEFAULT_FORMATS: DEFAULT_FORMATS };
})();
