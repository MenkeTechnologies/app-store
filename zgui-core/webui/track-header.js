// zgui-core/track-header.js — a DAW track-header strip: a colored edge, the track name, arm / solo /
// mute toggles and a dB readout. Reusable for any multi-track UI (arranger row, mixer channel, video
// timeline). Extracted from the Bitwig arranger track headers. window.ZGui.trackHeader.
//   ZGui.trackHeader({ name, color, db, armed, solo, mute, icon, onArm, onSolo, onMute, onRename,
//       onSelect }) -> { el, set(patch), setDb(v) }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function trackHeader(opts) {
        opts = opts || {};
        const state = { armed: !!opts.armed, solo: !!opts.solo, mute: !!opts.mute };
        const root = document.createElement("div"); root.className = "zg-trackhdr";
        if (opts.color) root.style.setProperty("--zg-trk-col", opts.color);
        root.innerHTML =
            '<span class="zg-trackhdr-edge"></span>'
            + `<button class="zg-trackhdr-arm${state.armed ? " on" : ""}" data-t="armed" title="Record arm">●</button>`
            + `<div class="zg-trackhdr-mid"><div class="zg-trackhdr-name" title="${esc(opts.name || "")}">${(opts.icon ? esc(opts.icon) + " " : "") + esc(opts.name || "Track")}</div>`
            + `<div class="zg-trackhdr-db">${opts.db != null ? esc(opts.db) + " dB" : ""}</div></div>`
            + `<div class="zg-trackhdr-sm"><button class="zg-trackhdr-s${state.solo ? " on" : ""}" data-t="solo" title="Solo">S</button>`
            + `<button class="zg-trackhdr-m${state.mute ? " on" : ""}" data-t="mute" title="Mute">M</button></div>`;
        const dbEl = root.querySelector(".zg-trackhdr-db");
        const nameEl = root.querySelector(".zg-trackhdr-name");

        root.addEventListener("click", (e) => {
            const tgl = e.target.closest("[data-t]");
            if (tgl) { e.stopPropagation(); const p = tgl.dataset.t; state[p] = !state[p]; tgl.classList.toggle("on", state[p]); const cb = { armed: opts.onArm, solo: opts.onSolo, mute: opts.onMute }[p]; if (typeof cb === "function") cb(state[p]); return; }
            if (typeof opts.onSelect === "function") opts.onSelect();
        });
        if (typeof opts.onRename === "function") {
            nameEl.addEventListener("dblclick", () => { nameEl.contentEditable = "true"; nameEl.focus(); });
            nameEl.addEventListener("blur", () => { nameEl.contentEditable = "false"; opts.onRename(nameEl.textContent.trim()); });
            nameEl.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); nameEl.blur(); } });
        }
        return {
            el: root,
            set(patch) { patch = patch || {}; ["armed", "solo", "mute"].forEach((p) => { if (p in patch) { state[p] = !!patch[p]; const b = root.querySelector(`[data-t="${p}"]`); if (b) b.classList.toggle("on", state[p]); } }); if (patch.name != null) nameEl.textContent = patch.name; if (patch.db != null) dbEl.textContent = patch.db + " dB"; if (patch.color) root.style.setProperty("--zg-trk-col", patch.color); },
            setDb(v) { dbEl.textContent = v == null ? "" : v + " dB"; },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.trackHeader = trackHeader;
})();
