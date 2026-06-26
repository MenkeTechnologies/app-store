// zgui-core/channel-strip.js — a mixer channel strip: name + pan knob + a fader with an inline level
// meter + solo/mute + optional sends. Composes ZGui.knob / ZGui.dbFader / ZGui.peakMeter. Core mixer
// element. window.ZGui.channelStrip.
//   ZGui.channelStrip({ name, color, db:0, pan:0, solo, mute, sends:[{label,value}], onFader(db),
//       onPan(v), onSolo(b), onMute(b), onSend(i,v) }) -> { el, setMeter(db|[l,r]), setDb(v) }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function channelStrip(opts) {
        opts = opts || {};
        const state = { solo: !!opts.solo, mute: !!opts.mute };
        const root = document.createElement("div"); root.className = "zg-chstrip";
        if (opts.color) root.style.setProperty("--zg-ch-col", opts.color);

        const name = document.createElement("div"); name.className = "zg-chstrip-name"; name.textContent = opts.name || "Ch"; name.title = opts.name || "";
        root.appendChild(name);

        // pan
        if (window.ZGui && window.ZGui.knob) { const pan = window.ZGui.knob({ value: opts.pan || 0, min: -1, max: 1, size: 32, onChange: (v) => { if (typeof opts.onPan === "function") opts.onPan(v); } }); const pw = document.createElement("div"); pw.className = "zg-chstrip-pan"; pw.appendChild(pan.el || pan); root.appendChild(pw); }

        // fader + meter side by side
        const fm = document.createElement("div"); fm.className = "zg-chstrip-fm";
        let meter = null;
        if (window.ZGui && window.ZGui.dbFader) { const fader = window.ZGui.dbFader({ value: opts.db || 0, min: -48, max: 6, onChange: (v) => { if (typeof opts.onFader === "function") opts.onFader(v); } }); fm.appendChild(fader.el || fader); }
        if (window.ZGui && window.ZGui.peakMeter) { meter = window.ZGui.peakMeter({ stereo: true, min: -48, max: 6 }); fm.appendChild(meter.el || meter); }
        root.appendChild(fm);

        // solo / mute
        const sm = document.createElement("div"); sm.className = "zg-chstrip-sm";
        sm.innerHTML = `<button class="zg-chstrip-s${state.solo ? " on" : ""}" data-t="solo">S</button><button class="zg-chstrip-m${state.mute ? " on" : ""}" data-t="mute">M</button>`;
        sm.addEventListener("click", (e) => { const b = e.target.closest("[data-t]"); if (!b) return; const p = b.dataset.t; state[p] = !state[p]; b.classList.toggle("on", state[p]); const cb = p === "solo" ? opts.onSolo : opts.onMute; if (typeof cb === "function") cb(state[p]); });
        root.appendChild(sm);

        // sends
        if (opts.sends && opts.sends.length) {
            const sends = document.createElement("div"); sends.className = "zg-chstrip-sends";
            opts.sends.forEach((s, i) => { if (window.ZGui && window.ZGui.knob) { const k = window.ZGui.knob({ value: s.value || 0, min: 0, max: 1, size: 24, label: s.label, onChange: (v) => { if (typeof opts.onSend === "function") opts.onSend(i, v); } }); sends.appendChild(k.el || k); } });
            root.appendChild(sends);
        }

        return { el: root, setMeter(v) { if (meter && meter.set) meter.set(v); }, setDb(v) { name.dataset.db = v; } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.channelStrip = channelStrip;
})();
