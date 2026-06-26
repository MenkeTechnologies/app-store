// zgui-core/fx.js — global cyberpunk effect toggles (CRT scanlines, bezel vignette, neon glow,
// animations). Ported from Audio-Haxor's settingToggleCrt / applyCrtSetting / settingToggleNeonGlow.
// Each effect maps to a `body.no-<x>` class the theme CSS (cyberpunk.css) reacts to — effect ON means
// the class is ABSENT. State persists in localStorage. window.ZGui.fx.
//   ZGui.fx.set(name, on) / .toggle(name) -> bool / .get(name) -> bool / .all() -> {…} / .load()
//   ZGui.fx.buildToggles({ effects? }) -> el   (a labeled on/off toggle row for a settings panel)
//   names: 'scanlines' | 'vignette' | 'glow' | 'anim'   (ON = effect enabled)
(function () {
    "use strict";
    // effect name -> { cls: body class that DISABLES it, label }
    const FX = {
        scanlines: { cls: "no-scanlines", label: "CRT scanlines" },
        vignette: { cls: "no-vignette", label: "Bezel vignette" },
        glow: { cls: "no-neon-glow", label: "Neon glow" },
        anim: { cls: "no-anim", label: "Animations" },
    };
    const KEY = (name) => "zg-fx-" + name;
    function store(name, on) { try { localStorage.setItem(KEY(name), on ? "on" : "off"); } catch { /* quota */ } }
    function stored(name) { try { return localStorage.getItem(KEY(name)); } catch { return null; } }

    // the static scanline texture + vignette are CSS-only (body::after/::before), but the animated
    // scan beams need real elements — inject them once into <body> (CSS hides them under .no-scanlines).
    function ensureScanBeams() {
        if (!document.body) return;
        ["zg-scan-h", "zg-scan-v"].forEach((cls) => {
            if (!document.body.querySelector("." + cls)) {
                const d = document.createElement("div");
                d.className = cls;
                document.body.appendChild(d);
            }
        });
    }

    function get(name) { const fx = FX[name]; return fx ? !document.body.classList.contains(fx.cls) : false; }
    function set(name, on) {
        const fx = FX[name];
        if (!fx) return false;
        document.body.classList.toggle(fx.cls, !on);   // ON = class absent
        if (name === "scanlines" && on) ensureScanBeams();
        store(name, on);
        return on;
    }
    function toggle(name) { return set(name, !get(name)); }
    function all() { const o = {}; Object.keys(FX).forEach((n) => { o[n] = get(n); }); return o; }
    // re-apply persisted prefs (default: every effect ON, i.e. no class) + create the scan beams.
    function load() {
        Object.keys(FX).forEach((n) => { const v = stored(n); if (v != null) set(n, v !== "off"); });
        if (get("scanlines")) ensureScanBeams();
    }

    // a labeled on/off toggle row, one toggle per effect — reuses the settings toggle look.
    function buildToggles(opts) {
        opts = opts || {};
        const names = opts.effects || Object.keys(FX);
        const wrap = document.createElement("div");
        wrap.className = "zg-fx-toggles";
        names.forEach((name) => {
            const fx = FX[name];
            if (!fx) return;
            const row = document.createElement("div");
            row.className = "zg-fx-row";
            const lbl = document.createElement("span");
            lbl.className = "zg-fx-label";
            lbl.textContent = fx.label;
            const btn = document.createElement("button");
            btn.type = "button";
            function paint() { const on = get(name); btn.className = "zg-fx-btn" + (on ? " on" : ""); btn.textContent = on ? "ON" : "OFF"; btn.setAttribute("aria-pressed", String(on)); }
            paint();
            btn.addEventListener("click", () => { toggle(name); paint(); if (typeof opts.onChange === "function") opts.onChange(name, get(name)); });
            row.appendChild(lbl);
            row.appendChild(btn);
            wrap.appendChild(row);
        });
        return wrap;
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.fx = { set: set, toggle: toggle, get: get, all: all, load: load, buildToggles: buildToggles, effects: FX };
})();
