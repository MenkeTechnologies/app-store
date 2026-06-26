// zgui-core/tour.js — a guided product tour: a dimming mask with a clear "hole" spotlighting the
// current step's target element, plus a popover (title / description / step dots / Prev·Next·Finish).
// Ported behavior from Ant Design's <Tour> (steps[{target,title,description,placement}], current,
// mask, onChange/onClose/onFinish, keyboard prev/next/esc). window.ZGui.tour.
//   ZGui.tour({ steps:[{ target:()=>el|el|selector, title, description, placement }], current:0,
//       mask:true, gap:6, onChange(i), onClose(), onFinish() }) ->
//       { start(i?), next(), prev(), goTo(i), close(), el }
(function () {
    "use strict";
    function tour(opts) {
        opts = opts || {};
        const steps = opts.steps || [];
        const gap = opts.gap == null ? 6 : opts.gap;
        const useMask = opts.mask !== false;
        let cur = -1;

        const layer = document.createElement("div"); layer.className = "zg-tour"; layer.hidden = true;
        const hole = document.createElement("div"); hole.className = "zg-tour-hole";
        const pop = document.createElement("div"); pop.className = "zg-tour-pop";
        if (!useMask) hole.classList.add("no-mask");
        layer.appendChild(hole); layer.appendChild(pop);

        function targetRect(step) {
            let t = step && step.target;
            if (typeof t === "function") t = t();
            if (typeof t === "string") t = document.querySelector(t);
            if (t && t.getBoundingClientRect) return { el: t, r: t.getBoundingClientRect() };
            return { el: null, r: null };
        }
        function placePop(r, placement) {
            // measure popover, then position relative to the target rect (default: below).
            const pw = pop.offsetWidth || 280, ph = pop.offsetHeight || 120, m = 12;
            const vw = window.innerWidth, vh = window.innerHeight;
            let x, y;
            if (!r) { x = (vw - pw) / 2; y = (vh - ph) / 2; }
            else {
                const p = placement || "bottom";
                if (p.startsWith("top")) { y = r.top - ph - m; x = r.left; }
                else if (p.startsWith("left")) { x = r.left - pw - m; y = r.top; }
                else if (p.startsWith("right")) { x = r.right + m; y = r.top; }
                else if (p === "center") { x = (vw - pw) / 2; y = (vh - ph) / 2; }
                else { y = r.bottom + m; x = r.left; }   // bottom*
                if (p.endsWith("Right")) x = r.right - pw;
                else if (p.endsWith("Bottom")) y = r.bottom - ph;
            }
            pop.style.left = Math.max(8, Math.min(x, vw - pw - 8)) + "px";
            pop.style.top = Math.max(8, Math.min(y, vh - ph - 8)) + "px";
        }
        function render() {
            const step = steps[cur]; if (!step) return;
            const { r } = targetRect(step);
            if (r && useMask) {
                hole.style.display = "block";
                hole.style.left = (r.left - gap) + "px"; hole.style.top = (r.top - gap) + "px";
                hole.style.width = (r.width + gap * 2) + "px"; hole.style.height = (r.height + gap * 2) + "px";
            } else { hole.style.display = useMask ? "block" : "none"; if (useMask) { hole.style.left = "-9999px"; hole.style.width = hole.style.height = "0px"; } }
            const last = cur === steps.length - 1;
            pop.innerHTML =
                `<div class="zg-tour-head">${step.title ? `<span class="zg-tour-title">${esc(step.title)}</span>` : ""}<button class="zg-tour-x" data-act="close">✕</button></div>`
                + (step.description ? `<div class="zg-tour-desc">${esc(step.description)}</div>` : "")
                + `<div class="zg-tour-foot"><div class="zg-tour-dots">${steps.map((_, i) => `<span class="zg-tour-dot${i === cur ? " on" : ""}"></span>`).join("")}</div>`
                + `<div class="zg-tour-btns">${cur > 0 ? '<button class="zg-tour-btn" data-act="prev">Prev</button>' : ""}`
                + `<button class="zg-tour-btn primary" data-act="${last ? "finish" : "next"}">${last ? "Finish" : "Next"}</button></div></div>`;
            placePop(r, step.placement);
            if (typeof opts.onChange === "function") opts.onChange(cur);
        }
        function esc(s) { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }

        function goTo(i) { if (i < 0 || i >= steps.length) return; cur = i; layer.hidden = false; render(); }
        function next() { if (cur >= steps.length - 1) return finish(); goTo(cur + 1); }
        function prev() { if (cur > 0) goTo(cur - 1); }
        function close() { layer.hidden = true; cur = -1; document.removeEventListener("keydown", onKey, true); window.removeEventListener("resize", onResize); window.removeEventListener("scroll", onResize, true); if (typeof opts.onClose === "function") opts.onClose(); }
        function finish() { layer.hidden = true; cur = -1; document.removeEventListener("keydown", onKey, true); window.removeEventListener("resize", onResize); window.removeEventListener("scroll", onResize, true); if (typeof opts.onFinish === "function") opts.onFinish(); }
        function start(i) { if (!layer.parentNode) document.body.appendChild(layer); document.addEventListener("keydown", onKey, true); window.addEventListener("resize", onResize); window.addEventListener("scroll", onResize, true); goTo(i || 0); }

        function onResize() { if (!layer.hidden) render(); }
        function onKey(e) {
            if (layer.hidden) return;
            if (e.key === "Escape") { e.preventDefault(); close(); }
            else if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); next(); }
            else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
        }
        pop.addEventListener("click", (e) => {
            const b = e.target.closest("[data-act]"); if (!b) return;
            const a = b.dataset.act;
            if (a === "close") close(); else if (a === "prev") prev(); else if (a === "next") next(); else if (a === "finish") finish();
        });

        return { el: layer, start, next, prev, goTo, close };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.tour = tour;
})();
