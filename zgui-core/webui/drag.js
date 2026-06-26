// zgui-core/drag.js — the generic Trello-style drag-to-reorder engine, ported faithfully
// from Audio-Haxor's drag-reorder.js (the GENERIC core only; app-specific call sites stay in the
// app). A single global mousemove/mouseup pair — no per-container listener accumulation. Each
// container registers only a mousedown on itself. window.ZGui.drag.
//
//   ZGui.drag.init(container, childSelector, prefsKey, {
//       direction: 'vertical'|'horizontal',   // default 'vertical'
//       getKey(el, i),                          // identity for persistence (default: dataset/text)
//       handleSelector,                         // restrict drag start to a handle
//       onReorder(),                            // fired after a drop
//       toastKey | toastName | toastSilent,     // optional drop feedback (needs host showToast/toastFmt)
//       restoreMode: 'append'|'fragment',       // how saved order is reapplied
//       restoreAnchorSelector,                  // insert restored order after this element
//   })
//
// Host may pre-define window.prefs ({getObject,setItem}) and window.showToast/window.toastFmt;
// otherwise a localStorage-backed prefs shim is installed and toasts are skipped.
(function () {
    "use strict";

    const prefs = window.prefs || (window.prefs = {
        getObject(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
        setItem(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota */ } },
    });

    let _drag = null; // single drag at a time

    function resolveDragChild(container, childSelector, target) {
        if (!target || !container.contains(target)) return null;
        const hit = target.closest(childSelector);
        if (!hit || !container.contains(hit)) return null;
        let cur = hit;
        while (cur && cur.parentElement !== container) cur = cur.parentElement;
        return cur && cur.parentElement === container && cur.matches(childSelector) ? cur : null;
    }

    function listDragChildren(container, childSelector) {
        if (typeof container.querySelectorAll === "function") {
            try {
                return [...container.querySelectorAll(childSelector)].filter(
                    (c) => (c.parentElement || c.parentNode) === container
                );
            } catch { /* invalid selector */ }
        }
        const ch = container.children;
        if (ch == null) return [];
        try { return Array.from(ch).filter((c) => c.matches(childSelector)); } catch { return []; }
    }

    document.addEventListener("mousemove", (e) => {
        if (!_drag) return;
        const d = _drag;
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;

        if (!d.isDragging && Math.abs(d.direction === "horizontal" ? dx : dy) > 3) {
            d.isDragging = true;
            document.body.style.userSelect = "none";
            document.body.style.cursor = "grabbing";

            const rect = d.dragged.getBoundingClientRect();
            d.placeholder = document.createElement(d.dragged.tagName);
            d.placeholder.className = "trello-placeholder";
            for (const cls of d.dragged.classList) {
                if (cls.includes("wide") || cls.includes("span")) d.placeholder.classList.add(cls);
            }
            if (d.direction === "horizontal") {
                d.placeholder.style.width = rect.width + "px";
                d.placeholder.style.height = rect.height + "px";
                d.placeholder.style.display = "inline-block";
            } else {
                d.placeholder.style.height = rect.height + "px";
                d.placeholder.style.width = rect.width + "px";
            }
            d.dragged.parentNode.insertBefore(d.placeholder, d.dragged);

            d.ghost = d.dragged.cloneNode(true);
            d.ghost.classList.add("trello-ghost");
            d.ghost.style.cssText = `position:fixed;z-index:20000;width:${rect.width}px;height:${rect.height}px;left:${rect.left}px;top:${rect.top}px;pointer-events:none;opacity:0.9;transform:rotate(2deg) scale(1.05);will-change:transform,left,top;box-shadow:0 8px 32px rgba(0,0,0,0.5),0 0 20px rgba(5,217,232,0.3);border:2px solid var(--cyan);border-radius:4px;background:var(--bg-primary);transition:none;`;
            document.body.appendChild(d.ghost);
            d.dragged.style.display = "none";
        }

        if (!d.isDragging || !d.ghost) return;

        d.ghost.style.left = (e.clientX - d.offsetX) + "px";
        d.ghost.style.top = (e.clientY - d.offsetY) + "px";

        d.ghost.style.display = "none";
        const el = document.elementFromPoint(e.clientX, e.clientY);
        d.ghost.style.display = "";
        const target = d.resolveDragChild ? d.resolveDragChild(el) : el?.closest(d.childSelector);

        if (target && target !== d.dragged && target !== d.placeholder && d.container.contains(target)) {
            try {
                const r = target.getBoundingClientRect();
                const mid = d.direction === "horizontal" ? r.left + r.width / 2 : r.top + r.height / 2;
                const pos = d.direction === "horizontal" ? e.clientX : e.clientY;
                const ref = pos < mid ? target : target.nextSibling;
                if (ref === null || d.container.contains(ref)) d.container.insertBefore(d.placeholder, ref);
            } catch { /* layout race */ }
        }
    });

    document.addEventListener("mouseup", () => {
        if (!_drag) return;
        const d = _drag;
        if (d.isDragging) {
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
            if (d.placeholder?.parentNode) {
                d.placeholder.parentNode.insertBefore(d.dragged, d.placeholder);
                d.placeholder.remove();
            }
            d.dragged.style.display = "";
            if (d.ghost) d.ghost.remove();
            d.saveOrder();
            if (d.onReorder) d.onReorder();
            // Optional "reordered" toast — only when the host provides showToast/toastFmt.
            const showToast = window.showToast, toastFmt = window.toastFmt;
            if (!d.toastSilent && typeof showToast === "function" && typeof toastFmt === "function") {
                if (d.toastKey) showToast(toastFmt(d.toastKey));
                else if (d.toastName) showToast(toastFmt("toast.fb_action", { name: d.toastName }));
                else showToast(toastFmt("toast.reordered"));
            }
        }
        _drag = null;
    });

    function init(container, childSelector, prefsKey, opts) {
        if (!container || container._trelloDragInit) return;
        container._trelloDragInit = true;

        const direction = opts?.direction || "vertical";
        const onReorder = opts?.onReorder || null;
        const handleSelector = opts?.handleSelector || null;
        const getKey = opts?.getKey || ((el, i) => el.dataset.dragKey || el.dataset.npSection || el.textContent.trim().slice(0, 30) || String(i));

        const resolveChild = (node) => resolveDragChild(container, childSelector, node);

        if (prefsKey) {
            const saved = prefs.getObject(prefsKey, null);
            if (saved && Array.isArray(saved)) {
                const children = listDragChildren(container, childSelector);
                const map = {};
                children.forEach((c, i) => { map[getKey(c, i)] = c; });
                const merged = [...saved];
                children.forEach((c, i) => { const k = getKey(c, i); if (!merged.includes(k)) merged.push(k); });
                const anchorSel = opts?.restoreAnchorSelector;
                const anchor = anchorSel ? container.querySelector(anchorSel) : null;
                const rm = opts?.restoreMode || "append";

                if (anchor) {
                    let ref = anchor;
                    for (const key of merged) {
                        if (map[key]) { ref.insertAdjacentElement("afterend", map[key]); ref = map[key]; }
                    }
                } else if (rm === "fragment") {
                    const frag = document.createDocumentFragment();
                    for (const key of merged) { if (map[key]) frag.appendChild(map[key]); }
                    if (frag.childNodes.length) container.insertBefore(frag, container.firstChild);
                } else {
                    for (const key of merged) { if (map[key]) container.appendChild(map[key]); }
                    children.forEach((c, i) => { if (!merged.includes(getKey(c, i))) container.appendChild(c); });
                }
            }
        }

        function saveOrder() {
            if (!prefsKey) return;
            const children = listDragChildren(container, childSelector);
            prefs.setItem(prefsKey, children.map((c, i) => getKey(c, i)));
        }

        container.addEventListener("mousedown", (e) => {
            if (e.button !== 0 || _drag) return;
            const child = resolveChild(e.target);
            if (!child || !container.contains(child)) return;
            if (handleSelector && !e.target.closest(handleSelector)) return;
            const skipSelector = direction === "horizontal"
                ? "input, select, textarea, .col-resize"
                : "input, button, select, textarea, a, .btn-small, .col-resize";
            if (e.target.closest(skipSelector)) return;
            e.preventDefault();
            const rect = child.getBoundingClientRect();
            _drag = {
                container, childSelector, direction, onReorder, saveOrder, resolveDragChild: resolveChild,
                dragged: child, ghost: null, placeholder: null, isDragging: false,
                startX: e.clientX, startY: e.clientY,
                offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top,
                toastKey: opts?.toastKey, toastName: opts?.toastName, toastSilent: !!opts?.toastSilent,
            };
        });
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.drag = { init: init, resolveDragChild: resolveDragChild, listDragChildren: listDragChildren };
    // Back-compat alias for call sites that expect the global.
    if (!window.initDragReorder) window.initDragReorder = init;
})();
