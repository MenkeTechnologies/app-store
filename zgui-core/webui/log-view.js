// zgui-core/log-view.js — a streaming log / console viewer, generalized from zcontainer's
// appendLog (`body.textContent += text; scrollTop = scrollHeight`). That one-liner has two bugs
// every app re-inherits: the buffer grows unbounded (OOM on a long stream) and it yanks you to the
// bottom even while you're scrolled up reading. This fixes both: a bounded line buffer (drops the
// oldest) and "follow" autoscroll that only sticks when you're already at the bottom. Optional ANSI
// stripping. window.ZGui.logView.
//
//   ZGui.logView.create(container, {
//       maxLines: 5000,    // cap; oldest lines drop past this
//       ansi: false,       // strip ANSI escape codes from appended text
//   }) -> { el, append(text), clear(), setFollow(bool), get following() }
(function () {
    "use strict";

    // eslint-disable-next-line no-control-regex
    const ANSI_RE = /\x1b\[[0-9;?]*[ -/]*[@-~]/g;

    function create(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const maxLines = opts.maxLines || 5000;
        const stripAnsi = !!opts.ansi;

        const pre = document.createElement("pre");
        pre.className = "zg-logview";
        host.appendChild(pre);

        let lines = [];           // bounded buffer
        let partial = "";         // trailing fragment with no newline yet
        let following = true;     // stick to bottom

        function atBottom() {
            return pre.scrollHeight - pre.scrollTop - pre.clientHeight < 4;
        }
        pre.addEventListener("scroll", function () { following = atBottom(); });

        function flush() {
            pre.textContent = lines.join("\n") + (partial ? "\n" + partial : "");
            if (following) pre.scrollTop = pre.scrollHeight;
        }

        function append(text) {
            if (text == null) return;
            let s = String(text);
            if (stripAnsi) s = s.replace(ANSI_RE, "");
            s = partial + s;
            const parts = s.split("\n");
            partial = parts.pop();          // last piece may be incomplete
            for (const p of parts) lines.push(p);
            if (lines.length > maxLines) lines.splice(0, lines.length - maxLines);
            flush();
        }

        function clear() { lines = []; partial = ""; pre.textContent = ""; following = true; }
        function setFollow(v) { following = !!v; if (following) pre.scrollTop = pre.scrollHeight; }

        return {
            el: pre,
            append: append,
            clear: clear,
            setFollow: setFollow,
            get following() { return following; },
        };
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.logView = { create: create };
})();
