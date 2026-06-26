// zgui-core/wizard.js — a multi-step wizard: step rail + body + back/next, beyond the linear stepper.
// window.ZGui.wizard.
//   ZGui.wizard(container, { steps:[{title, render(bodyEl)}], onFinish?, onStep? }) -> { el, next, back, goTo, current() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function wizard(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const steps = opts.steps || [];
        let cur = 0;
        host.classList.add("zg-wizard");
        const rail = document.createElement("div"); rail.className = "zg-wizard-rail";
        const body = document.createElement("div"); body.className = "zg-wizard-body";
        const foot = document.createElement("div"); foot.className = "zg-wizard-foot";
        const back = document.createElement("button"); back.type = "button"; back.className = "zs-btn zg-wizard-back"; back.textContent = "Back";
        const nextB = document.createElement("button"); nextB.type = "button"; nextB.className = "zs-btn zs-btn-primary zg-wizard-next";
        foot.appendChild(back); foot.appendChild(nextB);
        host.appendChild(rail); host.appendChild(body); host.appendChild(foot);
        function renderRail() {
            rail.innerHTML = steps.map((s, i) =>
                `<div class="zg-wizard-step${i === cur ? " active" : ""}${i < cur ? " done" : ""}"><span class="zg-wizard-num">${i < cur ? "✓" : i + 1}</span><span class="zg-wizard-step-title">${esc(s.title || "")}</span></div>`
            ).join('<span class="zg-wizard-conn"></span>');
        }
        function show() {
            renderRail();
            body.innerHTML = "";
            if (steps[cur] && typeof steps[cur].render === "function") steps[cur].render(body);
            back.disabled = cur === 0;
            nextB.textContent = cur === steps.length - 1 ? "Finish" : "Next";
            if (typeof opts.onStep === "function") opts.onStep(cur);
        }
        function goTo(i) { cur = Math.max(0, Math.min(steps.length - 1, i)); show(); }
        back.addEventListener("click", () => { if (cur > 0) goTo(cur - 1); });
        nextB.addEventListener("click", () => { if (cur < steps.length - 1) goTo(cur + 1); else if (typeof opts.onFinish === "function") opts.onFinish(); });
        show();
        return { el: host, next() { nextB.click(); }, back() { if (cur > 0) goTo(cur - 1); }, goTo, current() { return cur; } };
    }
    window.ZGui = window.ZGui || {}; window.ZGui.wizard = wizard;
})();
