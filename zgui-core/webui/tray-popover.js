// zgui-core/tray-popover.js — the reusable kernel of a menu-bar tray popover: keep the popover
// WebView window sized to its content. Distilled from Audio-Haxor's tray-popover.js (whose body
// is otherwise app-specific player UI). The popover content is the consumer's; this only syncs
// the window size to it via a Tauri command. window.ZGui.trayPopover.
//
//   ZGui.trayPopover.autoResize({
//       shell: '#shell',                  // the element whose intrinsic size the window should match
//       command: 'tray_popover_resize',   // Tauri command invoked with { width, height } (logical px)
//       padW: 8, padH: 18,                // padding so WebKit doesn't clip descenders / last row
//       observe: true,                    // ResizeObserver the shell + resync on load
//   }) -> { sync(), schedule() }
//
// Why measure the shell ONLY (not max of body/html): body usually has min-height:100%, so maxing
// against it is a positive feedback loop — the window can grow but never shrink.
(function () {
    "use strict";

    function invoke() {
        const t = window.__TAURI__;
        return t && t.core && typeof t.core.invoke === "function" ? t.core.invoke
            : (t && typeof t.invoke === "function" ? t.invoke : null);
    }

    function autoResize(opts) {
        opts = opts || {};
        const sel = opts.shell || "#shell";
        const command = opts.command || "tray_popover_resize";
        const padW = opts.padW == null ? 8 : opts.padW;
        const padH = opts.padH == null ? 18 : opts.padH;

        function sync() {
            const inv = invoke();
            if (!inv) return;
            const root = typeof sel === "string" ? document.querySelector(sel) : sel;
            if (!root) return;
            const br = root.getBoundingClientRect();
            const w = Math.ceil(Math.max(root.scrollWidth, root.offsetWidth, br.width)) + padW;
            const h = Math.ceil(Math.max(root.scrollHeight, root.offsetHeight, br.height)) + padH;
            try { Promise.resolve(inv(command, { width: w, height: h })).catch(function () {}); } catch { /* no tauri */ }
        }

        function schedule() {
            requestAnimationFrame(function () { requestAnimationFrame(sync); });
        }

        if (opts.observe !== false) {
            const root = typeof sel === "string" ? document.querySelector(sel) : sel;
            if (root && typeof ResizeObserver === "function") {
                new ResizeObserver(schedule).observe(root);
            }
            if (typeof window !== "undefined") window.addEventListener("load", schedule);
        }
        schedule();
        return { sync: sync, schedule: schedule };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.trayPopover = { autoResize: autoResize };
})();
