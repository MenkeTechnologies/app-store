// zgui-core/json-view.js — a collapsible JSON tree, ported faithfully from Audio-Haxor's xref.js
// buildJsonTree. In haxor the JSON and XML viewers share ONE renderer family: both emit `.xml-node` /
// `.xml-toggle` / `.xml-children` / `.xml-collapsed-summary` nodes, so the SAME toggle delegation (and
// most of the same CSS) drives both. This keeps that parity — jsonView mounts into a `.zg-xml` host
// and uses the shared toggle handler, with json-specific value coloring (magenta `[]`, cyan `{}`,
// orange numbers, accent keys). Objects/arrays auto-collapse below depth 2. window.ZGui.jsonView.
//
//   ZGui.jsonView(container, value, { collapseDepth:2 }) -> { el }
//   ZGui.jsonView.node(value, depth?) -> HTMLElement
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    const t = (key, def, vars) => (window.ZGui && window.ZGui.i18n) ? window.ZGui.i18n.t(def || key, vars) : (def || key);
    const PAD = '<span class="xml-toggle-pad"></span>';

    function build(data, depth, cd) {
        const el = document.createElement("div");
        el.className = "xml-node"; el.style.paddingLeft = (depth * 16) + "px";
        const collapseBelow = cd == null ? 2 : cd;

        if (data === null || data === undefined) {
            el.innerHTML = PAD + '<span class="xml-text zg-json-null">' + esc(t("ui.xref.json_null_value", "null")) + "</span>";
            return el;
        }
        if (typeof data === "string") { el.innerHTML = PAD + '<span class="xml-attr-val">"' + esc(data) + '"</span>'; return el; }
        if (typeof data === "number" || typeof data === "boolean") { el.innerHTML = PAD + '<span class="xml-text zg-json-num">' + esc(String(data)) + "</span>"; return el; }

        if (Array.isArray(data)) {
            const count = data.length;
            const summary = '<span class="xml-collapsed-summary" style="display:none;">' + esc(t("ui.xref.json_collapsed_n_items", "{n} items", { n: count })) + "</span>";
            const inline = '<span class="zg-json-inline">' + esc(t("ui.xref.json_inline_n_items", "{n} items", { n: count })) + "</span>";
            el.innerHTML = '<span class="xml-toggle">▼</span><span class="zg-json-bracket">[</span> ' + inline + summary;
            const children = document.createElement("div"); children.className = "xml-children";
            for (let i = 0; i < data.length; i++) {
                const row = document.createElement("div"); row.className = "xml-node"; row.style.paddingLeft = ((depth + 1) * 16) + "px";
                row.innerHTML = '<span class="zg-json-idx">' + i + ": </span>";
                const val = build(data[i], 0, cd); val.style.paddingLeft = "0"; val.style.display = "inline";
                row.appendChild(val); children.appendChild(row);
            }
            const close = document.createElement("div"); close.style.paddingLeft = (depth * 16) + "px";
            close.innerHTML = PAD + '<span class="zg-json-bracket">]</span>';
            children.appendChild(close); el.appendChild(children);
            if (depth > collapseBelow) { children.style.display = "none"; el.querySelector(".xml-toggle").textContent = "▶"; el.querySelector(".xml-collapsed-summary").style.display = ""; }
            return el;
        }

        if (typeof data === "object") {
            const keys = Object.keys(data);
            const summary = '<span class="xml-collapsed-summary" style="display:none;">' + esc(t("ui.xref.json_collapsed_n_keys", "{n} keys", { n: keys.length })) + "</span>";
            const inline = '<span class="zg-json-inline">' + esc(t("ui.xref.json_inline_n_keys", "{n} keys", { n: keys.length })) + "</span>";
            el.innerHTML = '<span class="xml-toggle">▼</span><span class="xml-tag">{</span> ' + inline + summary;
            const children = document.createElement("div"); children.className = "xml-children";
            for (const key of keys) {
                const row = document.createElement("div"); row.className = "xml-node"; row.style.paddingLeft = ((depth + 1) * 16) + "px";
                row.innerHTML = '<span class="xml-attr-name">"' + esc(key) + '"</span><span class="zg-json-colon">: </span>';
                const val = build(data[key], depth + 1, cd); val.style.paddingLeft = "0"; val.style.display = "inline";
                row.appendChild(val); children.appendChild(row);
            }
            const close = document.createElement("div"); close.style.paddingLeft = (depth * 16) + "px";
            close.innerHTML = PAD + '<span class="xml-tag">}</span>';
            children.appendChild(close); el.appendChild(children);
            if (depth > collapseBelow) { children.style.display = "none"; el.querySelector(".xml-toggle").textContent = "▶"; el.querySelector(".xml-collapsed-summary").style.display = ""; }
            return el;
        }
        el.innerHTML = PAD + '<span class="xml-text">' + esc(String(data)) + "</span>";
        return el;
    }

    function jsonView(container, value, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        host.classList.add("zg-xml", "zg-json"); host.innerHTML = "";
        host.appendChild(build(value, 0, opts.collapseDepth));
        // Same toggle delegation as xmlView: collapse `.xml-children`, swap ▼/▶, show the count summary.
        host.addEventListener("click", (e) => {
            const tg = e.target.closest(".xml-toggle"); if (!tg) return;
            const nd = tg.closest(".xml-node"); const cc = nd.querySelector(":scope > .xml-children"); if (!cc) return;
            const open = cc.style.display !== "none"; cc.style.display = open ? "none" : "";
            tg.textContent = open ? "▶" : "▼";
            const sm = nd.querySelector(":scope > .xml-collapsed-summary"); if (sm) sm.style.display = open ? "" : "none";
        });
        return { el: host };
    }
    jsonView.node = (value, depth) => build(value, depth || 0, undefined);
    window.ZGui = window.ZGui || {};
    window.ZGui.jsonView = jsonView;
})();
