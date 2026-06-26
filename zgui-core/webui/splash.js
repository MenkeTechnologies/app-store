// zgui-core/splash.js — the boot splash screen, distilled from Audio-Haxor's splash markup +
// fade-out dismiss (app.js). Self-injecting; or it adopts an existing #splashScreen if the host
// already put one in the page. window.ZGui.splash.
//
//   ZGui.splash.show({ title, subtitle, version })   // create + display (idempotent)
//   ZGui.splash.setVersion('v1.2.3')
//   ZGui.splash.hide()                                // fade out, remove after the 600ms transition
(function () {
    "use strict";

    const esc = window.escapeHtml || function (s) {
        const d = document.createElement("div");
        d.textContent = s == null ? "" : String(s);
        return d.innerHTML;
    };

    function el() { return document.getElementById("splashScreen"); }

    function show(opts) {
        opts = opts || {};
        let s = el();
        if (!s) {
            s = document.createElement("div");
            s.className = "splash-screen";
            s.id = "splashScreen";
            s.innerHTML = `
                <div class="splash-title">${esc(opts.title || "")}</div>
                ${opts.subtitle ? `<div class="splash-sub">${esc(opts.subtitle)}</div>` : ""}
                <div class="splash-bar-wrap"><div class="splash-bar"></div></div>
                <div class="splash-version" id="splashVersion">${esc(opts.version || "Loading…")}</div>`;
            document.body.appendChild(s);
        } else {
            s.classList.remove("fade-out");
        }
        return s;
    }

    function setVersion(v) {
        const ver = document.getElementById("splashVersion");
        if (ver) ver.textContent = v == null ? "" : v;
    }

    function hide() {
        const s = el();
        if (!s) return;
        s.classList.add("fade-out");
        setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 600);
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.splash = { show: show, setVersion: setVersion, hide: hide };
})();
