// zgui-core/toml-view.js — render a TOML string as a grouped, syntax-highlighted view: tables as
// headers, key = value rows with the value colored by type (string / number / bool / date / array).
// Line-based and self-contained (no parser dep); lines it can't classify are shown raw. For DISPLAY,
// not round-trip editing. window.ZGui.tomlView.
//   ZGui.tomlView(container, tomlString, {}) -> { el, set(toml) }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });

    function valHtml(raw) {
        raw = raw.trim();
        // strip a trailing inline comment that's outside quotes/brackets
        if (raw[0] !== '"' && raw[0] !== "'" && raw[0] !== "[" && raw[0] !== "{") {
            const h = raw.indexOf("#");
            if (h > 0) raw = raw.slice(0, h).trim();
        }
        if (raw === "true" || raw === "false") return `<span class="zg-toml-bool">${raw}</span>`;
        if (/^[+-]?(\d[\d_]*\.?\d*([eE][+-]?\d+)?|0x[0-9a-fA-F]+|0o[0-7]+|0b[01]+|inf|nan)$/.test(raw)) return `<span class="zg-toml-num">${esc(raw)}</span>`;
        if (/^\d{4}-\d\d-\d\d([Tt ][\d:.+Zz-]*)?$/.test(raw) || /^\d\d:\d\d:\d\d/.test(raw)) return `<span class="zg-toml-date">${esc(raw)}</span>`;
        if (raw[0] === "[" || raw[0] === "{") return `<span class="zg-toml-arr">${esc(raw)}</span>`;
        return `<span class="zg-toml-str">${esc(raw)}</span>`;
    }

    function tomlView(container, toml, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        const el = document.createElement("div");
        el.className = "zg-toml";
        host.appendChild(el);

        function row(cls, text) { const d = document.createElement("div"); d.className = cls; d.textContent = text; el.appendChild(d); return d; }

        function set(text) {
            el.innerHTML = "";
            const lines = String(text == null ? "" : text).split(/\r?\n/);
            let i = 0;
            while (i < lines.length) {
                const line = lines[i];
                const trimmed = line.trim();
                if (trimmed === "") { i++; continue; }
                if (trimmed[0] === "#") { row("zg-toml-comment", trimmed); i++; continue; }
                if (trimmed[0] === "[") { row("zg-toml-table", trimmed); i++; continue; }
                const eq = line.indexOf("=");
                if (eq > 0) {
                    const key = line.slice(0, eq).trim();
                    let val = line.slice(eq + 1).trim();
                    // join a multi-line array/inline-table until brackets balance
                    let guard = 0;
                    while (guard++ < 500
                        && ((val.split("[").length - val.split("]").length) > 0 || (val.split("{").length - val.split("}").length) > 0)
                        && i + 1 < lines.length) {
                        i++; val += " " + lines[i].trim();
                    }
                    const r = document.createElement("div");
                    r.className = "zg-toml-row";
                    r.innerHTML = `<span class="zg-toml-key">${esc(key)}</span><span class="zg-toml-eq"> = </span>${valHtml(val)}`;
                    el.appendChild(r);
                    i++;
                    continue;
                }
                row("zg-toml-raw", trimmed);
                i++;
            }
            if (!el.childNodes.length) row("zg-toml-raw", "(empty)");
        }
        set(toml);
        return { el, set };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.tomlView = tomlView;
})();
