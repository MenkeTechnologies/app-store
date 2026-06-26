// zgui-core/ui-idle.js — "heavy UI idle" detection, ported from Audio-Haxor's ui-idle.js.
// Hybrid: Page Visibility (`document.hidden`), `document.hasFocus()`, window blur/focus, plus the
// Tauri `WebviewWindow` focus/minimize/visible state when available. Lets rAF-heavy UI (charts,
// spectrum, playheads) and idle-gated polling pause when the window is off-screen. window.ZGui.uiIdle.
//
//   ZGui.uiIdle.isIdle()                       -> boolean (also window.isUiIdleHeavyCpu, back-compat)
//   document listens for the `ui-idle-heavy-cpu` CustomEvent ({ detail:{ idle } })
//   <html> gets/loses the `ui-idle-heavy-cpu` class so CSS can pause infinite animations.
//
// Note: idle == actually invisible (hidden tab / minimized / isVisible:false). Merely losing
// keyboard focus is NOT idle — a visible-but-unfocused window keeps animating. On macOS WKWebView
// `document.hidden` is not trusted once Tauri window state is known (occlusion flips it falsely).
(function initUiIdleHeavyCpu() {
    "use strict";

    let docHidden = typeof document !== "undefined" && document.hidden;
    let winFocused = true;
    let winMinimized = false;
    let winVisible = true;
    let hasTauriWindowState = false;

    function recompute() {
        if (hasTauriWindowState) return winMinimized || !winVisible;
        return docHidden || winMinimized || !winVisible;
    }

    let idle = recompute();
    if (typeof document !== "undefined" && document.documentElement) {
        document.documentElement.classList.toggle("ui-idle-heavy-cpu", idle);
    }

    function setState() {
        const next = recompute();
        if (next === idle) return;
        idle = next;
        try {
            if (typeof document !== "undefined" && document.documentElement) {
                document.documentElement.classList.toggle("ui-idle-heavy-cpu", idle);
            }
            // Going idle: dispatch synchronously so loops stop the moment the window hides.
            // Coming back: defer one frame so queued user input is processed before the
            // burst of listeners re-arm their polling / rAF work.
            const evt = new CustomEvent("ui-idle-heavy-cpu", { detail: { idle } });
            if (idle) {
                document.dispatchEvent(evt);
            } else if (typeof requestAnimationFrame === "function") {
                requestAnimationFrame(function () { try { document.dispatchEvent(evt); } catch { /* ignore */ } });
            } else {
                setTimeout(function () { try { document.dispatchEvent(evt); } catch { /* ignore */ } }, 0);
            }
        } catch { /* ignore */ }
    }

    function isIdle() { return idle; }
    window.isUiIdleHeavyCpu = isIdle; // back-compat (toast.js / consumers gate on this)

    if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", function () { docHidden = document.hidden; setState(); });
    }
    if (typeof window !== "undefined") {
        window.addEventListener("blur", function () { setState(); });
        window.addEventListener("focus", function () { setState(); });
    }

    function syncFromTauriWindow(win) {
        if (!win) return Promise.resolve();
        const ps = [];
        if (typeof win.isFocused === "function") ps.push(win.isFocused().then(function (v) { winFocused = !!v; }));
        if (typeof win.isMinimized === "function") ps.push(win.isMinimized().then(function (v) { winMinimized = !!v; }));
        if (typeof win.isVisible === "function") ps.push(win.isVisible().then(function (v) { winVisible = !!v; }));
        if (ps.length === 0) return Promise.resolve();
        return Promise.all(ps).then(function () { hasTauriWindowState = true; });
    }

    (async function setupTauri() {
        try {
            const TW = window.__TAURI__ && window.__TAURI__.webviewWindow;
            if (!TW || typeof TW.getCurrentWebviewWindow !== "function") return;
            const win = TW.getCurrentWebviewWindow();
            try { await syncFromTauriWindow(win); setState(); } catch { setState(); }
            if (typeof win.onFocusChanged === "function") {
                await win.onFocusChanged(function (evt) {
                    const p = evt && (evt.payload !== undefined ? evt.payload : evt);
                    winFocused = p === true;
                    setState();
                });
            }
            if (typeof win.onResized === "function") {
                await win.onResized(function () { void syncFromTauriWindow(win).then(setState).catch(setState); });
            }
            if (typeof win.onMoved === "function") {
                await win.onMoved(function () { void syncFromTauriWindow(win).then(setState).catch(setState); });
            }
            // Spaces / occlusion: events are unreliable — re-sync native window state periodically.
            setInterval(function () { void syncFromTauriWindow(win).then(setState).catch(setState); }, 1200);
        } catch { /* non-Tauri or older API */ }
    })();

    window.ZGui = window.ZGui || {};
    window.ZGui.uiIdle = { isIdle: isIdle };
})();
