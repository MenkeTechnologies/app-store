// zgui-core/regex-lens.js — a regex field bound to a target element: as you type a pattern, matches
// highlight live in the target with per-capture-group coloring, plus a match count. The sed/grep/perl
// loop, inline. window.ZGui.regexLens.
//   ZGui.regexLens(container, { target, pattern, flags:'g', onMatch(matches) }) ->
//       { el, input, setTarget(el), apply(), get() }
(function () {
    "use strict";
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const GROUP = ["g0", "g1", "g2", "g3", "g4", "g5"];
    function regexLens(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let target = typeof opts.target === "string" ? document.querySelector(opts.target) : opts.target;
        let original = target ? target.textContent : "";

        const root = document.createElement("div"); root.className = "zg-regexlens";
        const slash1 = document.createElement("span"); slash1.className = "zg-regexlens-slash"; slash1.textContent = "/";
        const input = document.createElement("input"); input.className = "zg-regexlens-input"; input.placeholder = "regex…"; input.value = opts.pattern || "";
        const slash2 = document.createElement("span"); slash2.className = "zg-regexlens-slash"; slash2.textContent = "/";
        const flags = document.createElement("input"); flags.className = "zg-regexlens-flags"; flags.value = opts.flags || "g"; flags.size = 3;
        const count = document.createElement("span"); count.className = "zg-regexlens-count";
        root.append(slash1, input, slash2, flags, count);
        host.appendChild(root);

        function apply() {
            if (!target) return;
            const pat = input.value;
            if (!pat) { target.textContent = original; count.textContent = ""; root.classList.remove("err"); return; }
            let re; try { re = new RegExp(pat, flags.value.includes("g") ? flags.value : flags.value + "g"); root.classList.remove("err"); } catch (_) { root.classList.add("err"); count.textContent = "✗"; return; }
            let out = "", last = 0, n = 0, m;
            re.lastIndex = 0;
            while ((m = re.exec(original)) !== null) {
                n++;
                out += esc(original.slice(last, m.index));
                if (m.length > 1) { // color capture groups within the match
                    let inner = "", pos = m.index; const whole = m[0];
                    // simple: wrap whole match, then re-mark groups by find within
                    inner = esc(whole);
                    for (let g = 1; g < m.length && g < GROUP.length; g++) { if (m[g]) inner = inner.replace(esc(m[g]), `<mark class="zg-rl-${GROUP[g]}">${esc(m[g])}</mark>`); }
                    out += `<mark class="zg-rl-g0">${inner}</mark>`;
                } else out += `<mark class="zg-rl-g0">${esc(whole(m))}</mark>`;
                last = m.index + m[0].length;
                if (m[0] === "") re.lastIndex++;
            }
            out += esc(original.slice(last));
            target.innerHTML = out; count.textContent = n + (n === 1 ? " match" : " matches");
            if (typeof opts.onMatch === "function") opts.onMatch(n);
        }
        function whole(m) { return m[0]; }
        input.addEventListener("input", apply); flags.addEventListener("input", apply);
        apply();
        return { el: root, input, setTarget(t) { target = typeof t === "string" ? document.querySelector(t) : t; original = target ? target.textContent : ""; apply(); }, apply, get() { return input.value; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.regexLens = regexLens;
})();
