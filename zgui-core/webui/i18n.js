// zgui-core/i18n.js — the bridge to the global i18n library (zpwr-i18n). zgui components resolve
// their user-facing text through ZGui.i18n.t(), which delegates to zpwr-i18n's window.appFmt when
// present and falls back to the key/string (with {var} interpolation) when it isn't — so components
// work standalone AND translate inside a host that loaded zpwr-i18n. Also applies zpwr-i18n's
// declarative data-i18n* attributes within a subtree (for component-built DOM). window.ZGui.i18n.
//
//   ZGui.i18n.t('menu.close', { n: 3 })   // -> appFmt('menu.close',{n:3}) | 'menu.close' fallback
//   ZGui.i18n.translate(rootEl)           // resolve [data-i18n], -html, -placeholder, -title, -aria-label
//   ZGui.i18n.has()                       // is a backend (zpwr-i18n) present?
(function () {
    "use strict";
    function backend() {
        if (typeof window.appFmt === "function") return window.appFmt;
        if (typeof window.catalogFmt === "function") return window.catalogFmt;
        return null;
    }
    function t(key, vars) {
        const fn = backend();
        if (fn) { try { return fn(key, vars); } catch { /* fall through */ } }
        let s = key == null ? "" : String(key);
        if (vars) for (const k in vars) s = s.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
        return s;
    }
    function has() { return !!backend(); }
    function translate(root) {
        root = root || document;
        if (!root.querySelectorAll) return root;
        root.querySelectorAll("[data-i18n]").forEach((e) => { e.textContent = t(e.getAttribute("data-i18n")); });
        root.querySelectorAll("[data-i18n-html]").forEach((e) => { e.innerHTML = t(e.getAttribute("data-i18n-html")); });
        root.querySelectorAll("[data-i18n-placeholder]").forEach((e) => { e.placeholder = t(e.getAttribute("data-i18n-placeholder")); });
        root.querySelectorAll("[data-i18n-title]").forEach((e) => { e.title = t(e.getAttribute("data-i18n-title")); });
        root.querySelectorAll("[data-i18n-aria-label]").forEach((e) => { e.setAttribute("aria-label", t(e.getAttribute("data-i18n-aria-label"))); });
        return root;
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.i18n = { t: t, has: has, translate: translate };
})();
