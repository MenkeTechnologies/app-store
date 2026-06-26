// zgui-core/pin-input.js — a segmented PIN / OTP code input. window.ZGui.pinInput.
//   ZGui.pinInput(container, { length=6, mask?, onChange?, onComplete? }) -> { el, get, set, clear, focus }
(function () {
    "use strict";
    function pinInput(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const len = opts.length || 6;
        host.classList.add("zg-pin");
        host.innerHTML = "";
        const cells = [];
        for (let i = 0; i < len; i++) {
            const c = document.createElement("input");
            c.className = "zg-pin-cell"; c.maxLength = 1; c.inputMode = "numeric";
            if (opts.mask) c.type = "password";
            host.appendChild(c); cells.push(c);
        }
        function val() { return cells.map((c) => c.value).join(""); }
        function emit() {
            const v = val();
            if (typeof opts.onChange === "function") opts.onChange(v);
            if (v.length === len && typeof opts.onComplete === "function") opts.onComplete(v);
        }
        host.addEventListener("input", (e) => {
            const i = cells.indexOf(e.target); if (i < 0) return;
            e.target.value = (e.target.value || "").slice(-1);
            if (e.target.value && i < len - 1) cells[i + 1].focus();
            emit();
        });
        host.addEventListener("keydown", (e) => {
            const i = cells.indexOf(e.target); if (i < 0) return;
            if (e.key === "Backspace" && !e.target.value && i > 0) cells[i - 1].focus();
            if (e.key === "ArrowLeft" && i > 0) cells[i - 1].focus();
            if (e.key === "ArrowRight" && i < len - 1) cells[i + 1].focus();
        });
        host.addEventListener("paste", (e) => {
            const t = (e.clipboardData || window.clipboardData).getData("text").replace(/\s/g, "");
            if (!t) return; e.preventDefault();
            for (let i = 0; i < len; i++) cells[i].value = t[i] || "";
            cells[Math.min(t.length, len - 1)].focus(); emit();
        });
        return { el: host, get: val, set(v) { v = String(v || ""); cells.forEach((c, i) => c.value = v[i] || ""); }, clear() { cells.forEach((c) => c.value = ""); }, focus() { cells[0].focus(); } };
    }
    window.ZGui = window.ZGui || {}; window.ZGui.pinInput = pinInput;
})();
