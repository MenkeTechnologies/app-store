// zgui-core/format-badge.js — a file-format badge: a small uppercase chip whose color encodes the
// format (WAV cyan, MP3 pink, FLAC magenta, OGG/OPUS orange, M4A/AAC yellow, AIFF/SF2 green, else
// dim). Ported verbatim from Audio-Haxor's getFormatClass() + .format-* CSS. window.ZGui.formatBadge.
//   ZGui.formatBadge(format, { title }) -> HTMLSpanElement
//   ZGui.formatBadge.classFor("flac") -> "zg-fmt-flac"   (the color class, exposed for table cells)
(function () {
    "use strict";
    // exact set from Haxor getFormatClass(); anything else → default.
    const KNOWN = ["wav", "mp3", "aiff", "aif", "flac", "ogg", "m4a", "aac", "opus", "wma", "rex", "rx2", "sf2", "sfz"];
    function classFor(format) {
        const f = String(format || "").toLowerCase();
        return KNOWN.indexOf(f) >= 0 ? "zg-fmt-" + f : "zg-fmt-default";
    }
    function formatBadge(format, opts) {
        opts = opts || {};
        const span = document.createElement("span");
        span.className = "zg-fmt-badge " + classFor(format);
        span.textContent = String(format == null ? "" : format).toUpperCase();
        if (opts.title) span.title = opts.title;
        return span;
    }
    formatBadge.classFor = classFor;
    window.ZGui = window.ZGui || {};
    window.ZGui.formatBadge = formatBadge;
})();
