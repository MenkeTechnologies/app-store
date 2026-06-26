// zgui-core/diff-scrubber.js — a slider that scrubs through a value/file's version history and previews
// the line-level diff between adjacent versions inline as you drag. Scrub = diff. window.ZGui.diffScrubber.
//   ZGui.diffScrubber(container, { versions:[{label,text}], index, onScrub(i) }) ->
//       { el, set(versions), to(i), get() }
(function () {
    "use strict";
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    // minimal line diff via LCS
    function diffLines(aTxt, bTxt) {
        const a = (aTxt || "").split("\n"), b = (bTxt || "").split("\n");
        const m = a.length, n = b.length, dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        const out = []; let i = 0, j = 0;
        while (i < m && j < n) { if (a[i] === b[j]) { out.push(["ctx", a[i]]); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push(["del", a[i]]); i++; } else { out.push(["add", b[j]]); j++; } }
        while (i < m) out.push(["del", a[i++]]); while (j < n) out.push(["add", b[j++]]);
        return out;
    }
    function diffScrubber(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let versions = opts.versions || [];
        let idx = opts.index == null ? versions.length - 1 : opts.index;

        const root = document.createElement("div"); root.className = "zg-diffscrub";
        const head = document.createElement("div"); head.className = "zg-diffscrub-head";
        const slider = document.createElement("input"); slider.type = "range"; slider.className = "zg-diffscrub-slider"; slider.min = "0";
        const view = document.createElement("pre"); view.className = "zg-diffscrub-view";
        root.appendChild(head); root.appendChild(slider); root.appendChild(view); host.appendChild(root);

        function render() {
            slider.max = String(Math.max(0, versions.length - 1)); slider.value = String(idx);
            const cur = versions[idx], prev = versions[idx - 1];
            head.innerHTML = `<span class="zg-diffscrub-rev">${idx + 1}/${versions.length}</span><span class="zg-diffscrub-lbl">${esc(cur ? cur.label : "")}</span>${prev ? `<span class="zg-diffscrub-from">vs ${esc(prev.label)}</span>` : '<span class="zg-diffscrub-from">(initial)</span>'}`;
            if (!cur) { view.innerHTML = ""; return; }
            if (!prev) { view.innerHTML = esc(cur.text).split("\n").map((l) => `<span class="zg-diffscrub-ctx">  ${l}</span>`).join("\n"); return; }
            view.innerHTML = diffLines(prev.text, cur.text).map(([k, l]) => `<span class="zg-diffscrub-${k}">${k === "add" ? "+" : k === "del" ? "−" : " "} ${esc(l)}</span>`).join("\n");
        }
        slider.addEventListener("input", () => { idx = +slider.value; render(); if (typeof opts.onScrub === "function") opts.onScrub(idx); });
        render();
        return { el: root, set(v) { versions = v || []; idx = versions.length - 1; render(); }, to(i) { idx = Math.max(0, Math.min(versions.length - 1, i)); render(); }, get() { return idx; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.diffScrubber = diffScrubber;
})();
