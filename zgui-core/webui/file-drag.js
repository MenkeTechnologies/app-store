// zgui-core/file-drag.js — native OS file drag, distilled from Audio-Haxor's file-drop.js
// (drop INTO the window) + native-file-drag.js (drag OUT to Finder/DAW, with a themed canvas
// drag icon). The GENERIC engines only — path routing / import logic stays in the app via
// callbacks. Needs Tauri v2 (`window.__TAURI__`). window.ZGui.fileDrag.
//
//   ZGui.fileDrag.initDrop({ onDrop(paths), overlayText, overlayId })
//       OS files/folders dropped onto the window; shows a full-window overlay, calls onDrop.
//   ZGui.fileDrag.initDragOut({ resolvePaths(target)->string[]|null, label })
//       drag rows/cards out to the OS; pointer-threshold engine + click suppression.
//   ZGui.fileDrag.startDrag(paths)        // programmatic drag-out
//   ZGui.fileDrag.icon() / .invalidateIcon()   // the cyberpunk canvas icon (re-themes on scheme change)
(function () {
    "use strict";

    const TAURI = typeof window !== "undefined" ? window.__TAURI__ : null;
    function toast(msg, dur, type) { if (typeof window.showToast === "function") window.showToast(msg, dur, type); }

    // ════════════════════ drag-out canvas icon (themed from CSS vars) ════════════════════
    const FALLBACK_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const THRESHOLD_SQ = 8 * 8;
    let _iconUrl = null;
    let _iconLabel = "COPY";

    function hexToRgba(hex, a) {
        const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
        if (!m) return `rgba(5, 217, 232, ${a})`;
        const n = parseInt(m[1], 16);
        return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    }
    function strokeRoundRect(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") { ctx.roundRect(x, y, w, h, rr); return; }
        ctx.moveTo(x + rr, y); ctx.lineTo(x + w - rr, y); ctx.arcTo(x + w, y, x + w, y + rr, rr);
        ctx.lineTo(x + w, y + h - rr); ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
        ctx.lineTo(x + rr, y + h); ctx.arcTo(x, y + h, x, y + h - rr, rr);
        ctx.lineTo(x, y + rr); ctx.arcTo(x, y, x + rr, y, rr); ctx.closePath();
    }
    function drawCornerTicks(ctx, x, y, w, h, c1, c2) {
        const L = 12; ctx.lineWidth = 1.5;
        ctx.strokeStyle = c1;
        ctx.beginPath(); ctx.moveTo(x, y + L); ctx.lineTo(x, y); ctx.lineTo(x + L, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - L, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + L); ctx.stroke();
        ctx.strokeStyle = c2;
        ctx.beginPath(); ctx.moveTo(x, y + h - L); ctx.lineTo(x, y + h); ctx.lineTo(x + L, y + h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - L, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - L); ctx.stroke();
    }

    function buildIcon() {
        const W = 128, H = 128;
        let canvas;
        try { canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H; } catch { return FALLBACK_ICON; }
        const ctx = canvas.getContext("2d");
        if (!ctx) return FALLBACK_ICON;
        const cs = typeof getComputedStyle === "function" ? getComputedStyle(document.documentElement) : null;
        const cyan = (cs && cs.getPropertyValue("--cyan").trim()) || "#05d9e8";
        const magenta = (cs && cs.getPropertyValue("--magenta").trim()) || "#d300c5";
        let accent = (cs && cs.getPropertyValue("--accent").trim()) || cyan;
        if (!/^#([0-9a-f]{6})$/i.test(accent)) accent = cyan;

        ctx.fillStyle = "#06060c"; ctx.fillRect(0, 0, W, H);
        const glow = ctx.createRadialGradient(W * 0.35, H * 0.25, 0, W * 0.5, H * 0.45, W * 0.65);
        glow.addColorStop(0, hexToRgba(cyan, 0.22)); glow.addColorStop(0.45, hexToRgba(magenta, 0.08)); glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(5, 217, 232, 0.06)"; ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 12) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 12) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        ctx.globalAlpha = 0.12; ctx.fillStyle = "#000";
        for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);
        ctx.globalAlpha = 1;

        const pad = 7, rw = W - pad * 2, rh = H - pad * 2;
        ctx.shadowColor = cyan; ctx.shadowBlur = 14; ctx.strokeStyle = cyan; ctx.lineWidth = 2.5;
        strokeRoundRect(ctx, pad, pad, rw, rh, 10); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.strokeStyle = magenta; ctx.lineWidth = 1; ctx.globalAlpha = 0.85;
        strokeRoundRect(ctx, pad + 4, pad + 4, rw - 8, rh - 8, 7); ctx.stroke(); ctx.globalAlpha = 1;
        drawCornerTicks(ctx, pad + 2, pad + 2, rw - 4, rh - 4, cyan, magenta);

        ctx.font = "bold 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = magenta; ctx.fillText(_iconLabel, W / 2 + 1, 22 + 1);
        ctx.fillStyle = cyan; ctx.shadowColor = cyan; ctx.shadowBlur = 6; ctx.fillText(_iconLabel, W / 2, 22); ctx.shadowBlur = 0;

        const bars = 14, bw = 5, gap = 2, totalBw = bars * (bw + gap) - gap, startX = (W - totalBw) / 2, baseY = H - 22;
        const heights = [0.28, 0.42, 0.35, 0.55, 0.72, 0.88, 0.95, 0.92, 0.78, 0.5, 0.38, 0.45, 0.6, 0.32];
        for (let i = 0; i < bars; i++) {
            const bh = heights[i] * 44, x = startX + i * (bw + gap), y = baseY - bh;
            const g = ctx.createLinearGradient(x, y, x, baseY);
            g.addColorStop(0, cyan); g.addColorStop(0.55, accent); g.addColorStop(1, magenta);
            ctx.fillStyle = g; ctx.fillRect(x, y, bw, bh);
            ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fillRect(x, y, Math.min(2, bw), bh);
        }
        ctx.strokeStyle = hexToRgba(cyan, 0.35); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(startX, baseY + 1.5); ctx.lineTo(startX + totalBw, baseY + 1.5); ctx.stroke();

        try { return canvas.toDataURL("image/png") || FALLBACK_ICON; } catch { return FALLBACK_ICON; }
    }
    function icon() { if (!_iconUrl) _iconUrl = buildIcon(); return _iconUrl; }
    function invalidateIcon() { _iconUrl = null; }

    async function startDrag(filePaths) {
        if (!TAURI || !TAURI.drag || typeof TAURI.drag.startDrag !== "function") return;
        const paths = (filePaths || []).filter(Boolean);
        if (!paths.length) return;
        try {
            await TAURI.drag.startDrag({ item: paths, icon: icon(), mode: "copy" });
            toast(`Dragging ${paths.length} file${paths.length === 1 ? "" : "s"}`);
        } catch (err) { toast(String(err && err.message ? err.message : err), 4000, "error"); }
    }

    function initDragOut(opts) {
        opts = opts || {};
        if (typeof opts.label === "string") _iconLabel = opts.label;
        const resolve = opts.resolvePaths;
        if (typeof resolve !== "function" || typeof document === "undefined" || initDragOut._done) return;
        initDragOut._done = true;
        let ptr = null;

        document.addEventListener("click", function (e) {
            if (!window.__zgSuppressNextClick) return;
            window.__zgSuppressNextClick = false;
            e.preventDefault(); e.stopImmediatePropagation();
        }, true);
        document.addEventListener("pointerdown", function (e) {
            if (e.button !== 0) return;
            const paths = resolve(e.target);
            if (!paths || !paths.length) return;
            ptr = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, didDrag: false, paths };
        }, true);
        document.addEventListener("pointermove", function (e) {
            if (!ptr || e.pointerId !== ptr.pointerId) return;
            const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
            if (dx * dx + dy * dy < THRESHOLD_SQ || ptr.didDrag) return;
            ptr.didDrag = true;
            e.preventDefault();
            void startDrag(ptr.paths);
        }, true);
        document.addEventListener("pointerup", function (e) {
            if (!ptr || e.pointerId !== ptr.pointerId) return;
            const didDrag = ptr.didDrag;
            ptr = null;
            if (didDrag) {
                window.__zgSuppressNextClick = true;
                setTimeout(function () { window.__zgSuppressNextClick = false; }, 500);
            }
        }, true);
        document.addEventListener("pointercancel", function (e) { if (ptr && e.pointerId === ptr.pointerId) ptr = null; }, true);

        // Warm the icon cache off the click path.
        const warm = function () { try { icon(); } catch { invalidateIcon(); } };
        if (typeof requestIdleCallback === "function") requestIdleCallback(warm, { timeout: 4000 });
        else setTimeout(warm, 2000);
    }

    // ════════════════════ drop INTO the window ════════════════════
    function ensureOverlay(id) {
        let o = document.getElementById(id);
        if (!o) {
            o = document.createElement("div");
            o.id = id;
            o.className = "zg-drop-overlay";
            o.innerHTML = '<div class="zg-drop-overlay-text">Drop to import</div>';
            document.body.appendChild(o);
        }
        return o;
    }

    function initDrop(opts) {
        opts = opts || {};
        if (!TAURI || !TAURI.webview || typeof TAURI.webview.getCurrentWebview !== "function") return;
        const overlayId = opts.overlayId || "zg-drop-overlay";
        const overlayText = opts.overlayText || "Drop to import";
        const onDrop = typeof opts.onDrop === "function" ? opts.onDrop : function () {};

        function show(text) {
            const o = ensureOverlay(overlayId);
            const label = o.querySelector(".zg-drop-overlay-text, .drop-overlay-text");
            if (label && text) label.textContent = text;
            o.classList.add("active");
        }
        function hide() { const o = document.getElementById(overlayId); if (o) o.classList.remove("active"); }

        TAURI.webview.getCurrentWebview().onDragDropEvent(function (event) {
            const type = event.payload && event.payload.type;
            if (type === "enter" || type === "over") { show(overlayText); }
            else if (type === "leave") { hide(); }
            else if (type === "drop") {
                const paths = (event.payload && event.payload.paths) || [];
                hide();
                if (paths.length) { Promise.resolve(onDrop(paths)).catch(function (e) { toast(String(e && e.message ? e.message : e), 4000, "error"); }); }
            }
        });
        return { show, hide };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.fileDrag = { initDrop: initDrop, initDragOut: initDragOut, startDrag: startDrag, icon: icon, invalidateIcon: invalidateIcon };
})();
