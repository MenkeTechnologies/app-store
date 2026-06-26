// zgui-core/widgets.js — JS factories for the atomic form controls, so the whole library is a
// uniform ZGui.* API (ZGui.button, ZGui.textfield, ZGui.checkbox … alongside ZGui.drawer/.table).
// Each factory builds a NATIVE element wearing the existing widgets.css classes (.zs-btn/.zs-input/
// .zs-check/…) — no new CSS. Stateful controls take an onChange/onInput and return a small handle.
//
//   ZGui.button({ label, variant:'primary'|'danger'|'mini', icon, onClick, disabled }) -> <button>
//   ZGui.textfield({ value, placeholder, type, onInput, onEnter }) -> { el, get(), set(v) }
//   ZGui.checkbox({ label, checked, onChange }) -> { el, input, get(), set(v) }
//   ZGui.toggle({ checked, onChange }) -> { el, input, get(), set(v) }      (alias: ZGui.switch)
//   ZGui.range({ min, max, step, value, onInput }) -> { el, get(), set(v) }
//   ZGui.select({ options:[{value,label}|[value,label]], value, onChange }) -> { el, get(), set(v) }
//   ZGui.badge(text, { accent }) -> <span> ;  ZGui.chip(text, { active, onClick }) -> <span>
(function () {
    "use strict";

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }

    function button(o) {
        o = o || {};
        const b = el("button", "zs-btn" + (o.variant ? " zs-btn-" + o.variant : ""));
        b.type = o.type || "button";
        if (o.icon) b.appendChild(el("span", "zs-btn-icon", o.icon));
        if (o.label != null) b.appendChild(document.createTextNode((o.icon ? " " : "") + o.label));
        if (o.disabled) b.disabled = true;
        if (typeof o.onClick === "function") b.addEventListener("click", o.onClick);
        return b;
    }

    function textfield(o) {
        o = o || {};
        const i = el("input", "zs-input");
        i.type = o.type || "text";
        if (o.value != null) i.value = o.value;
        if (o.placeholder) i.placeholder = o.placeholder;
        if (typeof o.onInput === "function") i.addEventListener("input", () => o.onInput(i.value, i));
        if (typeof o.onEnter === "function") i.addEventListener("keydown", (e) => { if (e.key === "Enter") o.onEnter(i.value, i); });
        return { el: i, get() { return i.value; }, set(v) { i.value = v == null ? "" : v; } };
    }

    function checkbox(o) {
        o = o || {};
        const label = el("label", "zs-checkbox");
        const input = el("input", "zs-check");
        input.type = "checkbox";
        input.checked = !!o.checked;
        if (o.indeterminate) { input.indeterminate = true; label.classList.add("is-indeterminate"); }
        if (typeof o.onChange === "function") input.addEventListener("change", () => { input.indeterminate = false; label.classList.remove("is-indeterminate"); o.onChange(input.checked, input); });
        label.appendChild(input);
        if (o.label != null) label.appendChild(el("span", "zs-checkbox-label", o.label));
        return {
            el: label, input,
            get() { return input.indeterminate ? null : input.checked; },
            set(v) { input.indeterminate = false; label.classList.remove("is-indeterminate"); input.checked = !!v; },
            setIndeterminate(v) { input.indeterminate = !!v; label.classList.toggle("is-indeterminate", !!v); },
        };
    }

    function toggle(o) {
        o = o || {};
        const label = el("label", "zs-switch");
        const input = el("input");
        input.type = "checkbox";
        input.checked = !!o.checked;
        if (typeof o.onChange === "function") input.addEventListener("change", () => o.onChange(input.checked, input));
        const slider = el("span", "zs-slider");
        label.appendChild(input);
        label.appendChild(slider);
        return { el: label, input, get() { return input.checked; }, set(v) { input.checked = !!v; } };
    }

    function range(o) {
        o = o || {};
        const i = el("input", "zs-range");
        i.type = "range";
        if (o.min != null) i.min = o.min;
        if (o.max != null) i.max = o.max;
        if (o.step != null) i.step = o.step;
        if (o.value != null) i.value = o.value;
        if (typeof o.onInput === "function") i.addEventListener("input", () => o.onInput(Number(i.value), i));
        return { el: i, get() { return Number(i.value); }, set(v) { i.value = v; } };
    }

    function select(o) {
        o = o || {};
        const s = el("select", "zs-select");
        (o.options || []).forEach((opt) => {
            const value = Array.isArray(opt) ? opt[0] : opt.value;
            const text = Array.isArray(opt) ? opt[1] : (opt.label != null ? opt.label : opt.value);
            const oe = el("option", null, text);
            oe.value = value;
            s.appendChild(oe);
        });
        if (o.value != null) s.value = o.value;
        if (typeof o.onChange === "function") s.addEventListener("change", () => o.onChange(s.value, s));
        return { el: s, get() { return s.value; }, set(v) { s.value = v; } };
    }

    function badge(text, o) {
        o = o || {};
        const b = el("span", "zs-badge" + (o.accent ? " zs-badge-accent" : "") + (o.fill ? " zs-badge-fill" : ""), text);
        // colour variant: kind = cyan|accent|magenta|green|yellow|orange|red|muted (data-kind, not an
        // inline var, so release WebKit colours innerHTML-injected badges). fill:true = solid pill.
        if (o.kind) b.dataset.kind = o.kind;
        return b;
    }
    function chip(text, o) {
        o = o || {};
        const c = el("span", "zs-chip" + (o.active ? " active" : ""), text);
        if (typeof o.onClick === "function") c.addEventListener("click", () => o.onClick(c));
        return c;
    }

    window.ZGui = window.ZGui || {};
    Object.assign(window.ZGui, {
        button, textfield, checkbox, toggle, range, select, badge, chip,
        switch: toggle,   // ergonomic alias (the keyword is fine as a property name)
    });
})();
