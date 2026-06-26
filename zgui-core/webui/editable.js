// zgui-core/editable.js — inline click-to-edit text: a static preview that swaps to an input on
// activation, commits on Enter/blur, reverts on Escape. Ported behavior from Chakra UI's <Editable>
// (preview vs edit states, activationMode, submitMode, selectOnFocus, onChange/onSubmit/onCancel).
// window.ZGui.editable.
//   ZGui.editable(container, { value, placeholder, activationMode:'click', submitMode:'both',
//       selectOnFocus:true, multiline:false, onChange(v), onSubmit(v), onCancel(v) }) ->
//       { el, get(), set(v), edit(), submit(), cancel() }
(function () {
    "use strict";
    function editable(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const activation = opts.activationMode || "click";
        const submitMode = opts.submitMode || "both";
        const multiline = !!opts.multiline;
        let value = opts.value != null ? String(opts.value) : "";
        let editing = false;

        const root = document.createElement("span"); root.className = "zg-editable";
        const preview = document.createElement("span"); preview.className = "zg-editable-preview"; preview.tabIndex = 0;
        const input = document.createElement(multiline ? "textarea" : "input");
        input.className = "zg-editable-input"; input.hidden = true;
        if (!multiline) input.type = "text";
        root.appendChild(preview); root.appendChild(input); host.appendChild(root);

        function renderPreview() {
            if (value === "") { preview.textContent = opts.placeholder || "Click to edit"; preview.classList.add("is-empty"); }
            else { preview.textContent = value; preview.classList.remove("is-empty"); }
        }
        function edit() {
            if (editing) return;
            editing = true; preview.hidden = true; input.hidden = false; input.value = value;
            input.focus();
            if (opts.selectOnFocus !== false && input.select) input.select();
            root.classList.add("is-editing");
        }
        function commit() {
            if (!editing) return;
            editing = false; input.hidden = true; preview.hidden = false; root.classList.remove("is-editing");
            const next = input.value;
            if (next !== value) { value = next; if (typeof opts.onSubmit === "function") opts.onSubmit(value); }
            renderPreview();
        }
        function cancel() {
            if (!editing) return;
            editing = false; input.hidden = true; preview.hidden = false; root.classList.remove("is-editing");
            input.value = value; renderPreview();
            if (typeof opts.onCancel === "function") opts.onCancel(value);
        }

        if (activation === "click") preview.addEventListener("click", edit);
        else if (activation === "dblclick") preview.addEventListener("dblclick", edit);
        else if (activation === "focus") preview.addEventListener("focus", edit);
        input.addEventListener("input", () => { if (typeof opts.onChange === "function") opts.onChange(input.value); });
        input.addEventListener("keydown", (e) => {
            if (e.key === "Escape") { e.preventDefault(); cancel(); }
            else if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) { if (submitMode === "enter" || submitMode === "both") { e.preventDefault(); commit(); } }
        });
        input.addEventListener("blur", () => { if (submitMode === "blur" || submitMode === "both") commit(); });

        renderPreview();
        return { el: root, get() { return value; }, set(v) { value = v != null ? String(v) : ""; renderPreview(); }, edit, submit: commit, cancel };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.editable = editable;
})();
