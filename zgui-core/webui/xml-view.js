// zgui-core/xml-view.js — a collapsible XML tree viewer, ported faithfully from Audio-Haxor's
// xref.js buildXmlTree (used for .als/.dawproject/.song project files). Parses an XML string (or a
// DOM node), renders syntax-colored tags/attrs/text with per-node collapse (auto-collapses below
// depth 2), and a child-count summary on collapsed nodes. window.ZGui.xmlView.
//
//   ZGui.xmlView(container, xmlString, { collapseDepth:2 }) -> { el }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    const t = (key, def, vars) => (window.ZGui && window.ZGui.i18n) ? window.ZGui.i18n.t(def || key, vars) : (def || key);
    function build(node, depth, cd) {
        const el = document.createElement("div");
        el.className = "xml-node"; el.style.paddingLeft = (depth * 16) + "px";
        if (node.nodeType === 3) { const text = node.textContent.trim(); if (text) el.innerHTML = '<span class="xml-text">' + esc(text) + "</span>"; return el; }
        if (node.nodeType !== 1) return el;
        const tag = node.tagName;
        const kids = [...node.childNodes].filter((c) => c.nodeType === 1 || (c.nodeType === 3 && c.textContent.trim()));
        let attrs = "";
        if (node.attributes.length) attrs = '<span class="xml-attrs">' + [...node.attributes].map((a) => ' <span class="xml-attr-name">' + esc(a.name) + '</span>=<span class="xml-attr-val">"' + esc(a.value) + '"</span>').join("") + "</span>";
        if (kids.length) {
            const summary = '<span class="xml-collapsed-summary" style="display:none;">' + esc(t("ui.xref.xml_collapsed_n_children", "{n} children", { n: node.children.length })) + "</span>";
            el.innerHTML = '<span class="xml-toggle">▼</span><span class="xml-tag">&lt;' + esc(tag) + "</span>" + attrs + '<span class="xml-tag">&gt;</span>' + summary;
            const cc = document.createElement("div"); cc.className = "xml-children";
            kids.forEach((c) => cc.appendChild(build(c, depth + 1, cd)));
            const close = document.createElement("div"); close.className = "xml-close-tag"; close.style.paddingLeft = (depth * 16) + "px";
            close.innerHTML = '<span class="xml-toggle-pad"></span><span class="xml-tag">&lt;/' + esc(tag) + "&gt;</span>";
            cc.appendChild(close); el.appendChild(cc);
            if (depth > (cd == null ? 2 : cd)) { cc.style.display = "none"; el.querySelector(".xml-toggle").textContent = "▶"; el.querySelector(".xml-collapsed-summary").style.display = ""; }
        } else {
            const text = node.textContent.trim();
            if (text) el.innerHTML = '<span class="xml-toggle-pad"></span><span class="xml-tag">&lt;' + esc(tag) + "</span>" + attrs + '<span class="xml-tag">&gt;</span><span class="xml-text">' + esc(text) + '</span><span class="xml-tag">&lt;/' + esc(tag) + "&gt;</span>";
            else el.innerHTML = '<span class="xml-toggle-pad"></span><span class="xml-tag">&lt;' + esc(tag) + "</span>" + attrs + '<span class="xml-tag"> /&gt;</span>';
        }
        return el;
    }
    function xmlView(container, xml, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let root = xml;
        if (typeof xml === "string") { const doc = new DOMParser().parseFromString(xml, "application/xml"); root = doc.documentElement; }
        else if (xml && xml.documentElement) root = xml.documentElement;
        host.classList.add("zg-xml"); host.innerHTML = "";
        if (root) host.appendChild(build(root, 0, opts.collapseDepth));
        host.addEventListener("click", (e) => {
            const tg = e.target.closest(".xml-toggle"); if (!tg) return;
            const nd = tg.closest(".xml-node"); const cc = nd.querySelector(":scope > .xml-children"); if (!cc) return;
            const open = cc.style.display !== "none"; cc.style.display = open ? "none" : "";
            tg.textContent = open ? "▶" : "▼";
            const sm = nd.querySelector(":scope > .xml-collapsed-summary"); if (sm) sm.style.display = open ? "" : "none";
        });
        return { el: host };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.xmlView = xmlView;
})();
