// zgui-core/drawbar.js — Hammond-organ-style drawbars: a row of vertical sliders (0–8) with footage
// labels, dragged up/down to set each harmonic's level. window.ZGui.drawbar.
//   ZGui.drawbar(container, { values:[8 numbers 0..8], labels, count:9, height:140, onChange(i,v) }) ->
//       { el, set(values), get() }
(function () {
    "use strict";
    const FOOTAGE = ["16'", "5⅓'", "8'", "4'", "2⅔'", "2'", "1⅗'", "1⅓'", "1'"];
    // brown / white / black drawbar coloring like a real Hammond (sub & 5th brown, foundation white, upper black)
    const TONE = ["brown", "brown", "white", "white", "black", "white", "black", "black", "white"];
    function drawbar(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const count = opts.count || 9;
        const labels = opts.labels || FOOTAGE;
        let vals = [];
        for (let i = 0; i < count; i++) vals.push(opts.values && opts.values[i] != null ? opts.values[i] : 0);
        const H = opts.height || 140;

        const root = document.createElement("div"); root.className = "zg-drawbar"; root.style.setProperty("--zg-db-h", H + "px");
        host.appendChild(root);

        function render() {
            root.innerHTML = vals.map((v, i) =>
                `<div class="zg-drawbar-col" data-i="${i}"><div class="zg-drawbar-track"><div class="zg-drawbar-bar zg-drawbar-${TONE[i] || "white"}" data-i="${i}" style="height:${(v / 8) * 100}%"><span class="zg-drawbar-grip"></span></div></div><div class="zg-drawbar-label">${labels[i] || (i + 1)}</div></div>`).join("");
        }
        function setFromY(i, clientY) {
            const track = root.querySelector(`.zg-drawbar-col[data-i="${i}"] .zg-drawbar-track`); if (!track) return;
            const r = track.getBoundingClientRect();
            let frac = 1 - (clientY - r.top) / (r.height || 1); frac = Math.max(0, Math.min(1, frac));
            vals[i] = Math.round(frac * 8);
            const bar = track.querySelector(".zg-drawbar-bar"); if (bar) bar.style.height = (vals[i] / 8 * 100) + "%";
            if (typeof opts.onChange === "function") opts.onChange(i, vals[i]);
        }
        let dragI = -1;
        root.addEventListener("pointerdown", (e) => { const col = e.target.closest(".zg-drawbar-col"); if (!col) return; dragI = +col.dataset.i; try { root.setPointerCapture(e.pointerId); } catch { /* */ } setFromY(dragI, e.clientY); });
        root.addEventListener("pointermove", (e) => { if (dragI >= 0) setFromY(dragI, e.clientY); });
        root.addEventListener("pointerup", (e) => { dragI = -1; try { root.releasePointerCapture(e.pointerId); } catch { /* */ } });

        render();
        return { el: root, set(v) { for (let i = 0; i < count; i++) vals[i] = v && v[i] != null ? v[i] : 0; render(); }, get() { return vals.slice(); } };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.drawbar = drawbar;
})();
