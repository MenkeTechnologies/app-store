// zgui-core/kv-editor.js — the key/value editor: rows of {key, value, enabled, description} with
// per-row enable toggles, an add-row button, and a bulk "Key: Value per line" textarea mode.
// Distilled from zreq's renderKvEditor/kvRow/parseBulkKv (the Postman params/headers/env/form
// editor) — the single most-reused config component across an API/settings/tooling suite.
// window.ZGui.kvEditor.
//
//   ZGui.kvEditor.mount(container, rows, {
//       enableToggle: true,     // per-row checkbox (row.enabled)
//       description: true,      // include a description column
//       bulk: true,             // offer a bulk "Key: Value" textarea toggle
//       headers: { key:'Key', value:'Value', description:'Description' },
//       addLabel: '+ Add row',
//       onChange: (rows) => {}, // fired after any add/remove/edit
//   }) -> { render(), rows, getRows() }
//
// `rows` is mutated in place (array of {key, value, enabled, description}). Pairs with kv-editor.css.
(function () {
    "use strict";

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }

    function parseBulk(text) {
        const out = [];
        for (let line of String(text).split("\n")) {
            let enabled = true;
            if (line.startsWith("# ")) { enabled = false; line = line.slice(2); }
            if (line.trim() === "") continue;
            const idx = line.indexOf(":");
            if (idx < 0) out.push({ key: line.trim(), value: "", enabled, description: "" });
            else out.push({ key: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim(), enabled, description: "" });
        }
        return out;
    }
    function serializeBulk(rows) {
        return rows.map((r) => (r.enabled === false ? "# " : "") + (r.key || "") + ": " + (r.value || "")).join("\n");
    }

    function mount(container, rows, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        rows = rows || [];
        const cfg = {
            enableToggle: opts.enableToggle !== false,
            description: opts.description !== false,
            bulk: opts.bulk !== false,
            headers: opts.headers || {},
            addLabel: opts.addLabel || "+ Add row",
            onChange: typeof opts.onChange === "function" ? opts.onChange : function () {},
        };
        let bulkMode = false;

        function gridCols() {
            const cols = [];
            if (cfg.enableToggle) cols.push("28px");
            cols.push("1fr", "1fr");
            if (cfg.description) cols.push("1fr");
            cols.push("28px");
            return cols.join(" ");
        }
        function changed() { cfg.onChange(rows); }

        function rowEl(row, i) {
            const wrap = el("div", "zg-kv-row");
            wrap.style.gridTemplateColumns = gridCols();
            if (cfg.enableToggle) {
                const chk = el("input", "zg-kv-chk");
                chk.type = "checkbox";
                chk.checked = row.enabled !== false;
                chk.addEventListener("change", () => { row.enabled = chk.checked; changed(); });
                wrap.append(chk);
            }
            const mk = (field, ph) => {
                const inp = el("input", "zs-input");   // the shared cyberpunk dark input (was a zg/zs typo → unstyled white)
                inp.type = "text";
                inp.value = row[field] || "";
                if (ph) inp.placeholder = ph;
                inp.addEventListener("input", () => { row[field] = inp.value; changed(); });
                return inp;
            };
            wrap.append(mk("key", cfg.headers.key || "Key"), mk("value", cfg.headers.value || "Value"));
            if (cfg.description) wrap.append(mk("description", cfg.headers.description || "Description"));
            const del = el("span", "zg-kv-del", "✕");
            del.title = "Remove row";
            del.addEventListener("click", () => { rows.splice(i, 1); render(); changed(); });
            wrap.append(del);
            return wrap;
        }

        function render() {
            host.innerHTML = "";
            host.classList.add("zg-kv");

            if (cfg.bulk) {
                const tools = el("div", "zg-kv-tools");
                const btn = el("button", "zs-btn zs-btn-mini", bulkMode ? "Table edit" : "Bulk edit");
                btn.type = "button";
                btn.addEventListener("click", () => { bulkMode = !bulkMode; render(); });
                tools.append(btn);
                host.append(tools);
            }

            if (bulkMode) {
                const ta = el("textarea", "zg-kv-bulk");
                ta.placeholder = "Key: Value per line  ·  prefix a line with '# ' to disable it";
                ta.value = serializeBulk(rows);
                ta.addEventListener("input", () => { rows.length = 0; parseBulk(ta.value).forEach((r) => rows.push(r)); changed(); });
                host.append(ta);
                return;
            }

            const head = el("div", "zg-kv-head");
            head.style.gridTemplateColumns = gridCols();
            if (cfg.enableToggle) head.append(el("span", null, ""));
            head.append(el("span", null, cfg.headers.key || "Key"), el("span", null, cfg.headers.value || "Value"));
            if (cfg.description) head.append(el("span", null, cfg.headers.description || "Description"));
            head.append(el("span", null, ""));
            host.append(head);

            rows.forEach((row, i) => host.append(rowEl(row, i)));

            const add = el("button", "zs-btn zs-btn-mini zg-kv-addrow", cfg.addLabel);
            add.type = "button";
            add.addEventListener("click", () => { rows.push({ key: "", value: "", enabled: true, description: "" }); render(); changed(); });
            host.append(add);
        }

        render();
        return { render: render, rows: rows, getRows() { return rows; } };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.kvEditor = { mount: mount, parseBulk: parseBulk, serializeBulk: serializeBulk };
})();
