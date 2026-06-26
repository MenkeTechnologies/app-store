// zgui-core/toast.js — the generic toast/notification system, distilled from Audio-Haxor's
// ipc.js (showToast / recordToastHistory) + toast-history.js (viewer) + utils.js (global progress).
// Slide-in neon toasts with type variants, a capped in-memory history, a searchable history modal,
// and a top-of-window indeterminate progress bar. window.ZGui.toast.
//
//   ZGui.toast.show(message, duration?=2500, type?='', extraClass?='')
//        type: '' | 'error' | 'warning' | 'mono-paths'
//   ZGui.toast.history()           -> [{ t, message, type, duration }]
//   ZGui.toast.clearHistory()
//   ZGui.toast.showHistory() / closeHistory()   // searchable modal
//   ZGui.toast.progress.show() / hide()         // top-of-window progress bar
//
// The container and progress bar are auto-injected; no markup required in the host page.
// Consumers pass already-formatted (localized) strings — i18n stays in the app.
(function () {
    "use strict";

    const HISTORY_MAX = 500;
    window.__toastHistory = window.__toastHistory || [];

    const esc = window.escapeHtml || function (s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    };

    function container() {
        let c = document.getElementById("zs-toast-container");
        if (!c) {
            c = document.createElement("div");
            c.id = "zs-toast-container";
            c.className = "zs-toast-container";
            document.body.appendChild(c);
        }
        return c;
    }

    function recordHistory(message, type, duration) {
        const hist = window.__toastHistory;
        hist.push({
            t: Date.now(),
            message: String(message == null ? "" : message),
            type: type || "info",
            duration: Number(duration) || 0,
        });
        if (hist.length > HISTORY_MAX) hist.splice(0, hist.length - HISTORY_MAX);
        document.dispatchEvent(new CustomEvent("toast-history-update"));
    }

    function show(message, duration, type, extraClass) {
        duration = duration == null ? 2500 : duration;
        type = type || "";
        extraClass = extraClass || "";
        recordHistory(message, type, duration);
        if (type === "error" && window.vstUpdater && window.vstUpdater.appendLog) {
            window.vstUpdater.appendLog("TOAST_ERROR: " + message);
        }
        // When the window is backgrounded / heavy-CPU-idle, drop the slide-in (host opt-in hook).
        if (typeof window.isUiIdleHeavyCpu === "function" && window.isUiIdleHeavyCpu()) return;
        const c = container();
        const el = document.createElement("div");
        el.className = "zs-toast" + (type ? " zs-toast-" + type : "") + (extraClass ? " " + extraClass : "");
        el.textContent = message;
        const fadeStart = (duration - 300) / 1000;
        el.style.animation = `zs-toast-in 0.3s ease-out, zs-toast-out 0.3s ease-in ${fadeStart}s forwards`;
        c.appendChild(el);
        setTimeout(() => el.remove(), duration);
        return el;
    }

    // Clear any visible toasts when the window goes idle (host dispatches this event).
    document.addEventListener("ui-idle-heavy-cpu", (e) => {
        if (!e.detail || !e.detail.idle) return;
        const c = document.getElementById("zs-toast-container");
        if (c) c.innerHTML = "";
    });

    // ── top-of-window indeterminate progress bar ──
    function progressBar() {
        let p = document.getElementById("zs-global-progress");
        if (!p) {
            p = document.createElement("div");
            p.id = "zs-global-progress";
            p.className = "zs-global-progress";
            p.innerHTML = '<div class="zs-global-progress-fill"></div>';
            document.body.appendChild(p);
        }
        return p;
    }
    const progress = {
        show() { progressBar().classList.add("active"); },
        hide() { const p = document.getElementById("zs-global-progress"); if (p) p.classList.remove("active"); },
    };

    // ── searchable history viewer (self-contained modal, zs-toast-hist-* chrome) ──
    function fmtTime(ms) {
        const d = new Date(ms);
        const p = (n) => String(n).padStart(2, "0");
        return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    }
    function renderRows(rows) {
        if (!rows.length) return `<p class="zs-toast-hist-empty">No notifications yet.</p>`;
        return rows.map((e) => {
            const type = e.type || "info";
            return `<div class="zs-toast-hist-row">
              <span class="zs-toast-hist-time" title="${esc(new Date(e.t).toLocaleString())}">${esc(fmtTime(e.t))}</span>
              <span class="zs-toast-hist-badge zs-th-${esc(type)}">${esc(type)}</span>
              <span class="zs-toast-hist-msg">${esc(e.message)}</span>
            </div>`;
        }).join("");
    }
    function applyFilter() {
        const input = document.getElementById("zs-toast-hist-search");
        const list = document.getElementById("zs-toast-hist-list");
        const cnt = document.getElementById("zs-toast-hist-count");
        const tot = document.getElementById("zs-toast-hist-total");
        if (!list) return;
        const all = window.__toastHistory.slice().reverse();
        const q = input ? input.value.trim().toLowerCase() : "";
        const filtered = q
            ? all.filter((e) => e.message.toLowerCase().includes(q) || (e.type || "").toLowerCase().includes(q))
            : all;
        list.innerHTML = renderRows(filtered);
        if (cnt) cnt.textContent = String(filtered.length);
        if (tot) tot.textContent = String(all.length);
    }
    function showHistory() {
        closeHistory();
        const html = `<div class="zs-toast-hist-overlay" id="zs-toast-hist-modal">
          <div class="zs-toast-hist-box">
            <div class="zs-toast-hist-head">
              <h2>Notifications</h2>
              <button class="zs-toast-hist-close" title="Close">&times;</button>
            </div>
            <div class="zs-toast-hist-body">
              <div class="zs-toast-hist-toolbar">
                <input type="text" class="zs-input zs-toast-hist-search" id="zs-toast-hist-search"
                       placeholder="Search notifications…" autocomplete="off" spellcheck="false">
                <span class="zs-badge" id="zs-toast-hist-count">0</span>
              </div>
              <div class="zs-toast-hist-list" id="zs-toast-hist-list"></div>
              <div class="zs-toast-hist-foot">
                <span><span id="zs-toast-hist-total">0</span> entries</span>
                <button class="zs-btn zs-btn-mini zs-toast-hist-clear">Clear all</button>
              </div>
            </div>
          </div>
        </div>`;
        document.body.insertAdjacentHTML("beforeend", html);
        const modal = document.getElementById("zs-toast-hist-modal");
        applyFilter();
        const input = document.getElementById("zs-toast-hist-search");
        if (input) {
            input.addEventListener("input", applyFilter);
            requestAnimationFrame(() => { try { input.focus(); } catch { /* detached */ } });
        }
        modal.addEventListener("click", (e) => { if (e.target === modal) closeHistory(); });
        modal.querySelector(".zs-toast-hist-close").addEventListener("click", closeHistory);
        modal.querySelector(".zs-toast-hist-clear").addEventListener("click", clearHistory);
    }
    function closeHistory() {
        document.querySelectorAll("#zs-toast-hist-modal").forEach((el) => el.remove());
    }
    function clearHistory() {
        window.__toastHistory.length = 0;
        applyFilter();
    }
    document.addEventListener("toast-history-update", () => {
        if (document.getElementById("zs-toast-hist-modal")) applyFilter();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && document.getElementById("zs-toast-hist-modal")) { closeHistory(); e.stopPropagation(); }
    });

    window.ZGui = window.ZGui || {};
    window.ZGui.toast = {
        show: show,
        recordHistory: recordHistory,
        history() { return window.__toastHistory.slice(); },
        clearHistory: clearHistory,
        showHistory: showHistory,
        closeHistory: closeHistory,
        progress: progress,
    };
    // Back-compat globals so the optional toast hooks in drag.js / consumers resolve.
    if (typeof window.showToast !== "function") window.showToast = show;
    if (typeof window.showGlobalProgress !== "function") window.showGlobalProgress = progress.show;
    if (typeof window.hideGlobalProgress !== "function") window.hideGlobalProgress = progress.hide;
})();
