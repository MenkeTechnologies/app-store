// zgui-core/peak-meter.js — a vertical dB peak meter (green→yellow→red), optionally stereo, with an
// optional LUFS readout below. Ported from zpwr-patch-core's mixer mxMeter/setMeter + the master LUFS
// readout. The lit bar grows from the bottom; feed it dBFS. window.ZGui.peakMeter.   Pairs with
// peak-meter.css.
//   ZGui.peakMeter({ db, min=-60, max=6, stereo, lufs }) -> { el, set(db|[l,r]), setLufs(v) }
(function () {
    "use strict";
    function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }

    function peakMeter(opts) {
        opts = opts || {};
        const min = opts.min != null ? opts.min : -60, max = opts.max != null ? opts.max : 6;
        const span = max - min;
        const wrap = el("div", "zg-peak");
        const bars = el("div", "zg-peak-bars", wrap);
        const chans = (opts.stereo ? 2 : 1);
        const shades = [];
        for (let c = 0; c < chans; c++) {
            const bar = el("div", "zg-peak-bar", bars);
            const sh = el("div", "zg-peak-shade", bar);   // the UNLIT portion, masking from the top
            shades.push(sh);
        }
        let lufsEl = null;
        if (opts.lufs !== false && opts.showLufs !== false && (opts.lufs != null || opts.showLufs)) {
            lufsEl = el("div", "zg-peak-lufs", wrap);
            lufsEl.textContent = "-∞ LUFS";
        }

        function setOne(sh, db) {
            const pct = Math.max(0, Math.min(100, (db - min) / span * 100));   // lit % from the bottom
            sh.style.height = (100 - pct).toFixed(1) + "%";
        }
        function set(db) {
            if (Array.isArray(db)) { shades.forEach((sh, i) => setOne(sh, db[i] != null ? db[i] : min)); }
            else shades.forEach((sh) => setOne(sh, db));
        }
        function setLufs(v) { if (lufsEl) lufsEl.textContent = (v == null || v <= -69 ? "-∞" : (+v).toFixed(1)) + " LUFS"; }

        set(opts.db != null ? opts.db : min);
        if (opts.lufs != null) setLufs(opts.lufs);
        return { el: wrap, set, setLufs };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.peakMeter = peakMeter;
})();
