// zgui-core/util.js — the pure helpers every app reimplements (and drifts on), distilled from
// Audio-Haxor's utils.js + context-menu.js. No DOM-framework assumptions; safe to load first.
// window.ZGui.util — and, for ergonomics, a few are also published as bare globals when unset
// (escapeHtml, debounce, throttle, copyToClipboard) since other ZGui modules already shim them.
(function () {
    "use strict";

    const _escDiv = typeof document !== "undefined" ? document.createElement("div") : null;
    function escapeHtml(str) {
        if (!_escDiv) return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
        _escDiv.textContent = str == null ? "" : str;
        return _escDiv.innerHTML;
    }

    // Throttle: invoke at most once per `ms` (trailing call guaranteed).
    function throttle(fn, ms) {
        let last = 0, timer = null;
        return function (...args) {
            const now = performance.now();
            const remaining = ms - (now - last);
            if (remaining <= 0) {
                if (timer) { clearTimeout(timer); timer = null; }
                last = now;
                fn.apply(this, args);
            } else if (!timer) {
                timer = setTimeout(() => { last = performance.now(); timer = null; fn.apply(this, args); }, remaining);
            }
        };
    }
    // Debounce: invoke after `ms` of inactivity.
    function debounce(fn, ms) {
        let timer = null;
        return function (...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), ms); };
    }
    // Yield to the event loop so pending input/paint runs before a heavy synchronous chunk.
    function yieldToBrowser() { return new Promise((resolve) => setTimeout(resolve, 0)); }
    function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

    // Human byte size: 0 B / 1.5 MB / …
    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return "0 B";
        const units = ["B", "KB", "MB", "GB", "TB", "PB"];
        const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
        return (bytes / Math.pow(1024, i)).toFixed(1) + " " + units[i];
    }
    // Seconds -> m:ss (and h:mm:ss past an hour).
    function formatDuration(sec) {
        if (!sec || !isFinite(sec)) return "0:00";
        sec = Math.floor(sec);
        const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
        if (h > 0) return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
        return m + ":" + String(s).padStart(2, "0");
    }

    function escapePath(str) { return String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'"); }
    function slugify(str) {
        return String(str)
            .replace(/([a-z])([A-Z])/g, "$1-$2")
            .replace(/([a-zA-Z])(\d)/g, "$1-$2")
            .replace(/(\d)([a-zA-Z])/g, "$1-$2")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    // Copy to the OS clipboard (navigator.clipboard, textarea fallback). Optional success toast.
    function copyToClipboard(text, toastMsg) {
        const done = function () { if (toastMsg && typeof window.showToast === "function") window.showToast(toastMsg); };
        const fail = function (e) { if (typeof window.showToast === "function") window.showToast(String(e), 4000, "error"); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text).then(done).catch(function () { fallback(text) ? done() : fail("copy failed"); });
        }
        if (fallback(text)) done(); else fail("copy failed");
        return Promise.resolve();
    }
    function fallback(text) {
        try {
            const ta = document.createElement("textarea");
            ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
            document.body.appendChild(ta); ta.select();
            const ok = document.execCommand("copy");
            ta.remove();
            return ok;
        } catch { return false; }
    }

    // Toggle a button's loading spinner (.btn-loading) + disabled state.
    function btnLoading(btn, loading) {
        if (!btn) return;
        btn.classList.toggle("btn-loading", !!loading);
        btn.disabled = !!loading;
    }
    // Shimmer skeleton placeholder rows into a container.
    function skeletonRows(container, count) {
        if (!container) return;
        count = count || 5;
        container.innerHTML = Array.from({ length: count }, () =>
            `<div class="skeleton-row fade-in">
              <div class="skeleton skeleton-bar" style="flex:2;"></div>
              <div class="skeleton skeleton-bar" style="flex:1;"></div>
              <div class="skeleton skeleton-bar" style="width:80px;"></div>
              <div class="skeleton skeleton-bar" style="width:80px;"></div>
            </div>`).join("");
    }

    // ETA estimator for progress loops.
    function createETA() {
        let startTime = 0;
        return {
            start() { startTime = performance.now(); },
            estimate(processed, total) {
                if (!startTime || processed <= 0 || total <= 0) return "";
                const elapsed = (performance.now() - startTime) / 1000;
                const remaining = (total - processed) / (processed / elapsed);
                if (remaining < 1) return "< 1s";
                if (remaining < 60) return `~${Math.ceil(remaining)}s`;
                return `~${Math.floor(remaining / 60)}m ${Math.ceil(remaining % 60)}s`;
            },
            elapsed() {
                if (!startTime) return "";
                const secs = Math.floor((performance.now() - startTime) / 1000);
                return secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${secs % 60}s`;
            },
        };
    }

    const util = {
        escapeHtml, throttle, debounce, yieldToBrowser, clamp,
        formatBytes, formatDuration, escapePath, slugify,
        copyToClipboard, btnLoading, skeletonRows, createETA,
    };
    window.ZGui = window.ZGui || {};
    window.ZGui.util = util;
    // Publish the most-shimmed helpers as bare globals when the host hasn't already.
    if (typeof window.escapeHtml !== "function") window.escapeHtml = escapeHtml;
    if (typeof window.debounce !== "function") window.debounce = debounce;
    if (typeof window.throttle !== "function") window.throttle = throttle;
    if (typeof window.copyToClipboard !== "function") window.copyToClipboard = copyToClipboard;
})();
