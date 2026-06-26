// zgui-core/copy-button.js — click-to-copy button with a "copied" flash, using the
// async Clipboard API (falls back to execCommand). window.ZGui.copyButton.
//   ZGui.copyButton({ text, label?, copiedLabel?, icon?, onCopy? }) -> { el, setText, copy }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function copyButton(opts) {
        opts = opts || {};
        let text = opts.text || "";
        const label = opts.label != null ? opts.label : "Copy";
        const copied = opts.copiedLabel || "Copied";
        const icon = opts.icon || "&#128203;";
        const el = document.createElement("button");
        el.type = "button";
        el.className = "zg-copy-btn";
        let timer = null;
        function paint(done) {
            el.innerHTML = `<span class="zg-copy-icon">${done ? "&#10003;" : icon}</span><span class="zg-copy-label">${esc(done ? copied : label)}</span>`;
            el.classList.toggle("zg-copied", !!done);
        }
        paint(false);
        async function copy() {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const ta = document.createElement("textarea");
                    ta.value = text;
                    ta.style.position = "fixed";
                    ta.style.opacity = "0";
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand("copy");
                    ta.remove();
                }
                paint(true);
                if (typeof opts.onCopy === "function") opts.onCopy(text);
                clearTimeout(timer);
                timer = setTimeout(() => paint(false), 1200);
            } catch (_) { /* clipboard denied — leave label unchanged */ }
        }
        el.addEventListener("click", copy);
        return { el, setText: (t) => { text = t == null ? "" : String(t); }, copy };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.copyButton = copyButton;
})();
