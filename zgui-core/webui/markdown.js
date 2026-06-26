// zgui-core/markdown.js — minimal CSP-safe Markdown → DOM (no innerHTML), ported from zreq's
// renderMarkdown/inlineNodes. Supports ATX headings (# … ######), bullet lists (-/*), and inline
// **bold** / *italic* / `code`. Unknown syntax renders as plain text. Because it builds real text
// + element nodes (never innerHTML), it is safe under the strict Tauri release CSP. Reuse for any
// description / help / README / changelog surface. window.ZGui.markdown.
//
//   ZGui.markdown.render(text)            -> Node[]   (block nodes: h1-6 / .zg-md-li / p)
//   ZGui.markdown.mount(container, text)             (clears container, appends the blocks)
//   ZGui.markdown.inline(text)            -> Node[]   (just the inline span of one string)
(function () {
    "use strict";

    function inline(s) {
        const nodes = [];
        const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
        let last = 0, m;
        while ((m = re.exec(s)) !== null) {
            if (m.index > last) nodes.push(document.createTextNode(s.slice(last, m.index)));
            let tag = "strong", inner = m[2];
            if (m[3] !== undefined) { tag = "em"; inner = m[3]; }
            else if (m[4] !== undefined) { tag = "code"; inner = m[4]; }
            const e = document.createElement(tag);
            if (tag === "code") e.className = "zg-md-code";
            e.textContent = inner;
            nodes.push(e);
            last = re.lastIndex;
        }
        if (last < s.length) nodes.push(document.createTextNode(s.slice(last)));
        return nodes;
    }

    function render(text) {
        const blocks = [];
        for (const raw of String(text || "").split("\n")) {
            const line = raw.replace(/\s+$/, "");
            if (line === "") continue;
            const h = line.match(/^(#{1,6})\s+(.*)$/);
            if (h) {
                const el = document.createElement("h" + h[1].length);
                el.className = "zg-md-h";
                inline(h[2]).forEach((n) => el.append(n));
                blocks.push(el);
                continue;
            }
            const li = line.match(/^[-*]\s+(.*)$/);
            if (li) {
                const el = document.createElement("div");
                el.className = "zg-md-li";
                el.append(document.createTextNode("• "));
                inline(li[1]).forEach((n) => el.append(n));
                blocks.push(el);
                continue;
            }
            const p = document.createElement("p");
            p.className = "zg-md-p";
            inline(line).forEach((n) => p.append(n));
            blocks.push(p);
        }
        return blocks;
    }

    function mount(container, text) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        host.classList.add("zg-md");
        while (host.firstChild) host.removeChild(host.firstChild);
        render(text).forEach((n) => host.append(n));
        return host;
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.markdown = { render: render, mount: mount, inline: inline };
})();
