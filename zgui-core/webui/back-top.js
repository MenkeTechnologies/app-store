// zgui-core/back-top.js — a floating "scroll to top" button that appears only after the page is
// scrolled past a threshold and smooth-scrolls back to the top. Ported from Ant Design's
// FloatButton.BackTop (visibilityHeight / duration / target). window.ZGui.backTop.
//   ZGui.backTop({ visibilityHeight:400, duration:450, target, icon:'⤒', onClick }) -> { el, destroy() }
(function () {
    "use strict";
    function backTop(opts) {
        opts = opts || {};
        const target = opts.target || window;
        const vis = opts.visibilityHeight == null ? 400 : opts.visibilityHeight;
        const dur = opts.duration == null ? 450 : opts.duration;
        const btn = document.createElement("button");
        btn.type = "button"; btn.className = "zg-backtop"; btn.title = "Back to top";
        btn.textContent = opts.icon || "⤒";
        document.body.appendChild(btn);

        function scrollTop() { return target === window ? window.pageYOffset : target.scrollTop; }
        function toggle() { btn.classList.toggle("show", scrollTop() >= vis); }
        function animateToTop() {
            const start = scrollTop(), t0 = performance.now();
            function step(now) {
                const p = Math.min(1, (now - t0) / dur);
                const ease = 1 - Math.pow(1 - p, 3);   // easeOutCubic
                const y = start * (1 - ease);
                if (target === window) window.scrollTo(0, y); else target.scrollTop = y;
                if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }
        btn.addEventListener("click", () => { animateToTop(); if (typeof opts.onClick === "function") opts.onClick(); });
        const evTarget = target === window ? window : target;
        evTarget.addEventListener("scroll", toggle, { passive: true });
        toggle();
        return { el: btn, destroy() { evTarget.removeEventListener("scroll", toggle); if (btn.parentNode) btn.parentNode.removeChild(btn); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.backTop = backTop;
})();
