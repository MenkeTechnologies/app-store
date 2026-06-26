// zgui-core/tabs.js — the main tab strip: switch active tab/panel + drag-reorder the strip,
// distilled from Audio-Haxor's switchTab + initTabDragReorder (utils.js). The GENERIC engine
// only — per-tab work (loading data, starting/stopping rAF) is the consumer's onSwitch callback.
// window.ZGui.tabs.
//
//   ZGui.tabs.init({
//       nav: '.tab-nav',          // the strip container (buttons are .tab-btn[data-tab])
//       onSwitch(tab),            // fired after the active class + panel toggle, on every switch
//       reorderable: true,        // drag-reorder the strip, persisted under prefsKey
//       prefsKey: 'tabOrder',
//       restore: true,            // restore saved order + last active tab on init
//   })
//   ZGui.tabs.switchTo(tab) / .active()
//
// Panels are `.tab-content` whose id (or data-tab) equals the tab key. Host may define
// window.prefs and window.showToast (a localStorage shim is installed; toast is optional).
(function () {
    "use strict";

    const prefs = window.prefs || (window.prefs = {
        getItem(k) { try { return localStorage.getItem(k); } catch { return null; } },
        setItem(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch { /* quota */ } },
        removeItem(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
    });

    let cfg = {};
    let navEl = null;

    function panels() { return document.querySelectorAll(".tab-content"); }
    function buttons() { return navEl ? navEl.querySelectorAll(".tab-btn") : document.querySelectorAll(".tab-nav .tab-btn"); }
    function panelKey(p) { return p.dataset.tab || p.id; }

    function switchTo(tab) {
        buttons().forEach(function (b) {
            const on = b.dataset.tab === tab;
            b.classList.toggle("active", on);
            if (on && typeof b.scrollIntoView === "function") b.scrollIntoView({ block: "nearest", inline: "nearest" });
        });
        panels().forEach(function (p) { p.classList.toggle("active", panelKey(p) === tab); });
        prefs.setItem("activeTab", tab);
        if (typeof cfg.onSwitch === "function") cfg.onSwitch(tab);
    }

    function active() {
        const b = navEl && navEl.querySelector(".tab-btn.active");
        return b ? b.dataset.tab : (prefs.getItem("activeTab") || null);
    }

    // ── drag reorder (faithful port of initTabDragReorder) ──
    function saveOrder(key) {
        const tabs = [...buttons()].map((b) => b.dataset.tab);
        prefs.setItem(key, JSON.stringify(tabs));
    }
    function restoreOrder(key) {
        const saved = prefs.getItem(key);
        if (!saved) return;
        try {
            const order = JSON.parse(saved);
            if (!Array.isArray(order)) return;
            const tabs = [...buttons()];
            const map = {};
            tabs.forEach((b) => { map[b.dataset.tab] = b; });
            for (const k of order) if (map[k]) navEl.appendChild(map[k]);
            tabs.forEach((b) => { if (!order.includes(b.dataset.tab)) navEl.appendChild(b); });
        } catch { /* corrupt */ }
    }

    function wireDrag(key) {
        let dragged = null, ghost = null, placeholder = null, startX = 0, offX = 0, offY = 0, isDragging = false, didMove = false;
        navEl.addEventListener("mousedown", function (e) {
            const btn = e.target.closest(".tab-btn");
            if (!btn || e.button !== 0) return;
            e.preventDefault();
            dragged = btn; startX = e.clientX;
            const r = btn.getBoundingClientRect();
            offX = e.clientX - r.left; offY = e.clientY - r.top;
            isDragging = false; didMove = false;
        });
        document.addEventListener("mousemove", function (e) {
            if (!dragged) return;
            if (!isDragging && Math.abs(e.clientX - startX) > 5) {
                isDragging = true;
                document.body.style.userSelect = "none";
                document.body.style.cursor = "grabbing";
                const r = dragged.getBoundingClientRect();
                placeholder = document.createElement("span");
                placeholder.className = "tab-placeholder";
                placeholder.style.width = r.width + "px";
                placeholder.style.height = r.height + "px";
                dragged.parentNode.insertBefore(placeholder, dragged);
                ghost = document.createElement("span");
                ghost.className = "tab-ghost";
                ghost.textContent = dragged.textContent.trim();
                ghost.style.left = (e.clientX - offX) + "px";
                ghost.style.top = (e.clientY - offY) + "px";
                document.body.appendChild(ghost);
                dragged.classList.add("tab-dragging");
            }
            if (!isDragging || !ghost) return;
            didMove = true;
            ghost.style.left = (e.clientX - offX) + "px";
            ghost.style.top = (e.clientY - offY) + "px";
            ghost.style.display = "none";
            const el = document.elementFromPoint(e.clientX, e.clientY);
            ghost.style.display = "";
            const target = el && el.closest(".tab-btn");
            navEl.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("tab-drag-over"));
            if (target && target !== dragged && target !== placeholder) {
                const tr = target.getBoundingClientRect();
                if (e.clientX < tr.left + tr.width / 2) navEl.insertBefore(placeholder, target);
                else navEl.insertBefore(placeholder, target.nextSibling);
            }
        });
        document.addEventListener("mouseup", function () {
            if (!dragged) return;
            if (isDragging) {
                navEl.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("tab-drag-over"));
                document.body.style.userSelect = "";
                document.body.style.cursor = "";
                if (placeholder && placeholder.parentNode) {
                    placeholder.parentNode.insertBefore(dragged, placeholder);
                    placeholder.remove();
                }
                dragged.classList.remove("tab-dragging");
                if (ghost) { ghost.remove(); ghost = null; }
                placeholder = null;
                saveOrder(key);
                if (typeof window.showToast === "function") window.showToast("Reordered tabs");
            }
            if (didMove) {
                navEl.addEventListener("click", function (ev) { ev.stopPropagation(); ev.preventDefault(); }, { capture: true, once: true });
            }
            dragged = null; isDragging = false; didMove = false;
        });
    }

    function init(opts) {
        cfg = opts || {};
        navEl = typeof cfg.nav === "string" ? document.querySelector(cfg.nav) : (cfg.nav || document.querySelector(".tab-nav"));
        if (!navEl) return;
        const prefsKey = cfg.prefsKey || "tabOrder";

        navEl.addEventListener("click", function (e) {
            const btn = e.target.closest(".tab-btn");
            if (btn && btn.dataset.tab) switchTo(btn.dataset.tab);
        });
        if (cfg.reorderable !== false) wireDrag(prefsKey);
        if (cfg.restore !== false) {
            restoreOrder(prefsKey);
            const last = prefs.getItem("activeTab");
            if (last) switchTo(last);
        }
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.tabs = { init: init, switchTo: switchTo, active: active, resetOrder(key) { prefs.removeItem(key || "tabOrder"); } };
})();
