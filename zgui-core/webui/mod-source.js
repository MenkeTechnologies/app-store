// zgui-core/mod-source.js — the modulation-source palette: a row of draggable colored pills
// ("Sidechain / Velocity / MPE Press / LFO…") you drag onto a knob to route modulation, plus a
// drop-target helper to make any element accept a dropped source. Ported from zpwr-patch-core's
// sp-modpal / sp-modchip + the dial drop handler. window.ZGui.modSource.
//   ZGui.modSource({ label?, sources:[{id,label,color?}], onDragStart? }) -> { el, setSources }
//   ZGui.modSource.dropTarget(el, onDrop)  // onDrop(id) fires when a source is dropped on el
//   (uses the "text/modsrc" drag mimetype, the same wire format as the synth.)
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    const MIME = "text/modsrc";

    function modSource(opts) {
        opts = opts || {};
        const el = document.createElement("div");
        el.className = "zg-modpal";
        const lbl = document.createElement("span");
        lbl.className = "zg-modpal-lbl";
        lbl.textContent = opts.label || "MOD SOURCES — drag onto a knob ▸";
        el.appendChild(lbl);

        function render(sources) {
            // drop everything after the label
            while (el.childNodes.length > 1) el.removeChild(el.lastChild);
            (sources || []).forEach((s) => {
                const chip = document.createElement("span");
                chip.className = "zg-modchip";
                chip.textContent = s.label != null ? s.label : String(s.id);
                chip.draggable = true;
                if (s.color) { chip.style.color = s.color; chip.style.borderColor = s.color; }
                chip.addEventListener("dragstart", (e) => {
                    if (e.dataTransfer) { e.dataTransfer.setData(MIME, String(s.id)); e.dataTransfer.effectAllowed = "link"; }
                    if (typeof opts.onDragStart === "function") opts.onDragStart(s.id, s);
                });
                el.appendChild(chip);
            });
        }
        render(opts.sources);
        return { el, setSources: render };
    }

    // Make `target` accept a dropped mod source: highlights on dragover, calls onDrop(id) on drop.
    modSource.dropTarget = function (target, onDrop) {
        const t = typeof target === "string" ? document.querySelector(target) : target;
        if (!t) return;
        t.addEventListener("dragover", (e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = "link"; t.classList.add("zg-mod-drop"); });
        t.addEventListener("dragleave", () => t.classList.remove("zg-mod-drop"));
        t.addEventListener("drop", (e) => {
            e.preventDefault();
            t.classList.remove("zg-mod-drop");
            const id = parseInt(e.dataTransfer ? e.dataTransfer.getData(MIME) : "", 10);
            if (!isNaN(id) && typeof onDrop === "function") onDrop(id);
        });
    };

    window.ZGui = window.ZGui || {};
    window.ZGui.modSource = modSource;
})();
