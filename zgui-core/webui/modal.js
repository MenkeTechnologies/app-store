// zgui-core/modal.js — the base modal/dialog system, the keystone the other dialogs sit on.
// Emits the canonical `.modal-overlay > .modal-content > (.modal-header, .modal-body, .modal-footer)`
// structure (distilled from Audio-Haxor) so ZGui.modalDrag auto-enhances every modal, and so
// the 14 apps stop rebuilding overlay/ESC/backdrop plumbing. window.ZGui.modal.
//
//   ZGui.modal.open({
//       title, body,            // body: string (HTML) | Node
//       actions: [{ label, primary?, danger?, close?=true, onClick(api) }],
//       small?, className?, dismissable?=true, onClose?
//   }) -> { el, overlay, body, footer, close() }
//
//   ZGui.modal.confirm({ title, message, okLabel?, cancelLabel? })  -> Promise<boolean>
//   ZGui.modal.prompt({ title, message, value?, okLabel?, cancelLabel?, placeholder? }) -> Promise<string|null>
//
// ESC closes the top-most modal; backdrop click closes unless dismissable:false.
(function () {
    "use strict";

    const esc = window.escapeHtml || function (s) {
        const d = document.createElement("div");
        d.textContent = s == null ? "" : String(s);
        return d.innerHTML;
    };

    // Resolve user-facing text through the i18n bridge when present (pass an i18n key to translate,
    // else the literal/default shows). See i18n.js.
    const tr = (v, d) => { const s = v == null ? d : v; return (window.ZGui && window.ZGui.i18n) ? window.ZGui.i18n.t(s) : s; };

    const stack = [];

    function open(opts) {
        opts = opts || {};
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay modal-visible";

        const content = document.createElement("div");
        content.className = "modal-content" + (opts.small ? " modal-small" : "") + (opts.className ? " " + opts.className : "");

        // header
        const header = document.createElement("div");
        header.className = "modal-header";
        const h = document.createElement("h2");
        h.textContent = opts.title || "";
        const closeBtn = document.createElement("button");
        closeBtn.className = "modal-close";
        closeBtn.type = "button";
        closeBtn.title = "Close";
        closeBtn.innerHTML = "&#10005;";
        header.appendChild(h);
        header.appendChild(closeBtn);

        // body
        const body = document.createElement("div");
        body.className = "modal-body";
        if (opts.body != null) {
            if (typeof opts.body === "string") body.innerHTML = opts.body;
            else body.appendChild(opts.body);
        }

        content.appendChild(header);
        content.appendChild(body);

        // footer (only when actions are supplied)
        let footer = null;
        if (opts.actions && opts.actions.length) {
            footer = document.createElement("div");
            footer.className = "modal-footer";
            opts.actions.forEach(function (a) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "zs-btn" + (a.primary ? " zs-btn-primary" : "") + (a.danger ? " zs-btn-danger" : "");
                btn.textContent = a.label || "";
                btn.addEventListener("click", function () {
                    let keepOpen = false;
                    if (typeof a.onClick === "function") keepOpen = a.onClick(api) === false ? false : keepOpen;
                    if (a.close !== false) close();
                });
                footer.appendChild(btn);
            });
            content.appendChild(footer);
        }

        overlay.appendChild(content);
        document.body.appendChild(overlay);

        let closed = false;
        function close() {
            if (closed) return;
            closed = true;
            const i = stack.indexOf(api);
            if (i >= 0) stack.splice(i, 1);
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            if (typeof opts.onClose === "function") opts.onClose();
        }

        closeBtn.addEventListener("click", close);
        if (opts.dismissable !== false) {
            overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
        }

        const api = { el: content, overlay: overlay, body: body, footer: footer, close: close };
        stack.push(api);
        return api;
    }

    // ESC closes the top-most modal.
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && stack.length) {
            const top = stack[stack.length - 1];
            e.stopPropagation();
            top.close();
        }
    });

    function confirm(opts) {
        opts = opts || {};
        return new Promise(function (resolve) {
            let answered = false;
            const m = open({
                title: tr(opts.title, "Confirm"),
                small: true,
                body: `<p class="modal-message">${esc(opts.message || "")}</p>`,
                actions: [
                    { label: tr(opts.okLabel, "OK"), primary: true, onClick: function () { answered = true; resolve(true); } },
                    { label: tr(opts.cancelLabel, "Cancel"), onClick: function () { answered = true; resolve(false); } },
                ],
                onClose: function () { if (!answered) resolve(false); },
            });
            void m;
        });
    }

    function prompt(opts) {
        opts = opts || {};
        return new Promise(function (resolve) {
            let answered = false;
            const input = document.createElement("input");
            input.type = "text";
            input.className = "zs-input modal-prompt-input";
            input.value = opts.value || "";
            if (opts.placeholder) input.placeholder = opts.placeholder;
            const wrap = document.createElement("div");
            if (opts.message) {
                const p = document.createElement("p");
                p.className = "modal-message";
                p.textContent = opts.message;
                wrap.appendChild(p);
            }
            wrap.appendChild(input);
            const m = open({
                title: tr(opts.title, "Input"),
                small: true,
                body: wrap,
                actions: [
                    { label: tr(opts.okLabel, "OK"), primary: true, onClick: function () { answered = true; resolve(input.value); } },
                    { label: tr(opts.cancelLabel, "Cancel"), onClick: function () { answered = true; resolve(null); } },
                ],
                onClose: function () { if (!answered) resolve(null); },
            });
            input.addEventListener("keydown", function (e) {
                if (e.key === "Enter") { e.preventDefault(); answered = true; resolve(input.value); m.close(); }
            });
            requestAnimationFrame(function () { try { input.focus(); input.select(); } catch { /* detached */ } });
        });
    }

    window.ZGui = window.ZGui || {};
    window.ZGui.modal = { open: open, confirm: confirm, prompt: prompt, stack: stack };
})();
