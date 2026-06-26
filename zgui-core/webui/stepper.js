// zgui-core/stepper.js — a multi-step wizard: a step header (numbered, current/done states) + a
// body slot the consumer fills per step + back/next nav. window.ZGui.stepper.
//
//   const w = ZGui.stepper(container, { steps:['Source','Map','Confirm'], onStep(i), onDone() });
//   w.body  // fill this for the current step ;  w.next(); w.back(); w.go(i);
(function () {
    "use strict";
    function el(t, c, p, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (p) p.appendChild(e); return e; }
    function stepper(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const steps = opts.steps || [];
        host.classList.add("zg-stepper");
        const headEl = el("div", "zg-stepper-head", host);
        const body = el("div", "zg-stepper-body", host);
        const nav = el("div", "zg-stepper-nav", host);
        const back = el("button", "zs-btn", nav, opts.backLabel || "Back"); back.type = "button";
        const next = el("button", "zs-btn zs-btn-primary", nav, opts.nextLabel || "Next"); next.type = "button";
        let cur = 0;
        const dots = steps.map((s, i) => { const d = el("div", "zg-step", headEl); el("span", "zg-step-n", d, String(i + 1)); el("span", "zg-step-lbl", d, s); return d; });
        function render() {
            dots.forEach((d, i) => { d.classList.toggle("current", i === cur); d.classList.toggle("done", i < cur); });
            back.disabled = cur === 0;
            next.textContent = cur === steps.length - 1 ? (opts.doneLabel || "Finish") : (opts.nextLabel || "Next");
            if (typeof opts.onStep === "function") opts.onStep(cur, body);
        }
        function go(i) { cur = Math.max(0, Math.min(steps.length - 1, i)); render(); }
        back.addEventListener("click", () => go(cur - 1));
        next.addEventListener("click", () => { if (cur === steps.length - 1) { if (typeof opts.onDone === "function") opts.onDone(); } else go(cur + 1); });
        render();
        return { el: host, body, next: () => next.click(), back: () => go(cur - 1), go, get step() { return cur; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.stepper = stepper;
})();
