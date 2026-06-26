// zgui-core/diff-view.js — a unified line-diff viewer. Takes two strings (or a precomputed diff)
// and renders +added / -removed / context lines. Plain LCS-free line diff (good enough for configs,
// scans, small files). window.ZGui.diffView.
//
//   ZGui.diffView(container, oldText, newText)  |  ZGui.diffView.lines(oldText,newText) -> [{type,text}]
(function () {
    "use strict";
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    // Minimal line diff: longest-common-subsequence over lines, then emit add/del/context.
    function lines(oldText, newText) {
        const a = String(oldText == null ? "" : oldText).split("\n"), b = String(newText == null ? "" : newText).split("\n");
        const n = a.length, m = b.length;
        const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
        for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        const out = []; let i = 0, j = 0;
        while (i < n && j < m) {
            if (a[i] === b[j]) { out.push({ type: "ctx", text: a[i] }); i++; j++; }
            else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: "del", text: a[i] }); i++; }
            else { out.push({ type: "add", text: b[j] }); j++; }
        }
        while (i < n) out.push({ type: "del", text: a[i++] });
        while (j < m) out.push({ type: "add", text: b[j++] });
        return out;
    }
    function diffView(container, oldText, newText) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        host.classList.add("zg-diff");
        host.innerHTML = "";
        const pre = el("div", "zg-diff-body", host);
        lines(oldText, newText).forEach((ln) => {
            const row = el("div", "zg-diff-line zg-diff-" + ln.type, pre);
            el("span", "zg-diff-gutter", row, ln.type === "add" ? "+" : ln.type === "del" ? "−" : " ");
            el("span", "zg-diff-text", row, ln.text);
        });
        return { el: host };
    }
    diffView.lines = lines;
    window.ZGui = window.ZGui || {};
    window.ZGui.diffView = diffView;
})();
