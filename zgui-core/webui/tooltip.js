// zgui-core/tooltip.js — delayed JS tooltips for HTML `title` attributes, ported from
// Audio-Haxor's tooltip-hover.js. Native WebKit title popovers ignore any CSS/JS delay; this
// stashes the `title`, then shows a floating layer after a configurable delay. Opt out per
// subtree with `data-tooltip-native`. Self-contained (inline styles, no CSS file). window.ZGui.tooltip.
//
//   ZGui.tooltip.init()        // start intercepting (idempotent)
//   delay comes from prefs.getItem('tooltipHoverDelayMs') (default 600ms) when window.prefs exists.
(function () {
    "use strict";

    let hoverTimer = null;
    let activeEl = null;
    let tipEl = null;
    let inited = false;

    function getDelayMs() {
        const raw = (typeof window.prefs !== "undefined" && window.prefs && typeof window.prefs.getItem === "function")
            ? window.prefs.getItem("tooltipHoverDelayMs") : null;
        const n = parseInt(String(raw != null && raw !== "" ? raw : "600"), 10);
        return Number.isNaN(n) ? 600 : Math.min(10000, Math.max(0, n));
    }

    function ensureTipEl() {
        if (tipEl) return tipEl;
        tipEl = document.createElement("div");
        tipEl.id = "zs-title-tooltip-layer";
        tipEl.setAttribute("role", "tooltip");
        tipEl.style.cssText = [
            "position:fixed", "z-index:50000", "max-width:min(420px,calc(100vw - 24px))",
            "padding:6px 10px", "border-radius:4px", "font-size:11px", "line-height:1.35",
            "pointer-events:none", "visibility:hidden",
            "background:var(--bg-card,#0d0d1a)", "color:var(--text,#e0f0ff)",
            "border:1px solid var(--border,#1a1a3e)", "box-shadow:0 4px 14px rgba(0,0,0,0.35)",
            "word-break:break-word",
        ].join(";");
        document.body.appendChild(tipEl);
        return tipEl;
    }

    function positionTip(anchor, tip) {
        const r = anchor.getBoundingClientRect();
        const tw = tip.offsetWidth || 200;
        const th = tip.offsetHeight || 24;
        let left = r.left;
        let top = r.bottom + 8;
        if (left + tw > window.innerWidth - 8) left = Math.max(8, window.innerWidth - tw - 8);
        if (left < 8) left = 8;
        if (top + th > window.innerHeight - 8) top = Math.max(8, r.top - th - 8);
        tip.style.left = `${left}px`;
        tip.style.top = `${top}px`;
    }

    function hideTooltip() {
        if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
        if (tipEl) tipEl.style.visibility = "hidden";
        if (activeEl) {
            const t = activeEl.getAttribute("data-app-title");
            if (t != null) { activeEl.setAttribute("title", t); activeEl.removeAttribute("data-app-title"); }
            activeEl = null;
        }
    }

    function onPointerOver(e) {
        const raw = e.target;
        const t = raw instanceof Element ? raw : raw && raw.parentElement;
        if (!t) return;
        if (t.closest("#zs-title-tooltip-layer")) return;
        if (t.closest("[data-tooltip-native]")) { if (activeEl) hideTooltip(); return; }

        const cand = t.closest("[title]");
        const titleText = cand && cand.getAttribute("title");
        if (!cand || !titleText) {
            if (activeEl && activeEl.contains(t)) return;
            if (activeEl) hideTooltip();
            return;
        }
        if (cand === activeEl) return;

        hideTooltip();
        cand.removeAttribute("title");
        cand.setAttribute("data-app-title", titleText);
        activeEl = cand;

        const delay = getDelayMs();
        const show = function () {
            hoverTimer = null;
            if (activeEl !== cand) return;
            const tip = ensureTipEl();
            tip.textContent = titleText;
            tip.style.visibility = "visible";
            positionTip(cand, tip);
        };
        if (delay <= 0) show();
        else hoverTimer = setTimeout(show, delay);
    }

    function onPointerOut(e) {
        if (!activeEl) return;
        const related = e.relatedTarget;
        const relEl = related instanceof Element ? related : related && related.parentElement;
        if (relEl && activeEl.contains(relEl)) return;
        hideTooltip();
    }

    function init() {
        if (inited) return;
        inited = true;
        document.addEventListener("pointerover", onPointerOver, true);
        document.addEventListener("pointerout", onPointerOut, true);
        window.addEventListener("scroll", hideTooltip, true);
        window.addEventListener("resize", hideTooltip);
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.tooltip = { init: init };
    if (!window.initTooltipHoverDelay) window.initTooltipHoverDelay = init;
})();
