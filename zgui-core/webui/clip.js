// zgui-core/clip.js — an arranger clip block: a colored body with a name header and a mini preview of
// its contents (audio peaks via ZGui.viz.waveform, or a MIDI note pattern). Core arranger element.
// window.ZGui.clip.
//   ZGui.clip({ name, color, kind:'audio'|'midi', peaks, notes:[{pitch,start,length}], width, height,
//       selected, muted, onSelect, onDblClick }) -> { el, canvas, setSelected(b) }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function clip(opts) {
        opts = opts || {};
        const w = opts.width || 160, h = opts.height || 54;
        const root = document.createElement("div"); root.className = "zg-clip" + (opts.selected ? " selected" : "") + (opts.muted ? " muted" : "");
        root.style.width = w + "px"; root.style.height = h + "px";
        if (opts.color) root.style.setProperty("--zg-clip-col", opts.color);
        const head = document.createElement("div"); head.className = "zg-clip-head"; head.textContent = opts.name || "";
        const canvas = document.createElement("canvas"); canvas.className = "zg-clip-canvas"; canvas.width = w; canvas.height = h - 14;
        root.appendChild(head); root.appendChild(canvas);

        function draw() {
            const ctx = canvas.getContext("2d"); if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (opts.kind === "midi" && opts.notes && opts.notes.length) {
                const pitches = opts.notes.map((n) => n.pitch), lo = Math.min(...pitches), hi = Math.max(...pitches) + 1, span = Math.max(1, hi - lo);
                const totalLen = Math.max.apply(null, opts.notes.map((n) => n.start + n.length));
                ctx.fillStyle = opts.color || "#05d9e8";
                opts.notes.forEach((n) => { const x = (n.start / totalLen) * canvas.width, ww = Math.max(2, (n.length / totalLen) * canvas.width - 1), y = canvas.height - ((n.pitch - lo + 1) / span) * canvas.height; ctx.fillRect(x, y, ww, Math.max(2, canvas.height / span - 1)); });
            } else if (opts.peaks && window.ZGui && window.ZGui.viz && window.ZGui.viz.waveform) {
                window.ZGui.viz.waveform(ctx, canvas.width, canvas.height, opts.peaks);
            }
        }
        root.addEventListener("click", () => { if (typeof opts.onSelect === "function") opts.onSelect(); });
        if (typeof opts.onDblClick === "function") root.addEventListener("dblclick", opts.onDblClick);

        draw();
        return { el: root, canvas, setSelected(b) { root.classList.toggle("selected", !!b); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.clip = clip;
})();
