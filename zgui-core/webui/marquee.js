// zgui-core/marquee.js — a scrolling ticker (seamless loop). window.ZGui.marquee.
//   ZGui.marquee(container, { text|html, speed?, reverse? }) -> { el, setText }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    function marquee(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        host.classList.add("zg-marquee");
        if (opts.reverse) host.classList.add("zg-marquee-rev");
        if (opts.speed) host.style.setProperty("--zg-marquee-dur", opts.speed + "s");
        function setText(t, isHtml) {
            const content = isHtml ? t : esc(t);
            // duplicate the run so the loop is seamless
            host.innerHTML = `<div class="zg-marquee-track"><span class="zg-marquee-run">${content}</span><span class="zg-marquee-run" aria-hidden="true">${content}</span></div>`;
        }
        setText(opts.html != null ? opts.html : (opts.text || ""), opts.html != null);
        return { el: host, setText: (t) => setText(t, false), setHtml: (h) => setText(h, true) };
    }
    window.ZGui = window.ZGui || {}; window.ZGui.marquee = marquee;
})();
