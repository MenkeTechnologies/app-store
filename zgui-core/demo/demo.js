// zgui-core/demo/demo.js — interactive showcase of the whole library. Each entry mounts a live
// component into its card (mounting wrapped so one error never blanks the page); every remaining
// export is listed under "More / low-level" so nothing is hidden. Filter box uses ZGui.fzf with
// matched-character highlighting — the same engine the command palette uses.
(function () {
    "use strict";
    const Z = window.ZGui || {};
    const app = document.getElementById("app");

    // Served over file://, the browser blocks cross-origin asset reads (knob PNG sprites drawn to a
    // canvas, fonts) — origin is "null". Nothing in CSS/JS can bypass that; serve over HTTP.
    if (location.protocol === "file:") {
        const w = document.createElement("div");
        w.className = "demo-fileproto";
        w.innerHTML = '⚠ Opened via <code>file://</code> — some assets (knob sprites, fonts) are CORS-blocked. '
            + 'Serve over HTTP: <code>cd zgui-core &amp;&amp; python3 -m http.server</code> → open '
            + '<code>http://localhost:8000/demo/</code>';
        app.appendChild(w);
    }

    // mount whatever a factory returns: { el } | HTMLElement | (already mounted into the stage).
    // Guards against the "new child contains the parent" error from container-style components that
    // return the stage itself (e.g. radio mounts via innerHTML and returns { el: <stage> }).
    function add(stage, ret) {
        if (!ret) return;
        const node = ret.el || ret;
        if (!node || node.nodeType !== 1) return;
        if (node === stage || (node.contains && node.contains(stage))) return; // it IS the stage / an ancestor
        if (node.parentNode === stage) return;                                 // already a child
        stage.appendChild(node);
    }
    function btn(label, onClick, variant) {
        return Z.button ? Z.button({ label, variant: variant || "", onClick })
            : (() => { const b = document.createElement("button"); b.textContent = label; b.onclick = onClick; return b; })();
    }
    const toast = (m, type) => (Z.toast && Z.toast.show) ? Z.toast.show(m, 1600, type) : 0;
    // wrap a trigger handler so a wrong/uncaught API call toasts instead of throwing to the console
    const trig = (fn) => () => { try { fn(); } catch (e) { toast("⚠ " + (e && e.message || e), "error"); /* eslint-disable-next-line no-console */ console.error(e); } };
    // a canvas-backed animated-viz card: drawFn(ctx, w, h, t) is called ~18×/s.
    const vizCard = (drawFn) => (s) => {
        s.style.display = "block";
        const cv = document.createElement("canvas"); cv.width = 240; cv.height = 96; cv.style.cssText = "width:100%;border-radius:4px;display:block"; s.appendChild(cv);
        const ctx = cv.getContext("2d");
        let t = 0;
        setInterval(() => { t += 0.09; try { drawFn(ctx, cv.width, cv.height, t); } catch (_) { /* ignore per-frame */ } }, 55);
    };

    // ── the catalog: [category, name, apiHint, run(stage)] ────────────────────
    const DEMOS = [
        // Buttons & actions
        ["Buttons & Actions", "button", "ZGui.button({label,variant,onClick})", (s) => ["primary", "", "danger", "stop", "mini", "compact"].forEach((v) => add(s, btn(v || "default", () => toast(`${v || "default"}`), v)))],
        ["Buttons & Actions", "buttonGroup", "ZGui.buttonGroup({buttons,value})", (s) => add(s, Z.buttonGroup({ buttons: [{ value: "l", label: "Left" }, { value: "c", label: "Center" }, { value: "r", label: "Right" }], value: "l", onChange: (v) => toast(v) }))],
        ["Buttons & Actions", "toggleGroup", "ZGui.toggleGroup({items})", (s) => add(s, Z.toggleGroup({ items: [{ id: "b", label: "B", active: true }, { id: "i", label: "I" }, { id: "u", label: "U" }], onChange: (id, on) => toast(`${id}=${on}`) }))],
        ["Buttons & Actions", "splitButton", "ZGui.splitButton({label,items})", (s) => add(s, Z.splitButton({ label: "Save", variant: "primary", onClick: () => toast("save"), items: [{ label: "Save As…", onClick: () => toast("save as") }, "-", { label: "Delete", danger: true, onClick: () => toast("delete") }] }))],
        ["Buttons & Actions", "speedDial", "ZGui.speedDial({actions,direction})", (s) => add(s, Z.speedDial({ icon: "+", direction: "right", actions: [{ icon: "✎", label: "Edit", onClick: () => toast("edit") }, { icon: "⧉", label: "Copy", onClick: () => toast("copy") }] }))],
        ["Buttons & Actions", "button (raised)", "ZGui.button({variant:'raised'}) — button.png plate", (s) => ["PATCH", "SYNTH", "PERFORM"].forEach((t) => add(s, btn(t, () => toast(t), "raised")))],
        ["Buttons & Actions", "copyButton", "ZGui.copyButton({text})", (s) => add(s, Z.copyButton({ text: "zgui-core", label: "Copy slug" }))],
        ["Buttons & Actions", "fab", "ZGui.fab({icon,onClick})", (s) => { const r = Z.fab({ icon: "+", onClick: () => toast("fab"), corner: "br" }); const n = r.el || r; if (n) { n.style.position = "static"; s.appendChild(n); } }],

        // Inputs & forms
        ["Inputs & Forms", "textfield", "ZGui.textfield({placeholder})", (s) => add(s, Z.textfield({ placeholder: "Type here…" }))],
        ["Inputs & Forms", "checkbox", "ZGui.checkbox({label,checked,indeterminate})", (s) => { s.style.display = "flex"; s.style.flexDirection = "column"; s.style.gap = "6px"; add(s, Z.checkbox({ label: "Checked", checked: true })); add(s, Z.checkbox({ label: "Indeterminate (tri-state)", indeterminate: true })); add(s, Z.checkbox({ label: "Unchecked" })); }],
        ["Inputs & Forms", "toggle", "ZGui.toggle({checked})", (s) => add(s, Z.toggle({ checked: true, onChange: (v) => toast(`toggle ${v}`) }))],
        ["Inputs & Forms", "range", "ZGui.range({min,max,value})", (s) => add(s, Z.range({ min: 0, max: 100, value: 40 }))],
        ["Inputs & Forms", "rangeSlider", "ZGui.rangeSlider({low,high})", (s) => { const w = document.createElement("div"); w.style.width = "200px"; w.appendChild(Z.rangeSlider({ min: 0, max: 100, low: 25, high: 75, onChange: (l, h) => toast(`${l}–${h}`) }).el); s.appendChild(w); }],
        ["Inputs & Forms", "numberStepper", "ZGui.numberStepper({value})", (s) => add(s, Z.numberStepper({ value: 10, min: 0, max: 100, step: 1 }))],
        ["Inputs & Forms", "select", "ZGui.select({options,value})", (s) => add(s, Z.select({ options: [["a", "Alpha"], ["b", "Beta"], ["c", "Gamma"]], value: "a" })), { pop: true }],
        ["Inputs & Forms", "combobox", "ZGui.combobox({options})", (s) => add(s, Z.combobox({ options: [["a", "Alpha"], ["b", "Beta"], ["c", "Gamma"]], value: "a", placeholder: "Pick…" })), { pop: true }],
        ["Inputs & Forms", "inputGroup", "ZGui.inputGroup({prefix,suffix})", (s) => add(s, Z.inputGroup({ prefix: "$", suffix: ".00", placeholder: "0", value: "42" }))],
        ["Inputs & Forms", "searchBox (icon + regex + clear)", "ZGui.searchBox(host,{placeholder,onInput,onRegex})", (s) => { s.style.display = "block"; Z.searchBox(s, { placeholder: "Search samples…", onInput: (v, o) => toast((o.regex ? "/" + v + "/" : v) || "cleared"), onRegex: (b) => toast("regex " + b) }); }],
        ["Inputs & Forms", "mentions (@-trigger)", "ZGui.mentions(host,{options,prefix,onSelect})", (s) => { s.style.display = "block"; Z.mentions(s, { placeholder: "Type @ to mention…", options: [{ value: "alice", label: "Alice" }, { value: "bob", label: "Bob" }, { value: "carol", label: "Carol" }], onSelect: (o) => toast("@" + o.value) }); }],
        ["Inputs & Forms", "upload (list + progress)", "ZGui.upload(host,{multiple,onChange})", (s) => { s.style.display = "block"; const up = Z.upload(s, { multiple: true, buttonText: "Click or drag to upload", onChange: ({ file }) => { let p = 0; const t = setInterval(() => { p += 25; up.setProgress(file.uid, p); if (p >= 100) { clearInterval(t); up.setStatus(file.uid, "done"); } }, 200); } }); }],
        ["Selection & Nav", "treeSelect (tree dropdown)", "ZGui.treeSelect(host,{treeData,checkable,onChange})", (s) => { Z.treeSelect(s, { checkable: true, showSearch: true, placeholder: "Pick nodes…", defaultExpandAll: true, treeData: [{ title: "src", value: "src", children: [{ title: "main.rs", value: "main" }, { title: "lib.rs", value: "lib" }] }, { title: "docs", value: "docs", children: [{ title: "README", value: "readme" }] }], onChange: (v) => toast(Array.isArray(v) ? v.join(",") : v) }); }, { pop: true }],
        ["Selection & Nav", "anchor (scroll-spy ToC)", "ZGui.anchor(host,{items,onChange})", (s) => { s.style.display = "block"; Z.anchor(s, { items: [{ href: "#sec-a", title: "Overview" }, { href: "#sec-b", title: "Details", children: [{ href: "#sec-b1", title: "Sub-detail" }] }, { href: "#sec-c", title: "API" }], onClick: (h) => toast(h) }); }],
        ["Data Display", "image (preview + zoom/rotate)", "ZGui.image({src,fallback,preview})", (s) => { const svg = (c, t) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='160' height='110'><rect width='160' height='110' fill='${c}'/><text x='80' y='60' font-size='18' font-family='monospace' text-anchor='middle' fill='#0a0a16'>${t}</text></svg>`); add(s, Z.image({ src: svg("#05d9e8", "IMG-1"), width: 130, preview: true })); }],
        ["Overlays (triggered)", "expose (window switcher grid)", "ZGui.expose(host,{windows,onChoose,onClose})", (s) => {
            s.style.display = "block";
            const box = document.createElement("div"); box.style.cssText = "height:300px;border:1px solid var(--border);border-radius:6px;overflow:hidden"; s.appendChild(box);
            const prev = "wizard@host ~ %\n$ ls -la\ntotal 248\ndrwxr-xr-x  42 wizard staff\n-rw-r--r--   1 wizard staff  .zshrc\n$ cargo build\n   Compiling zshrs v0.1.0";
            Z.expose(box, { windows: [{ id: "a", title: "Zterm", cwd: "/Users/wizard", pid: 73434, columns: 140, lines: 80, preview: prev, focused: true }, { id: "b", title: "vim · main.rs", cwd: "~/zshrs", pid: 8123, columns: 120, lines: 40, preview: "fn main() {\n    println!(\"hi\");\n}" }, { id: "c", title: "htop", pid: 990, columns: 90, lines: 50, preview: "CPU [|||||  45%]\nMEM [|||||||80%]" }], onChoose: (id) => toast("focus " + id), onClose: () => toast("close") });
        }],
        ["Overlays (triggered)", "popconfirm (inline confirm)", "ZGui.popconfirm(btn,{title,onConfirm})", (s) => { const b = btn("Delete", () => { }, "danger"); add(s, b); Z.popconfirm(b, { title: "Delete this item?", description: "This cannot be undone.", danger: true, okText: "Delete", onConfirm: () => toast("deleted"), onCancel: () => toast("cancelled") }); }],
        ["Overlays (triggered)", "backTop (scroll to top)", "ZGui.backTop({visibilityHeight})", (s) => add(s, btn("Spawn backTop (scroll page)", () => { const bt = Z.backTop({ visibilityHeight: 0 }); bt.el.classList.add("show"); toast("backTop bottom-right"); setTimeout(() => bt.destroy(), 4000); }))],
        ["Overlays (triggered)", "affix (pin on scroll)", "ZGui.affix(child,{offsetTop})", (s) => { s.style.display = "block"; const note = document.createElement("div"); note.style.cssText = "padding:8px;background:var(--bg-hover);border:1px solid var(--cyan);border-radius:4px;font-size:11px;color:var(--text-muted)"; note.textContent = "ZGui.affix(el,{offsetTop:0}) pins this to the viewport once scrolled past."; s.appendChild(note); }],
        ["Inputs & Forms", "field", "ZGui.field({label,control,help})", (s) => add(s, Z.field({ label: "Email", control: Z.textfield({ placeholder: "you@example.com" }).el, help: "We never share it." }))],
        ["Inputs & Forms", "datePicker", "ZGui.datePicker(host,{})", (s) => Z.datePicker(s, { onChange: (v) => toast(v) }), { pop: true }],
        ["Inputs & Forms", "calendar", "ZGui.calendar(host,{onSelect})", (s) => Z.calendar(s, { onSelect: (d) => toast(d.toDateString ? d.toDateString() : String(d)) })],
        ["Inputs & Forms", "pinInput", "ZGui.pinInput(host,{length})", (s) => Z.pinInput(s, { length: 4, onComplete: (v) => toast(`pin ${v}`) })],
        ["Inputs & Forms", "tagInput", "ZGui.tagInput({tags})", (s) => add(s, Z.tagInput({ tags: ["alpha", "beta"], placeholder: "add tag…" }))],
        ["Inputs & Forms", "colorPicker", "ZGui.colorPicker({value})", (s) => add(s, Z.colorPicker({ value: "#05d9e8", onChange: (v) => toast(v) }))],
        ["Inputs & Forms", "rating", "ZGui.rating({value,max})", (s) => add(s, Z.rating({ value: 3, max: 5, onChange: (v) => toast(`★ ${v}`) }))],
        ["Inputs & Forms", "knob", "ZGui.knob({value,label})", (s) => add(s, Z.knob({ value: 0.5, label: "Gain", onChange: (v) => toast(v.toFixed(2)) }))],
        ["Inputs & Forms", "wheel", "ZGui.wheel(parent,{label})", (s) => Z.wheel(s, { label: "Pitch", min: -1, max: 1, center: 0, spring: true })],
        ["Inputs & Forms", "kvEditor", "ZGui.kvEditor.mount(host,rows)", (s) => { s.style.display = "block"; Z.kvEditor.mount(s, [{ key: "host", value: "localhost" }, { key: "port", value: "8080" }], { description: false, bulk: false }); }],

        // Selection & nav
        ["Selection & Nav", "segmented", "ZGui.segmented.create(host,items)", (s) => Z.segmented.create(s, [{ id: "l", label: "List" }, { id: "g", label: "Grid" }, { id: "m", label: "Map" }], { value: "l", onChange: (v) => toast(v) })],
        ["Selection & Nav", "radio", "ZGui.radio(host,{options})", (s) => Z.radio(s, { options: [{ value: "a", label: "One" }, { value: "b", label: "Two" }], value: "a", name: "demo-radio", onChange: (v) => toast(v) })],
        ["Selection & Nav", "tabs", "ZGui.tabs.init({nav})", (s) => {
            s.style.display = "block";
            const nav = document.createElement("div"); nav.className = "tab-nav";
            ["First", "Second"].forEach((t, i) => { const b = document.createElement("button"); b.className = "tab-btn" + (i === 0 ? " active" : ""); b.dataset.tab = "demo-tab-" + i; b.textContent = t; nav.appendChild(b); });
            s.appendChild(nav);
            // panels toggle via the .active class (switchTo toggles it; demo.css supplies the show/hide)
            ["Tab one body", "Tab two body"].forEach((txt, i) => { const p = document.createElement("div"); p.className = "tab-content" + (i === 0 ? " active" : ""); p.id = "demo-tab-" + i; p.dataset.tab = "demo-tab-" + i; p.textContent = txt; s.appendChild(p); });
            Z.tabs.init({ nav: ".tab-nav", reorderable: false, restore: false });
        }],
        ["Selection & Nav", "accordion", "ZGui.accordion(host,sections)", (s) => Z.accordion(s, [{ title: "Section A", body: "Body A", open: true }, { title: "Section B", body: "Body B" }], { multi: true })],
        ["Selection & Nav", "collapsible", "ZGui.collapsible(host,{title,body})", (s) => Z.collapsible(s, { title: "Details", body: "Hidden content revealed on click.", open: false })],
        ["Selection & Nav", "breadcrumb", "ZGui.breadcrumb.render(host,segs)", (s) => Z.breadcrumb.render(s, [{ label: "root" }, { label: "src" }, { label: "webui" }])],
        ["Selection & Nav", "menubar", "ZGui.menubar(host,menus)", (s) => add(s, Z.menubar(s, [{ label: "File", items: [{ label: "New" }, { label: "Open" }] }, { label: "Edit", items: [{ label: "Undo" }] }])), { pop: true }],
        ["Selection & Nav", "wizard", "ZGui.wizard(host,{steps})", (s) => Z.wizard(s, { steps: [{ title: "One", render: (b) => { b.textContent = "Step one"; } }, { title: "Two", render: (b) => { b.textContent = "Step two"; } }] })],
        ["Selection & Nav", "dropdownMenu", "ZGui.dropdownMenu(trigger,{items})", (s) => { const t = btn("Menu ▾", () => {}); s.appendChild(t); Z.dropdownMenu(t, { items: [{ label: "Rename" }, { label: "Duplicate" }, { separator: true }, { label: "Delete", danger: true }], onSelect: (v) => toast(v.label || "picked") }); }, { pop: true }],
        ["Selection & Nav", "scrollArea", "ZGui.scrollArea(host,{maxHeight})", (s) => { const box = document.createElement("div"); for (let i = 1; i <= 12; i++) { const r = document.createElement("div"); r.textContent = "row " + i; r.style.padding = "3px 6px"; box.appendChild(r); } s.appendChild(box); Z.scrollArea(box, { maxHeight: 90 }); }],
        ["Selection & Nav", "facetSidebar", "ZGui.facetSidebar({facets}) + match()", (s) => {
            s.style.display = "block";
            const items = [{ bank: "Factory", type: "Bass" }, { bank: "Factory", type: "Lead" }, { bank: "User", type: "Bass" }, { bank: "User", type: "Pad" }];
            const facets = [
                { name: "bank", label: "Bank", values: [{ value: "Factory", count: 2 }, { value: "User", count: 2 }] },
                { name: "type", label: "Type", values: [{ value: "Bass", count: 2 }, { value: "Lead", count: 1 }, { value: "Pad", count: 1 }] },
            ];
            const fs = Z.facetSidebar({ facets, onChange: () => toast(items.filter((it) => fs.match(it)).length + " / " + items.length + " match") });
            const w = document.createElement("div"); w.style.maxWidth = "220px"; w.appendChild(fs.el); s.appendChild(w);
        }],

        // Data display
        ["Data Display", "card", "ZGui.card({title,body})", (s) => add(s, Z.card({ title: "Card title", body: "A bordered content card with a heading." }))],
        ["Data Display", "dataTable", "ZGui.dataTable(host,...)", (s) => Z.dataTable(s, { columns: [{ key: "k", label: "Key" }, { key: "v", label: "Value" }], rows: [{ k: "x", v: 1 }, { k: "y", v: 2 }] })],
        ["Data Display", "tree", "ZGui.tree.render(host,nodes)", (s) => Z.tree.render(s, [{ label: "src", children: [{ label: "main.rs" }, { label: "lib.rs" }] }, { label: "README.md" }])],
        ["Data Display", "managerList", "ZGui.managerList(host,groups)", (s) => Z.managerList(s, [{ title: "Group", items: [{ label: "Item A" }, { label: "Item B" }] }], {})],
        ["Data Display", "transferList", "ZGui.transferList(host,items)", (s) => Z.transferList(s, ["Alpha", "Beta", "Gamma"], { title: "Sources" })],
        ["Data Display", "timeline", "ZGui.timeline(host,items)", (s) => Z.timeline(s, [{ time: "09:00", title: "Started", desc: "boot" }, { time: "09:05", title: "Ready", desc: "ok", color: "var(--green)" }])],
        ["Data Display", "metaGrid", "ZGui.metaGrid(host,items)", (s) => Z.metaGrid(s, [{ label: "Format", value: "FLAC" }, { label: "Rate", value: "48kHz" }, { label: "Channels", value: "2" }, { label: "Depth", value: "24-bit" }], { columns: 2 })],
        ["Data Display", "avatar", "ZGui.avatar({name,status})", (s) => { add(s, Z.avatar({ name: "Jane Doe", size: 40, status: "online" })); add(s, Z.avatar({ name: "Sam", size: 40, status: "busy" })); }],
        ["Data Display", "statistic (trend)", "ZGui.statistic({title,value,prefix,suffix,trend})", (s) => { s.style.display = "flex"; s.style.gap = "10px"; s.style.flexWrap = "wrap"; add(s, Z.statistic({ title: "Active Users", value: 112893, trend: "up", trendValue: "12.4%", kind: "cyan" })); add(s, Z.statistic({ title: "Balance", value: 9280.5, precision: 2, prefix: "$", trend: "down", trendValue: "3.1%" })); }],
        ["Data Display", "statistic.countdown", "ZGui.statistic.countdown({title,deadline,format})", (s) => add(s, Z.statistic.countdown({ title: "Drops in", deadline: Date.now() + 3725000, format: "H:M:S", kind: "magenta" }))],
        ["Data Display", "formatBadge (file-type colors)", "ZGui.formatBadge(fmt)", (s) => { s.style.display = "flex"; s.style.gap = "6px"; s.style.flexWrap = "wrap"; ["WAV", "MP3", "FLAC", "OGG", "M4A", "AIFF", "OPUS", "WMA"].forEach((f) => add(s, Z.formatBadge(f))); }],
        ["Data Display", "statStrip (inventory header)", "ZGui.statStrip(host,items,{draggable})", (s) => { s.style.display = "block"; Z.statStrip(s, [{ label: "TOTAL", value: "6,547", dot: "cyan" }, { label: "MP3", value: "6,345", dot: "magenta" }, { label: "FLAC", value: "142", dot: "green" }, { label: "WAV", value: "60", dot: "orange" }], { draggable: true, onReorder: (o) => toast(o.join(" ")) }); }],
        ["Data Display", "highlight (matched substrings)", "ZGui.highlight(text,query)", (s) => { add(s, Z.highlight("The quick brown fox jumps over the lazy dog", ["quick", "lazy"])); }],
        ["Data Display", "avatarGroup (stacked + N)", "ZGui.avatarGroup({avatars,max})", (s) => add(s, Z.avatarGroup({ max: 4, size: 34, avatars: [{ name: "Alice", status: "online" }, { name: "Bob" }, { name: "Carol", status: "busy" }, { name: "Dave" }, { name: "Eve" }, { name: "Frank" }], onOverflowClick: () => toast("show all") }))],
        ["Data Display", "indicator (corner dot/badge)", "ZGui.indicator(child,{label,dot,color})", (s) => { s.style.display = "flex"; s.style.gap = "18px"; const bell = document.createElement("div"); bell.textContent = "🔔"; bell.style.fontSize = "24px"; add(s, Z.indicator(bell, { label: "9", color: "red" })); const av = Z.avatar ? Z.avatar({ name: "Sam", size: 36 }) : document.createElement("div"); add(s, Z.indicator(av.el || av, { dot: true, color: "green", position: "bottom-end", processing: true })); }],
        ["Data Display", "spoiler (show more/less)", "ZGui.spoiler(host,{maxHeight,showLabel})", (s) => { s.style.display = "block"; Z.spoiler(s, { maxHeight: 48, showLabel: "Show more", hideLabel: "Show less", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris." }); }],
        ["Data Display", "treeTable (hierarchical rows)", "ZGui.treeTable(host,{columns,nodes})", (s) => { s.style.display = "block"; Z.treeTable(s, { selectable: true, expandedKeys: { root: true }, columns: [{ field: "name", header: "Name", expander: true }, { field: "size", header: "Size", width: 80 }, { field: "type", header: "Type", width: 90 }], nodes: [{ key: "root", data: { name: "src", size: "—", type: "folder" }, children: [{ key: "a", data: { name: "main.rs", size: "4 KB", type: "rust" } }, { key: "b", data: { name: "lib", size: "—", type: "folder" }, children: [{ key: "b1", data: { name: "util.rs", size: "2 KB", type: "rust" } }] }] }], onSelect: (n) => toast(n && n.data.name), onToggle: (k, o) => toast(k + " " + o) }); }],
        ["Data Display", "orgChart (hierarchy + connectors)", "ZGui.orgChart(host,{node})", (s) => { s.style.display = "block"; Z.orgChart(s, { selectable: true, node: { key: "ceo", label: "CEO", children: [{ key: "cto", label: "CTO", children: [{ key: "e1", label: "Eng A" }, { key: "e2", label: "Eng B" }] }, { key: "cfo", label: "CFO", children: [{ key: "f1", label: "Finance" }] }] }, onSelect: (n) => toast(n && n.label) }); }],
        ["Data Display", "kanban (drag cards)", "ZGui.kanban(host,{columns,onMove})", (s) => { s.style.display = "block"; Z.kanban(s, { columns: [{ id: "todo", title: "To Do", color: "#ff6b35", cards: [{ id: "1", title: "Port QRCode", tags: [{ label: "feat", kind: "green" }] }, { id: "2", title: "Wire zpdf" }] }, { id: "doing", title: "Doing", color: "#f9f002", cards: [{ id: "3", title: "thumbnailRail", tags: [{ label: "wip", kind: "yellow" }] }] }, { id: "done", title: "Done", color: "#39ff14", cards: [{ id: "4", title: "expose" }] }], onMove: (c, f, t) => toast(`${c}: ${f}→${t}`) }); }],
        ["Data Display", "chat (message bubbles)", "ZGui.chat(host,{messages,onSend})", (s) => { s.style.display = "block"; const box = document.createElement("div"); box.style.cssText = "height:240px;border:1px solid var(--border);border-radius:6px"; s.appendChild(box); const c = Z.chat(box, { input: true, messages: [{ id: "1", text: "Did the thumbnail rail ship?", side: "in", name: "Alice", time: "09:01" }, { id: "2", text: "Yes — ZGui.thumbnailRail, in this batch.", side: "out", time: "09:02", status: "✓✓" }], onSend: (t) => { c.add({ id: Date.now(), text: t, side: "out", time: "now" }); setTimeout(() => c.add({ id: Date.now() + 1, text: "Got it 👍", side: "in", name: "Alice" }), 600); } }); }],
        ["Charts & Meters", "calendarHeatmap (contributions)", "ZGui.calendarHeatmap(host,{values})", (s) => { s.style.display = "block"; const vals = {}; const today = new Date(); for (let i = 0; i < 364; i++) { const d = new Date(today); d.setDate(d.getDate() - i); if (Math.random() > 0.35) vals[d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")] = Math.floor(Math.random() * 12); } Z.calendarHeatmap(s, { values: vals, onCellClick: (d, v) => toast(`${d}: ${v}`) }); }],
        ["Data Display", "eventCalendar (month + agenda)", "ZGui.eventCalendar(host,{events,onDayClick,onEventClick})", (s) => { s.style.display = "block"; const box = document.createElement("div"); box.style.cssText = "height:420px;display:flex"; s.appendChild(box); const today = new Date(); const ds = (off) => { const d = new Date(today); d.setDate(d.getDate() + off); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }; Z.eventCalendar(box, { events: [{ id: "1", title: "Standup", date: ds(0), time: "09:30", color: "#05d9e8" }, { id: "2", title: "Release zgui", date: ds(0), time: "14:00", color: "#ff2a6d" }, { id: "3", title: "Vacation", date: ds(2), allDay: true, color: "#39ff14" }, { id: "4", title: "Demo", date: ds(5), time: "11:00", color: "#f9f002" }, { id: "5", title: "1:1", date: ds(5), time: "15:00", color: "#ff6b35" }, { id: "6", title: "Review", date: ds(5), time: "16:00", color: "#a855f7" }], onDayClick: (d) => toast("add on " + d), onEventClick: (e) => toast(e.title) }); }],
        ["Inputs & Forms", "timePicker (h/m/s columns)", "ZGui.timePicker(host,{value,onChange})", (s) => { s.style.display = "block"; Z.timePicker(s, { value: "14:30:00", onChange: (str) => toast(str) }); }, { pop: true }],
        ["Inputs & Forms", "dateRangePicker (dual-month)", "ZGui.dateRangePicker(host,{value,presets,onChange})", (s) => { s.style.display = "block"; const now = new Date(); const ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; }; Z.dateRangePicker(s, { placeholder: "Start~End", presets: [{ label: "Last 7 days", range: () => [ago(7), now] }, { label: "Last 30 days", range: () => [ago(30), now] }], onChange: (r) => toast(r[0] && r[1] ? "range set" : "...") }); }, { pop: true }],
        ["Inputs & Forms", "emojiPicker (searchable)", "ZGui.emojiPicker(host,{onPick})", (s) => { s.style.display = "block"; Z.emojiPicker(s, { onPick: (e, n) => toast(e + " " + n) }); }],
        ["Selection & Nav", "thumbnailRail (page navigator)", "ZGui.thumbnailRail(host,{items,onSelect})", (s) => { s.style.display = "block"; const box = document.createElement("div"); box.style.cssText = "height:260px;width:120px;border:1px solid var(--border);border-radius:6px"; s.appendChild(box); const svg = (n) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='84' height='110'><rect width='84' height='110' fill='%230a0a14'/><text x='42' y='60' font-size='14' font-family='monospace' text-anchor='middle' fill='%2305d9e8'>${n}</text></svg>`); Z.thumbnailRail(box, { active: 4, items: Array.from({ length: 12 }, (_, i) => ({ src: svg(i + 1), label: i + 1 })), onSelect: (i) => toast("page " + (i + 1)) }); }],
        ["Overlays (triggered)", "hoverCard (rich hover popover)", "ZGui.hoverCard(target,{content,openDelay})", (s) => { const t = btn("Hover me", () => { }); add(s, t); Z.hoverCard(t, { html: "<b style='color:var(--cyan)'>zgui-core</b><br>A shared cyberpunk component library.<br><a href='#' style='color:var(--magenta)'>Docs →</a>", openDelay: 100, closeDelay: 150 }); }],
        ["Data Display", "editable (inline edit)", "ZGui.editable(host,{value,onSubmit})", (s) => { add(s, Z.field({ label: "Track name", control: (() => { const w = document.createElement("span"); Z.editable(w, { value: "Untitled.flac", onSubmit: (v) => toast("renamed → " + v) }); return w; })() })); }],
        ["Data Display", "masonry (shortest-column)", "ZGui.masonry(host,{columns,gap})", (s) => { s.style.display = "block"; const m = Z.masonry(s, { columns: 3, gap: 8 }); [70, 120, 48, 96, 60, 84, 110, 54].forEach((h, i) => { const c = document.createElement("div"); c.style.cssText = `height:${h}px;background:var(--bg-hover);border:1px solid var(--border);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--text-dim);font-size:11px`; c.textContent = i + 1; m.add(c); }); }],
        ["Data Display", "watermark (tiled overlay)", "ZGui.watermark(host,{text,rotate,gap})", (s) => { s.style.display = "block"; const box = document.createElement("div"); box.style.cssText = "position:relative;height:120px;background:var(--bg-panel,#0a0a16);border:1px solid var(--border);border-radius:4px;padding:10px;color:var(--text-muted);font-size:12px;overflow:hidden"; box.textContent = "Protected content area"; s.appendChild(box); Z.watermark(box, { content: ["ZGUI-CORE", "CONFIDENTIAL"], rotate: -22, gap: [120, 80] }); }],
        ["Selection & Nav", "cascader (multi-level)", "ZGui.cascader(host,{options,onChange})", (s) => { Z.cascader(s, { placeholder: "Pick a region…", options: [{ value: "ca", label: "California", children: [{ value: "sf", label: "San Francisco", children: [{ value: "soma", label: "SoMa" }, { value: "mission", label: "Mission" }] }, { value: "la", label: "Los Angeles" }] }, { value: "ny", label: "New York", children: [{ value: "nyc", label: "NYC", children: [{ value: "bk", label: "Brooklyn" }] }] }], onChange: (v) => toast(v.join(" / ")) }); }, { pop: true }],
        ["Overlays (triggered)", "tour (guided spotlight)", "ZGui.tour({steps}).start()", (s) => { const a = btn("Start tour", () => { const t = Z.tour({ steps: [{ target: () => a, title: "Step 1", description: "This button starts the tour.", placement: "bottom" }, { target: () => document.querySelector(".demo-search") || a, title: "Step 2", description: "Filter components here.", placement: "bottom" }, { title: "Done", description: "That's the whole tour.", placement: "center" }], onFinish: () => toast("tour done") }); t.start(); }); add(s, a); }],
        ["Data Display", "badge", "ZGui.badge(text,{kind,fill})", (s) => {
            [["VST3", "red"], ["AU", "cyan"], ["VST2", "magenta"], ["CLAP", "orange"], ["X86_64", "yellow"], ["KVR", "yellow"]].forEach(([t, k]) => add(s, Z.badge(t, { kind: k })));
            add(s, Z.badge("LIVE", { kind: "green", fill: true })); add(s, Z.badge("NEW", { kind: "yellow", fill: true })); add(s, Z.badge("TOP", { kind: "green", fill: true }));
        }],
        ["Data Display", "chip", "ZGui.chip(text,{onClick})", (s) => { add(s, Z.chip("filter: flac", { onClick: () => toast("chip") })); add(s, Z.chip("active", { active: true })); }],
        ["Data Display", "countBadge", "ZGui.countBadge(n)", (s) => add(s, Z.countBadge(7))],
        ["Data Display", "statusPill", "ZGui.statusPill(code)", (s) => { add(s, Z.statusPill(200, { label: "200 OK" })); add(s, Z.statusPill(404)); add(s, Z.statusPill(500)); }],
        ["Data Display", "kbd", "ZGui.kbd('⌘K')", (s) => { add(s, Z.kbd("⌘K")); add(s, Z.kbd(["Ctrl", "C"])); }],
        ["Data Display", "divider", "ZGui.divider({label})", (s) => { s.style.flexDirection = "column"; s.style.alignItems = "stretch"; add(s, Z.divider({ label: "OR" })); }],
        ["Data Display", "timeAgo", "ZGui.timeAgo(when)", (s) => { add(s, Z.timeAgo(Date.now() - 90000)); add(s, Z.timeAgo(Date.now() - 3 * 3600000)); }],
        ["Data Display", "jsonView", "ZGui.jsonView(host,value)", (s) => Z.jsonView(s, { id: 7, name: "demo", tags: ["a", "b"], nested: { ok: true } }, { collapseDepth: 2 })],
        ["Data Display", "xmlView", "ZGui.xmlView(host,xml)", (s) => Z.xmlView(s, "<root><item id=\"1\">a</item><item id=\"2\">b</item></root>", { collapseDepth: 2 })],
        ["Data Display", "tomlView", "ZGui.tomlView(host,toml)", (s) => { s.style.flexDirection = "column"; s.style.alignItems = "stretch"; Z.tomlView(s, "# app config\n[server]\nhost = \"localhost\"\nport = 8080\ntls = true\n\n[paths]\ndata = \"/var/lib\"\nretries = 3"); }],
        ["Data Display", "csvView", "ZGui.csvView(host,csv)", (s) => { s.style.flexDirection = "column"; s.style.alignItems = "stretch"; Z.csvView(s, "name,format,size\nintro.mp3,MP3,3.2M\nmaster.wav,WAV,48M\ntake.flac,FLAC,21M"); }],
        ["Data Display", "markdown", "ZGui.markdown.render(text)", (s) => { s.style.flexDirection = "column"; s.style.alignItems = "stretch"; Z.markdown.render("# Heading\n\nSome **bold** text and a list:\n- one\n- two").forEach((n) => s.appendChild(n)); }],
        ["Data Display", "diffView", "ZGui.diffView.lines(a,b)", (s) => { s.style.flexDirection = "column"; s.style.alignItems = "stretch"; const pre = document.createElement("pre"); pre.style.margin = "0"; pre.style.fontSize = "11px"; Z.diffView.lines("alpha\nbeta\ngamma", "alpha\nBETA\ngamma\ndelta").forEach((l) => { const d = document.createElement("div"); d.textContent = (l.type === "add" ? "+ " : l.type === "del" ? "- " : "  ") + l.text; d.style.color = l.type === "add" ? "var(--green)" : l.type === "del" ? "var(--red)" : "var(--text-muted)"; pre.appendChild(d); }); s.appendChild(pre); }],
        ["Data Display", "codeEditor", "ZGui.codeEditor(host,{value})", (s) => Z.codeEditor(s, { value: "fn main() {\n    println!(\"hi\");\n}" })],

        // Feedback & status
        ["Feedback & Status", "banner", "ZGui.banner(host,{type,message})", (s) => Z.banner(s, { type: "info", title: "Heads up", message: "This is an info banner.", dismissible: true })],
        ["Feedback & Status", "alert", "ZGui.alert({kind,text})", (s) => add(s, Z.alert({ kind: "warning", text: "Heads up — check this.", dismissible: true }))],
        ["Feedback & Status", "emptyState", "ZGui.emptyState(host,{...})", (s) => Z.emptyState(s, { icon: "📭", title: "Nothing here", message: "No items yet.", action: { label: "Add one", onClick: () => toast("add") } })],
        ["Feedback & Status", "skeleton", "ZGui.skeleton(host,{variant,count})", (s) => { s.style.flexDirection = "column"; s.style.alignItems = "stretch"; Z.skeleton(s, { variant: "line", count: 3 }); }],
        ["Feedback & Status", "spinner", "ZGui.spinner({size})", (s) => add(s, Z.spinner({ size: 32 }))],
        ["Feedback & Status", "progress", "ZGui.progress({value})", (s) => { s.style.flexDirection = "column"; s.style.alignItems = "stretch"; add(s, Z.progress({ value: 0.62, label: "Encoding" })); }],
        ["Feedback & Status", "strengthMeter", "ZGui.strengthMeter({level})", (s) => { s.style.flexDirection = "column"; s.style.alignItems = "flex-start"; [1, 2, 3, 4].forEach((l) => add(s, Z.strengthMeter({ level: l }))); }],
        ["Feedback & Status", "toast", "ZGui.toast.show(msg)", (s) => add(s, btn("Show toast", () => toast("Hello from a toast!", "success")))],
        ["Feedback & Status", "toast.progress (top bar)", "ZGui.toast.progress.show()/hide()", (s) => add(s, btn("Top progress 2.5s", () => { Z.toast.progress.show(); setTimeout(() => Z.toast.progress.hide(), 2500); }))],
        ["Feedback & Status", "loadingOverlay", "ZGui.loadingOverlay(host,{})", (s) => { const box = document.createElement("div"); box.className = "demo-relbox"; s.appendChild(box); const ov = Z.loadingOverlay(box, { text: "Working…" }); s.appendChild(btn("Toggle 1.5s", () => { ov.show(); setTimeout(ov.hide, 1500); })); }],

        // Charts & meters
        ["Charts & Meters", "gauge", "ZGui.gauge({value,label})", (s) => add(s, Z.gauge({ value: 65, min: 0, max: 100, label: "CPU" }))],
        ["Charts & Meters", "donut", "ZGui.donut({segments})", (s) => add(s, Z.donut({ segments: [{ value: 5, label: "A" }, { value: 3, label: "B" }, { value: 2, label: "C" }], centerLabel: "50%", centerSub: "used" }))],
        ["Charts & Meters", "sparkline", "ZGui.sparkline(host,data)", (s) => Z.sparkline(s, [3, 5, 2, 8, 6, 9, 4, 7], { type: "line", width: 160, height: 40 })],
        ["Charts & Meters", "statBars", "ZGui.statBars(host,rows)", (s) => { s.style.alignItems = "stretch"; Z.statBars(s, [{ label: "MP3", value: 42 }, { label: "FLAC", value: 30 }, { label: "WAV", value: 18 }]); }],
        ["Charts & Meters", "stackBar (rainbow %)", "ZGui.stackBar({segments})", (s) => { s.style.display = "block"; add(s, Z.stackBar({ segments: [{ label: "AU", value: 28, size: "28 GB", kind: "green" }, { label: "VST3", value: 23.4, size: "23.4 GB", kind: "accent" }, { label: "VST2", value: 21.3, size: "21.3 GB", kind: "cyan" }, { label: "CLAP", value: 0.23, size: "231 MB", kind: "orange" }] })); }],
        ["Charts & Meters", "statStrip", "ZGui.statStrip(host,items)", (s) => Z.statStrip(s, [{ label: "CORES", value: 18 }, { label: "CPU", value: "50%" }, { label: "MEM", value: "6G" }])],
        ["Charts & Meters", "tileGrid (viz boxes)", "ZGui.tileGrid(host,{tiles}) — the boxes that hold each viz", (s) => {
            s.style.display = "block";
            const box = document.createElement("div"); box.style.height = "220px"; s.appendChild(box);
            const animCanvas = (body, draw) => { const cv = document.createElement("canvas"); cv.width = 200; cv.height = 90; cv.style.cssText = "width:100%;height:100%;display:block"; body.appendChild(cv); const ctx = cv.getContext("2d"); let t = 0; setInterval(() => { t += 0.09; try { draw(ctx, cv.width, cv.height, t); } catch (_) { /* */ } }, 60); };
            Z.tileGrid(box, { columns: 2, tiles: [
                { key: "fft", title: "FFT", render: (b) => animCanvas(b, (ctx, w, h, t) => { const f = new Uint8Array(96); for (let i = 0; i < 96; i++) f[i] = Math.max(0, Math.min(255, 255 * (Math.sin(i / 96 * 18 + t) * 0.5 + 0.5) * Math.exp(-i / 96 * 2))); Z.viz.fft(ctx, w, h, f, {}); }) },
                { key: "scope", title: "Oscilloscope", render: (b) => animCanvas(b, (ctx, w, h, t) => { const tm = new Float32Array(180); for (let i = 0; i < 180; i++) tm[i] = Math.sin(i / 180 * Math.PI * 6 + t * 4) * 0.7; Z.viz.oscilloscope(ctx, w, h, tm, { color: "cyan" }); }) },
            ] });
        }],
        ["Charts & Meters", "viz.fft", "ZGui.viz.fft(ctx,w,h,freq)", vizCard((ctx, w, h, t) => {
            const freq = new Uint8Array(128);
            for (let i = 0; i < 128; i++) { const f = i / 128; freq[i] = Math.max(0, Math.min(255, 255 * (Math.sin(f * 20 + t) * 0.5 + 0.5) * Math.exp(-f * 2.2))); }
            Z.viz.fft(ctx, w, h, freq, {});
        })],
        ["Charts & Meters", "viz.oscilloscope", "ZGui.viz.oscilloscope(ctx,w,h,time)", vizCard((ctx, w, h, t) => {
            const time = new Float32Array(256);
            for (let i = 0; i < 256; i++) time[i] = Math.sin(i / 256 * Math.PI * 6 + t * 4) * 0.75 * Math.exp(-Math.abs(i - 128) / 220);
            Z.viz.oscilloscope(ctx, w, h, time, { color: "cyan" });
        })],
        ["Charts & Meters", "viz.spectrogram", "ZGui.viz.spectrogram(opts).draw — 2D scrolling heat", (s) => {
            s.style.display = "block";
            const cv = document.createElement("canvas"); cv.width = 240; cv.height = 96; cv.style.cssText = "width:100%;border-radius:4px;display:block"; s.appendChild(cv);
            const ctx = cv.getContext("2d"), spec = Z.viz.spectrogram({ speed: 2 }), freq = new Uint8Array(128);
            let t = 0;
            setInterval(() => { t += 0.09; for (let i = 0; i < 128; i++) { const f = i / 128; freq[i] = Math.max(0, Math.min(255, 255 * (Math.sin(f * 18 + t) * 0.5 + 0.5) * Math.exp(-f * 2.4))); } spec.draw(ctx, cv.width, cv.height, freq); }, 55);
        }],
        ["Charts & Meters", "viz.waveform", "ZGui.viz.waveform(ctx,w,h,peaks)", vizCard((ctx, w, h, t) => {
            const peaks = [];
            for (let i = 0; i < 120; i++) { const e = Math.exp(-Math.abs(i - 60) / 42), v = e * (0.25 + 0.75 * Math.abs(Math.sin(i / 6 + t))); peaks.push({ min: -v, max: v }); }
            Z.viz.waveform(ctx, w, h, peaks);
        })],
        ["Charts & Meters", "parametricEq (FFT + EQ)", "ZGui.parametricEq({bands}) + setSpectrum", (s) => {
            s.style.display = "block";
            const eq = Z.parametricEq({ bands: [{ type: "lowshelf", freq: 120, gain: 4, q: 0.7 }, { type: "peaking", freq: 1000, gain: -3, q: 1.2 }, { type: "highshelf", freq: 6000, gain: 5, q: 0.7 }], onChange: (i, b) => toast(`band ${i}: ${Math.round(b.freq)}Hz ${b.gain.toFixed(1)}dB`) });
            add(s, eq);
            const data = new Uint8Array(512); let t = 0;
            setInterval(() => { t += 0.1; for (let i = 0; i < 512; i++) { const f = i / 512; data[i] = Math.max(0, Math.min(255, 255 * (Math.sin(f * 22 + t) * 0.5 + 0.5) * Math.exp(-f * 3))); } eq.setSpectrum(data, 48000, 1024); }, 70);
        }],
        ["Charts & Meters", "viz.lissajous", "ZGui.viz.lissajous(ctx,w,h,{n,l,r})", vizCard((ctx, w, h, t) => {
            const n = 256, l = new Float32Array(n), r = new Float32Array(n);
            for (let i = 0; i < n; i++) { l[i] = Math.sin(i / n * Math.PI * 4 + t) * 0.8; r[i] = Math.sin(i / n * Math.PI * 6 + t * 1.2) * 0.8; }
            Z.viz.lissajous(ctx, w, h, { n, l, r });
        })],
        ["Charts & Meters", "viz.waterfall (FFT waterfall)", "ZGui.viz.waterfall(ctx,w,h,hist) — 3D razor", (s) => {
            s.style.display = "block";
            const cv = document.createElement("canvas"); cv.width = 240; cv.height = 110; cv.style.cssText = "width:100%;border-radius:4px;display:block"; s.appendChild(cv);
            const ctx = cv.getContext("2d"), hist = [];
            let t = 0;
            setInterval(() => {
                t += 0.1;
                const frame = [];
                for (let i = 0; i < 64; i++) { const f = i / 64; frame.push(-100 + 100 * (Math.sin(f * 16 + t) * 0.5 + 0.5) * Math.exp(-f * 1.8)); }
                hist.push(frame); if (hist.length > 28) hist.shift();
                Z.viz.waterfall(ctx, cv.width, cv.height, hist, {});
            }, 55);
        }],

        // Cyberpunk FX
        ["Cyberpunk FX", "glitchText", "ZGui.glitchText(text)", (s) => add(s, Z.glitchText("GLITCH", {}))],
        ["Cyberpunk FX", "neonFrame", "ZGui.neonFrame(content,{pulse})", (s) => add(s, Z.neonFrame("NEON", { pulse: true }))],
        ["Cyberpunk FX", "marquee", "ZGui.marquee(host,{text})", (s) => { s.style.display = "block"; const m = document.createElement("div"); m.style.width = "100%"; s.appendChild(m); Z.marquee(m, { text: "BREAKING · zgui-core component showcase · ", speed: 14 }); }],
        ["Cyberpunk FX", "ribbon", "ZGui.ribbon({text,corner})", (s) => { const box = document.createElement("div"); box.className = "demo-relbox"; box.appendChild(Z.ribbon({ text: "NEW", corner: "tr", variant: "magenta" }).el); s.appendChild(box); }],
        ["Cyberpunk FX", "carousel", "ZGui.carousel({slides})", (s) => { s.style.display = "block"; add(s, Z.carousel({ slides: ["<div class='demo-slide'>1</div>", "<div class='demo-slide'>2</div>", "<div class='demo-slide'>3</div>"] })); }],
        ["Cyberpunk FX", "flipCard", "ZGui.flipCard({front,back})", (s) => { const r = Z.flipCard({ front: "<div>FRONT</div>", back: "<div>BACK</div>" }); const n = r.el || r; n.classList.add("demo-flip"); s.appendChild(n); s.appendChild(btn("Flip", () => r.flip())); }],
        ["Cyberpunk FX", "aspectRatio", "ZGui.aspectRatio(content,{ratio})", (s) => { const a = Z.aspectRatio("16:9", { ratio: 16 / 9 }); const n = a.el || a; n.style.width = "180px"; n.style.background = "var(--bg-secondary,rgba(0,229,255,.05))"; add(s, a); }],

        // Theme & settings
        ["Theme & Settings", "colorscheme", "ZGui.colorscheme.buildSwitcher()", (s) => add(s, Z.colorscheme.buildSwitcher((name) => toast("scheme: " + name)))],
        ["Theme & Settings", "fx (CRT toggles)", "ZGui.fx.buildToggles()", (s) => { s.style.display = "block"; add(s, Z.fx.buildToggles({ onChange: (n, on) => toast(`${n}: ${on ? "on" : "off"}`) })); }],
        ["Theme & Settings", "settings", "ZGui.settings.section/row + initSearch", (s) => {
            s.style.display = "block";
            const search = document.createElement("input"); search.id = "demo-set-search"; search.className = "zs-input"; search.type = "search"; search.placeholder = "Search settings…"; search.style.width = "100%"; search.style.marginBottom = "8px";
            const root = document.createElement("div"); root.id = "demo-set-root";
            root.innerHTML =
                Z.settings.section("Audio", Z.settings.row({ title: "Sample rate", desc: "Output device rate", control: Z.settings.toggle ? Z.settings.toggle({ on: true }) : "" }) + Z.settings.row({ title: "Buffer size", desc: "Latency vs CPU" })) +
                Z.settings.section("Display", Z.settings.row({ title: "Theme", desc: "Color scheme" }) + Z.settings.row({ title: "Font size", desc: "Editor text size" }));
            s.appendChild(search); s.appendChild(root);
            Z.settings.initSearch({ input: "#demo-set-search", container: "#demo-set-root" });
        }],
        ["Theme & Settings", "fzfSettings", "ZGui.fzf.settingsPanel(host,{})", (s) => Z.fzf.settingsPanel(s, { reorder: false, onChange: (k, v) => toast(`${k}=${v}`) })],

        // Audio / DAW chrome
        ["Audio / DAW", "keyboard + light-guide", "ZGui.keyboard.create(parent,{guide,guideColor})", (s) => { s.style.display = "block"; Z.keyboard.create(s, { onNoteOn: (n) => toast("note " + n), guideColor: "rainbow", guide: [60, 62, 64, 65, 67, 69, 71, 72] }); }],
        ["Audio / DAW", "fader", "ZGui.fader({value})", (s) => add(s, Z.fader({ value: 0.6, onChange: (v) => toast(v.toFixed(2)) }))],
        ["Audio / DAW", "orb", "ZGui.orb({x,y}) — circular .orb-pad", (s) => { const o = Z.orb({ x: 0.5, y: 0.5, onChange: (x, y) => toast(`${x.toFixed(2)},${y.toFixed(2)}`) }); const n = o.el; n.style.width = "120px"; n.style.height = "120px"; s.appendChild(n); }],
        ["Audio / DAW", "xyPad", "ZGui.xyPad({xLabel,yLabel}) — square 2-param pad", (s) => { const p = Z.xyPad({ x: 0.4, y: 0.6, xLabel: "Cutoff", yLabel: "Reso", onChange: (x, y) => toast(`${x.toFixed(2)},${y.toFixed(2)}`) }); p.pad.style.width = "120px"; add(s, p); }],
        ["Audio / DAW", "morphPad", "ZGui.morphPad({corners}) — 4-corner blender", (s) => { const m = Z.morphPad({ title: "PRESET MORPH", corners: [{ label: "A", name: "Saw" }, { label: "B", name: "Pad" }, { label: "C", name: "Bass" }, { label: "D", name: "Lead" }], onChange: (x, y, w) => toast(`A${w.a.toFixed(2)} B${w.b.toFixed(2)} C${w.c.toFixed(2)} D${w.d.toFixed(2)}`) }); m.el.style.transform = "scale(0.82)"; m.el.style.transformOrigin = "top left"; s.appendChild(m.el); }],
        ["Audio / DAW", "led", "ZGui.led({on,color})", (s) => { add(s, Z.led({ on: true, color: "cyan" })); add(s, Z.led({ on: true, color: "accent" })); add(s, Z.led({ on: false })); }],
        ["Audio / DAW", "meter", "ZGui.meter({value})", (s) => { const m = Z.meter({ value: 0.5 }); add(s, m); let v = 0.5; setInterval(() => { v = Math.max(0, Math.min(1, v + (Math.sin(Date.now() / 400) * 0.25))); m.set(v); }, 90); }],
        ["Audio / DAW", "lcdDisplay (transport readout)", "ZGui.lcdDisplay({value,label})", (s) => { s.style.display = "flex"; s.style.gap = "6px"; add(s, Z.lcdDisplay({ value: "145.00", label: "tempo", kind: "cyan" }).el); add(s, Z.lcdDisplay({ value: "4/4", label: "sig" }).el); add(s, Z.lcdDisplay({ value: "1.1.1.0", label: "position", kind: "magenta" }).el); let t = 1; setInterval(() => { const d = Z.lcdDisplay; }, 1000); }],
        ["Audio / DAW", "padGrid (drum machine)", "ZGui.padGrid(host,{cols,pads,onTrigger})", (s) => { s.style.display = "block"; Z.padGrid(s, { cols: 4, pads: [{ id: 1, label: "KICK", color: "#ff6b35" }, { id: 2, label: "SNARE", color: "#f9f002" }, { id: 3, label: "HAT", color: "#05d9e8" }, { id: 4, label: "CLAP", color: "#ff2a6d" }, { id: 5, label: "TOM", color: "#39ff14" }, { empty: true }, { id: 7, label: "RIDE", color: "#a855f7" }, { id: 8, label: "PERC", color: "#ff6b35" }], onTrigger: (p) => toast(p.label) }); }],
        ["Audio / DAW", "trackHeader (arranger track)", "ZGui.trackHeader({name,db,color,onSolo})", (s) => { s.style.display = "flex"; s.style.flexDirection = "column"; s.style.gap = "4px"; ["Drum Machine #ff6b35 -1.1", "Deep bass #f9f002 -12.8", "Lazer #05d9e8 -4.8"].forEach((spec) => { const [n, c, db] = spec.split(" ").slice(-3); const name = spec.split(" ").slice(0, -2).join(" "); add(s, Z.trackHeader({ name, color: c, db, onSolo: (v) => toast(name + " solo " + v), onMute: (v) => toast(name + " mute " + v), onArm: (v) => toast(name + " arm " + v) })); }); }],
        ["Audio / DAW", "stepSequencer (pattern grid)", "ZGui.stepSequencer(host,{rows,steps,onToggle})", (s) => { s.style.display = "block"; const ss = Z.stepSequencer(s, { steps: 16, rows: [{ label: "Kick", color: "#ff6b35", steps: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] }, { label: "Snare", color: "#f9f002", steps: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0] }, { label: "Hat", color: "#05d9e8", steps: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] }], onToggle: (r, st, on) => toast(`r${r} s${st} ${on}`) }); let p = 0; setInterval(() => { p = (p + 1) % 16; ss.setPlayStep(p); }, 180); }],
        ["Audio / DAW", "pianoRoll (note editor)", "ZGui.pianoRoll(host,{notes,onChange}) — click add · drag move · right-del", (s) => { s.style.display = "block"; const box = document.createElement("div"); box.style.cssText = "max-height:220px;overflow:auto"; s.appendChild(box); const pr = Z.pianoRoll(box, { steps: 24, lowPitch: 55, highPitch: 72, notes: [{ pitch: 60, start: 0, length: 4 }, { pitch: 64, start: 4, length: 4 }, { pitch: 67, start: 8, length: 8 }, { pitch: 72, start: 16, length: 4 }], onChange: (n) => toast(n.length + " notes") }); let p = 0; setInterval(() => { p = (p + 1) % 24; pr.setPlayhead(p); }, 160); }],
        ["Audio / DAW", "channelStrip (mixer channel)", "ZGui.channelStrip({name,db,pan,onFader})", (s) => { s.style.display = "flex"; s.style.gap = "6px"; ["Drums #ff6b35", "Bass #f9f002", "Lead #05d9e8"].forEach((spec) => { const c = spec.split(" ")[1], n = spec.split(" ")[0]; const cs = Z.channelStrip({ name: n, color: c, db: -6, sends: [{ label: "Rev" }, { label: "Dly" }], onFader: (v) => toast(n + " " + v.toFixed(1)) }); add(s, cs); let t = Math.random() * 6; setInterval(() => { t += 0.2; cs.setMeter([-6 + Math.sin(t) * 14, -6 + Math.sin(t * 1.2) * 14]); }, 120); }); }],
        ["Audio / DAW", "timelineRuler (bars/beats)", "ZGui.timelineRuler(host,{bars,onSeek}) — shift-drag loop", (s) => { s.style.display = "block"; const box = document.createElement("div"); box.style.cssText = "overflow-x:auto"; s.appendChild(box); const tr = Z.timelineRuler(box, { bars: 16, pxPerBar: 30, loop: { start: 4, end: 8 }, onSeek: (b) => toast("bar " + (b | 0)), onLoop: (l) => toast(`loop ${l.start | 0}-${l.end | 0}`) }); let p = 0; setInterval(() => { p = (p + 0.1) % 16; tr.setPlayhead(p); }, 120); }],
        ["Audio / DAW", "minimap (arrangement overview)", "ZGui.minimap(host,{tracks,total,onScrub})", (s) => { s.style.display = "block"; const tracks = ["#ff6b35", "#f9f002", "#05d9e8", "#ff2a6d", "#39ff14"].map((color) => ({ color, clips: Array.from({ length: 3 + Math.floor(Math.random() * 4) }, () => { const start = Math.random() * 56; return { start, length: 4 + Math.random() * 12 }; }) })); Z.minimap(s, { tracks, total: 64, view: { start: 8, end: 24 }, onScrub: (v) => toast(`${v.start | 0}-${v.end | 0}`) }); }],
        ["Audio / DAW", "clip (arranger block)", "ZGui.clip({name,color,kind,notes|peaks})", (s) => { s.style.display = "flex"; s.style.gap = "8px"; const peaks = []; for (let i = 0; i < 80; i++) { const v = Math.abs(Math.sin(i / 6)) * (0.3 + 0.7 * Math.random()); peaks.push({ min: -v, max: v }); } add(s, Z.clip({ name: "Drum Loop", color: "#ff6b35", kind: "audio", peaks, width: 150, onSelect: () => toast("audio clip") }).el); add(s, Z.clip({ name: "Bassline", color: "#05d9e8", kind: "midi", notes: [{ pitch: 36, start: 0, length: 2 }, { pitch: 38, start: 2, length: 2 }, { pitch: 40, start: 4, length: 4 }, { pitch: 36, start: 8, length: 2 }], width: 150, selected: true }).el); }],
        ["Audio / DAW", "laneGrid (section overrides)", "ZGui.laneGrid(host,{lanes,sections,blocks,onChange})", (s) => {
            s.style.display = "block";
            const box = document.createElement("div"); box.style.width = "100%"; s.appendChild(box);
            Z.laneGrid(box, {
                lanes: [{ id: "chaos", label: "CHAOS", color: { fill: "rgba(255,42,109,0.35)", stroke: "#ff2a6d" } }, { id: "density", label: "DENSITY", color: { fill: "rgba(249,240,2,0.3)", stroke: "#f9f002" } }, { id: "scatter", label: "SCATTER", color: { fill: "rgba(255,107,53,0.3)", stroke: "#ff6b35" } }],
                sections: [{ label: "INTRO", start: 0, end: 4, sublabel: "1-4" }, { label: "BUILD", start: 4, end: 8, sublabel: "5-8" }, { label: "DROP", start: 8, end: 12, sublabel: "9-12" }],
                blocks: 12, height: 150,
                values: { chaos: { 4: 0.22, 5: 1.0, 6: 0.32 }, density: { 2: 0.5, 3: 0.5, 8: 0.8 }, scatter: { 5: 0.41, 6: 1.0 } },
                onChange: (lane, b, v) => toast(lane == null ? "cleared" : `${lane}[${b}]=${v == null ? "—" : v.toFixed(2)}`),
            });
            const wrap2 = document.createElement("div"); wrap2.style.marginTop = "6px"; s.appendChild(wrap2);
        }],
        ["Audio / DAW", "volumeControl (mute + glow slider)", "ZGui.volumeControl(host,{value,onChange,onMute})", (s) => add(s, Z.volumeControl(s, { value: 72, onChange: (v) => toast("vol " + v), onMute: (m) => toast(m ? "muted" : "unmuted") }))],
        ["Audio / DAW", "ledToggle (label + glowing LED)", "ZGui.ledToggle({label,on,color,onChange})", (s) => { s.style.display = "block"; add(s, Z.ledToggle({ label: "Master FX Bypass", on: true, onChange: (v) => toast("bypass " + v) })); add(s, Z.ledToggle({ label: "Arp Hold", color: "magenta", onChange: (v) => toast("hold " + v) })); }],
        ["Audio / DAW", "paramRow (slider/select + unit)", "ZGui.paramRow({label,type,value,unit,onChange})", (s) => { s.style.display = "block"; add(s, Z.paramRow({ label: "Cutoff", min: 0, max: 20000, step: 10, value: 8200, unit: "Hz", format: (v) => v | 0, onChange: () => { } })); add(s, Z.paramRow({ label: "UI Scale", type: "select", options: [["100", "100%"], ["125", "125%"], ["150", "150%"]], value: "100", onChange: (v) => toast(v) })); }],
        ["Feedback & Status", "resourceMeter (CPU/RAM)", "ZGui.resourceMeter({label,value,warn,hot,kind})", (s) => { s.style.display = "flex"; s.style.gap = "8px"; const cpu = Z.resourceMeter({ label: "CPU", warn: 70, hot: 90 }); const ram = Z.resourceMeter({ label: "RAM", kind: "ram", unit: " MB" }); add(s, cpu); add(s, ram); let t = 0; setInterval(() => { t += 0.1; cpu.set(Math.round(55 + Math.sin(t) * 40)); ram.set(Math.round(820 + Math.sin(t * 0.5) * 60)); }, 200); }],
        ["Audio / DAW", "transport (glow play/pause + loop/shuffle)", "ZGui.transport(host,{onPlay,onLoop,onShuffle,onSeek})", (s) => {
            s.style.display = "block";
            const t = Z.transport(s, { onPlay: () => toast("play"), onPause: () => toast("pause"), onPrev: () => toast("prev"), onNext: () => toast("next"), onLoop: (v) => toast("loop " + v), onShuffle: (v) => toast("shuffle " + v), onSeek: (f) => toast("seek " + (f * 100 | 0) + "%") });
            let p = 0; setInterval(() => { p = (p + 0.005) % 1; t.setTime(p * 215, 215); }, 80);
        }],
        ["Audio / DAW", "waveformPlayer (click=seek · shift-drag=loop)", "ZGui.waveformPlayer({peaks,loop,onSeek,onLoop}) — shift-drag paints region", (s) => {
            s.style.display = "block";
            const peaks = []; for (let i = 0; i < 160; i++) { const e = Math.exp(-Math.abs(i - 80) / 60), v = e * (0.2 + 0.8 * Math.abs(Math.sin(i / 5))); peaks.push({ min: -v, max: v }); }
            const wp = Z.waveformPlayer({ peaks, time: "1:01", loop: { start: 0.3, end: 0.7 }, onSeek: (f) => toast("seek " + (f * 100).toFixed(0) + "%"), onLoop: (l) => toast(`loop ${(l.start * 100) | 0}–${(l.end * 100) | 0}% ${l.enabled ? "on" : "off"}`) });
            add(s, wp);
            const hint = document.createElement("div"); hint.style.cssText = "font-size:10px;color:var(--text-dim);margin-top:4px"; hint.textContent = "shift-drag = paint loop · drag braces = nudge · click right of end = exit"; s.appendChild(hint);
            let p = 0; setInterval(() => { p = (p + 0.01) % 1; wp.setProgress(p); }, 70);
        }],
        ["Audio / DAW", "dbFader (console)", "ZGui.dbFader({value,min,max,ticks})", (s) => { const box = document.createElement("div"); box.style.cssText = "height:180px;display:flex"; box.appendChild(Z.dbFader({ value: -12, min: -48, max: 0, onChange: (v) => toast(v.toFixed(1) + " dB") }).el); s.appendChild(box); }],
        ["Audio / DAW", "peakMeter (dB+LUFS)", "ZGui.peakMeter({db,stereo,lufs})", (s) => { const pm = Z.peakMeter({ stereo: true, lufs: -14 }); add(s, pm); let t = 0; setInterval(() => { t += 0.12; pm.set([-6 + Math.sin(t) * 18, -6 + Math.sin(t * 1.3) * 18]); pm.setLufs(-14 + Math.sin(t * 0.4) * 4); }, 90); }],
        ["Audio / DAW", "keyboardSplit", "ZGui.keyboardSplit({layers})", (s) => { s.style.display = "block"; add(s, Z.keyboardSplit({ layers: [{ name: "Bass", keyLo: 21, keyHi: 47 }, { name: "Lead", keyLo: 48, keyHi: 72 }, { name: "Pad", keyLo: 60, keyHi: 96 }], onChange: (li, p, v) => toast(`L${li + 1} ${p}=${v}`) })); }],
        ["Audio / DAW", "patchbay", "ZGui.jack(parent,{kind,key,label})", (s) => { add(s, Z.jack(s, { kind: "out", key: "o1", label: "OUT" })); add(s, Z.jack(s, { kind: "in", key: "i1", label: "IN" })); }],
        ["Audio / DAW", "envelope (ADSR)", "ZGui.envelope({attack,decay,sustain,release})", (s) => { s.style.display = "block"; add(s, Z.envelope({ attack: 0.15, decay: 0.3, sustain: 0.6, release: 0.5, max: { attack: 1, decay: 1, release: 1 }, onChange: (n, v) => toast(`${n}: ${v.toFixed(2)}`) })); }],
        ["Audio / DAW", "bipolarSlider (Serum mod depth + cursor waterfall)", "ZGui.bipolarSlider(host,{value,onChange}).setMod(live) — drag handle, host feeds the cursor", (s) => { s.style.display = "block"; const defs = [["LFO 1", 0.62, (t) => Math.sin(t) * 0.62], ["Env 2", -0.4, (t) => (Math.sin(t * 0.7) * 0.5 + 0.5) * -0.4], ["Macro 1", 0.3, (t) => 0.3]]; const sliders = defs.map(([lab, v]) => { const w = document.createElement("div"); w.style.marginBottom = "6px"; s.appendChild(w); return Z.bipolarSlider(w, { label: lab, value: v, onChange: (val) => toast(lab + " " + (val > 0 ? "+" : "") + Math.round(val * 100) + "%") }); }); let t = 0; setInterval(() => { t += 0.18; sliders.forEach((sl, i) => sl.setMod(defs[i][2](t))); }, 50); }],
        // ── Novel / experimental (designed, not ported) ──
        ["Novel / Experimental", "commandFlow (command ribbon)", "ZGui.commandFlow(host,{commands,onRerun})", (s) => { s.style.display = "block"; const cf = Z.commandFlow(s, { commands: [{ cmd: "git status", status: 0, ms: 40 }, { cmd: "cargo build", status: 0, ms: 1680, pipes: 0 }, { cmd: "rg TODO | wc -l", status: 0, ms: 220, pipes: 2 }, { cmd: "./deploy.sh", status: 1, ms: 4200 }], onDrill: (c) => toast(c.cmd), onRerun: (c) => toast("↻ " + c.cmd) }); let n = 0; setInterval(() => { n++; cf.push({ cmd: "task-" + n + " run", status: Math.random() > 0.8 ? 1 : 0, ms: 50 + Math.random() * 2000, pipes: Math.floor(Math.random() * 3) }); }, 1500); }],
        ["Novel / Experimental", "regexLens (live highlight)", "ZGui.regexLens(host,{target,pattern})", (s) => { s.style.display = "block"; const tgt = document.createElement("pre"); tgt.style.cssText = "margin:8px 0 0;padding:8px;background:#06060e;border:1px solid var(--border);border-radius:4px;font-size:11px;white-space:pre-wrap"; tgt.textContent = "2026-06-26 ERROR conn refused 10.0.0.5:8080\n2026-06-26 WARN retry 3/5\n2026-06-26 INFO ok 200 in 42ms"; Z.regexLens(s, { target: tgt, pattern: "(\\d+)\\.(\\d+)\\.\\d+\\.\\d+" }); s.appendChild(tgt); }],
        ["Novel / Experimental", "scheduleGrid (visual cron)", "ZGui.scheduleGrid(host,{onChange}).cron()", (s) => { s.style.display = "block"; const out = document.createElement("div"); out.style.cssText = "font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--cyan);margin-top:6px"; const sg = Z.scheduleGrid(s, { onChange: () => { out.textContent = sg.cron() || "(never)"; } }); s.appendChild(out); out.textContent = "(paint cells)"; }],
        ["Novel / Experimental", "pipeGraph (dataflow)", "ZGui.pipeGraph(host,{stages})", (s) => { s.style.display = "block"; Z.pipeGraph(s, { stages: [{ label: "cat", bytes: 524288, rate: 1.5, status: "ok" }, { label: "grep", bytes: 81920, rate: 1.2, status: "ok" }, { label: "sort", bytes: 81920, rate: 0.3, status: "stall" }, { label: "uniq -c", bytes: 4096, status: "ok" }], onSelect: (st) => toast(st.label) }); }],
        ["Novel / Experimental", "euclidWheel (polyrhythm)", "ZGui.euclidWheel(host,{rings})", (s) => { s.style.display = "block"; const ew = Z.euclidWheel(s, { size: 200, rings: [{ steps: 16, pulses: 5, color: "#05d9e8" }, { steps: 12, pulses: 4, color: "#ff2a6d" }, { steps: 8, pulses: 3, color: "#f9f002" }], onChange: () => toast("pattern") }); let t = 0; setInterval(() => { t++; ew.setStep({ 0: t % 16, 1: t % 12, 2: t % 8 }); }, 200); }],
        ["Novel / Experimental", "modCordOverlay (any-control cords)", "ZGui.modCordOverlay(host).register(el,{id,role})", (s) => { s.style.display = "block"; s.style.position = "relative"; s.style.minHeight = "120px"; const ov = Z.modCordOverlay(s, { onConnect: (a, b) => toast(a + "→" + b) }); const mk = (label, role, top, left) => { const d = document.createElement("div"); d.textContent = label; d.style.cssText = `position:absolute;top:${top}px;left:${left}px;padding:4px 8px;background:var(--bg-hover);border:1px solid var(--border);border-radius:4px;font-size:10px`; s.appendChild(d); ov.register(d, { id: label, role }); }; mk("LFO1", "source", 10, 10); mk("LFO2", "source", 50, 10); mk("Cutoff", "target", 10, 180); mk("Pitch", "target", 60, 180); ov.connect("LFO1", "Cutoff"); let t = 0; setInterval(() => { t += 0.05; ov.flow("LFO1", "Cutoff", (Math.sin(t) * 0.5 + 0.5)); }, 50); }],
        ["Novel / Experimental", "morphPath (XY trajectory)", "ZGui.morphPath(host,{onPlay}).play()", (s) => { s.style.display = "block"; const mp = Z.morphPath(s, { size: 180, points: [{ x: 0.1, y: 0.1 }, { x: 0.8, y: 0.3 }, { x: 0.5, y: 0.9 }, { x: 0.2, y: 0.5 }], onPlay: () => { } }); mp.play(3000); }],
        ["Novel / Experimental", "waveformDiff (A/B delta)", "ZGui.waveformDiff(host,{a,b})", (s) => { s.style.display = "block"; const mk = (k) => { const p = []; for (let i = 0; i < 100; i++) { const v = Math.abs(Math.sin(i / 7 + k)) * (0.4 + 0.5 * Math.random()); p.push({ min: -v, max: v }); } return p; }; Z.waveformDiff(s, { a: mk(0), b: mk(0.6), labelA: "before", labelB: "after" }); }],
        ["Novel / Experimental", "confidenceField (AI uncertainty)", "ZGui.confidenceField({value,confidence})", (s) => { s.style.display = "flex"; s.style.flexDirection = "column"; s.style.gap = "10px"; add(s, Z.confidenceField({ label: "Extracted name", value: "Acme Corp", confidence: 0.94, source: "page 2" })); add(s, Z.confidenceField({ label: "Extracted amount", value: "$1,240.00", confidence: 0.41, source: "OCR", onAccept: (v) => toast("accepted " + v) })); }],
        ["Novel / Experimental", "tokenMeter (LLM burn)", "ZGui.tokenMeter({used,budget,costPerK})", (s) => { s.style.display = "flex"; s.style.gap = "8px"; const tm = Z.tokenMeter({ used: 0, budget: 200000, costPerK: 0.015, label: "context" }); add(s, tm); let u = 0; setInterval(() => { u += 3000 + Math.random() * 5000; if (u > 210000) u = 0; tm.set(Math.round(u)); tm.setRate(4200); }, 300); }],
        ["Novel / Experimental", "diffScrubber (history scrub)", "ZGui.diffScrubber(host,{versions})", (s) => { s.style.display = "block"; Z.diffScrubber(s, { versions: [{ label: "v1", text: "fn main() {\n  let x = 1;\n}" }, { label: "v2", text: "fn main() {\n  let x = 2;\n  println!(\"{x}\");\n}" }, { label: "v3", text: "fn main() {\n  let x = 2;\n  let y = x * 2;\n  println!(\"{y}\");\n}" }], onScrub: (i) => toast("v" + (i + 1)) }); }],
        ["Novel / Experimental", "parallelLanes (concurrent tasks)", "ZGui.parallelLanes(host,{lanes}).update(id,patch)", (s) => { s.style.display = "block"; const lanes = Array.from({ length: 6 }, (_, i) => ({ id: i, label: "inst-" + (i + 1), progress: 0, status: "run" })); const pl = Z.parallelLanes(s, { lanes, onSelect: (l) => toast(l.label) }); lanes.forEach((l) => { const v = 0.3 + Math.random() * 1.5; setInterval(() => { l.progress = Math.min(1, l.progress + v * 0.02); pl.update(l.id, { progress: l.progress, status: l.progress >= 1 ? "done" : "run", eta: l.progress >= 1 ? "" : Math.round((1 - l.progress) * 20) + "s" }); }, 100); }); }],
        ["Novel / Experimental", "provenanceTrail (data lineage)", "ZGui.provenanceTrail(host,{hops})", (s) => { s.style.display = "block"; Z.provenanceTrail(s, { hops: [{ label: "sales.csv", kind: "source", detail: "/data/sales.csv · 14,552 rows" }, { label: "parse", kind: "transform", detail: "CSV → records" }, { label: "Q2 only", kind: "filter", detail: "date in [2026-04, 2026-06]" }, { label: "+ regions", kind: "join", detail: "join regions.json on region_id" }, { label: "forecast", kind: "model", detail: "claude-opus-4-8 summary" }, { label: "report", kind: "output", detail: "report.pdf" }], onSelect: (h) => toast(h.label) }); }],
        ["Audio / DAW", "wavetable (scrub frames)", "ZGui.wavetable(host,{frames,position,onScrub})", (s) => { s.style.display = "block"; Z.wavetable(s, { height: 150, onScrub: (p) => toast("pos " + p.toFixed(2)) }); }],
        ["Audio / DAW", "harmonicEditor (additive)", "ZGui.harmonicEditor(host,{count,onChange})", (s) => { s.style.display = "block"; Z.harmonicEditor(s, { count: 16, harmonics: [1, 0, 0.5, 0, 0.33, 0, 0.25, 0, 0.2, 0, 0, 0, 0.1, 0, 0, 0], onChange: () => { } }); }],
        ["Audio / DAW", "filterResponse (cutoff/reso)", "ZGui.filterResponse(host,{type,cutoff,onChange})", (s) => { s.style.display = "block"; Z.filterResponse(s, { type: "lowpass", cutoff: 0.55, resonance: 0.5, onChange: (o) => toast(`${(o.freq) | 0}Hz Q${(0.5 + o.resonance * 11.5).toFixed(1)}`) }); }],
        ["Audio / DAW", "drawbar (organ)", "ZGui.drawbar(host,{values,onChange})", (s) => { s.style.display = "block"; Z.drawbar(s, { height: 120, values: [8, 6, 8, 4, 0, 2, 0, 0, 3], onChange: (i, v) => toast(`bar${i + 1}=${v}`) }); }],
        ["Charts & Meters", "goniometer (stereo scope)", "ZGui.goniometer(host).push(L,R)", (s) => { s.style.display = "block"; const g = Z.goniometer(s, { size: 170 }); let t = 0; setInterval(() => { const L = [], R = [], n = 256; for (let i = 0; i < n; i++) { const ph = t + i * 0.03; L.push(Math.sin(ph) * 0.7); R.push(Math.sin(ph * 1.0 + Math.sin(t * 0.3) * 1.2) * 0.7); } t += 0.4; g.push(L, R); }, 60); }],
        ["Audio / DAW", "lfoShape", "ZGui.lfoShape({shape,rate})", (s) => { s.style.display = "block"; add(s, Z.lfoShape({ shape: 0, rate: 1.2, depth: 1, onChange: (n, v) => toast(`${n}: ${v}`) })); }],
        ["Audio / DAW", "oscShape", "ZGui.oscShape({wave,pw})", (s) => { s.style.display = "block"; add(s, Z.oscShape({ wave: 1, pw: 0.5, onChange: (n, v) => toast(`${n}: ${v}`) })); }],
        ["Audio / DAW", "curveEditor (draw your own)", "ZGui.curveEditor({points})", (s) => { s.style.display = "block"; add(s, Z.curveEditor({ title: "MSEG", points: [{ x: 0, y: 0 }, { x: 0.25, y: 0.95 }, { x: 0.6, y: 0.4 }, { x: 1, y: 0.7 }], onChange: (p) => toast(p.length + " pts") })); }],
        ["Audio / DAW", "geoMorph", "ZGui.geoMorph({order,teeth})", (s) => { s.style.display = "block"; const g = Z.geoMorph({ order: 5, teeth: 0 }); add(s, g); let t = 0; setInterval(() => { t += 0.05; g.set("teeth", Math.sin(t) * 0.5 + 0.5); g.set("order", 3 + Math.floor((Math.sin(t * 0.3) * 0.5 + 0.5) * 9)); }, 130); }],
        ["Audio / DAW", "modSource (drag→knob)", "ZGui.modSource({sources}) + .dropTarget(el,onDrop)", (s) => {
            s.style.display = "block";
            const pal = Z.modSource({ sources: [{ id: 1, label: "Velocity", color: "var(--green)" }, { id: 2, label: "Mod Wheel", color: "var(--cyan)" }, { id: 3, label: "LFO 1", color: "var(--magenta)" }, { id: 4, label: "Aftertouch", color: "var(--accent)" }] });
            add(s, pal);
            const drop = document.createElement("div");
            drop.textContent = "▼ drop a source here";
            drop.style.cssText = "margin-top:8px;padding:14px;text-align:center;border:1px dashed var(--border);border-radius:6px;color:var(--text-muted);font-size:11px";
            s.appendChild(drop);
            Z.modSource.dropTarget(drop, (id) => toast("routed source #" + id));
        }],
        ["Audio / DAW", "chassis (synth module)", "ZGui.chassis(host,{blockWidth})", (s) => {
            // a realistic synth module like zpwr-synth's B1 OSC: chassis + header + a labeled knob
            // cluster (knob/led from the same kit the plugins use).
            const c = Z.chassis(s, { blockWidth: 220 });
            if (c && c.panel) {
                const body = document.createElement("div"); body.style.cssText = "padding:10px";
                const hd = document.createElement("div");
                hd.style.cssText = "display:flex;align-items:center;gap:6px;font-family:'Orbitron',sans-serif;font-size:11px;color:var(--cyan);margin-bottom:10px";
                hd.innerHTML = "<span style='background:var(--bg-hover);padding:1px 5px;border-radius:3px'>B1</span> SYNTH OSC";
                body.appendChild(hd);
                const row = document.createElement("div"); row.style.cssText = "display:flex;gap:14px;align-items:flex-start";
                [["OCTAVE", 0.5], ["X", 0.3], ["Y", 0.7]].forEach(([lbl, v]) => row.appendChild(Z.knob({ value: v, label: lbl, size: 46 }).el));
                body.appendChild(row);
                const row2 = document.createElement("div"); row2.style.cssText = "display:flex;gap:14px;align-items:center;margin-top:10px";
                row2.appendChild(Z.knob({ value: 0.4, label: "DETUNE", size: 46 }).el);
                const col = document.createElement("div"); col.style.cssText = "display:flex;flex-direction:column;gap:6px;margin-left:auto";
                col.appendChild(Z.led({ on: true, color: "cyan" }).el);
                col.appendChild(Z.meter({ value: 0.6 }).el);
                row2.appendChild(col);
                body.appendChild(row2);
                c.panel.appendChild(body);
            }
        }],

        // Overlays (triggered)
        ["Overlays (triggered)", "modal", "ZGui.modal.confirm({...})", (s) => add(s, btn("Confirm dialog", trig(() => Z.modal.confirm({ title: "Delete?", message: "This cannot be undone." }).then((ok) => toast(ok ? "confirmed" : "cancelled")))))],
        ["Overlays (triggered)", "drawer", "ZGui.drawer.create({...})", (s) => { const d = Z.drawer.create({ side: "right", title: "Drawer", content: "Side panel content.", width: 180 }); add(s, d); }],
        ["Overlays (triggered)", "commandPalette", "ZGui.palette.open()", (s) => add(s, btn("Open palette (⌘K)", trig(() => { Z.palette.clear && Z.palette.clear(); Z.palette.register([{ label: "New File", run: () => toast("new file") }, { label: "Open Settings", run: () => toast("settings") }, { label: "Quit", run: () => toast("quit") }]); Z.palette.open(); })))],
        ["Overlays (triggered)", "contextMenu", "ZGui.contextMenu.bind(el,items)", (s) => { const t = document.createElement("div"); t.textContent = "right-click me"; t.style.cssText = "padding:8px 12px;border:1px dashed var(--border);border-radius:4px;cursor:context-menu;color:var(--text-muted)"; s.appendChild(t); Z.contextMenu.bind(t, () => [{ label: "Cut", onClick: () => toast("cut") }, { label: "Copy", onClick: () => toast("copy") }, { label: "Paste", onClick: () => toast("paste") }]); }],
        ["Overlays (triggered)", "helpOverlay", "ZGui.helpOverlay.open(sections)", (s) => add(s, btn("Shortcuts (?)", trig(() => Z.helpOverlay.open([{ title: "General", rows: [{ keys: "⌘K", label: "Command palette" }, { keys: "?", label: "This help" }] }]))))],
        ["Overlays (triggered)", "splash", "ZGui.splash.show({title,subtitle,version})", (s) => add(s, btn("Show splash", trig(() => { Z.splash.show({ title: "ZGUI CORE", subtitle: "Component Library", version: "Loading…" }); setTimeout(() => Z.splash.hide(), 1600); })))],
        ["Overlays (triggered)", "exportDialog", "ZGui.exportDialog.pickImport({})", (s) => add(s, btn("Import…", trig(() => Z.exportDialog.pickImport({ formats: ["json", "csv"] }).then((r) => toast(r ? r.path : "cancelled")))))],

        // Imported widgets — universe sweep (MUI / Ant / PrimeReact / Mantine gaps)
        ["Inputs & Forms", "signaturePad", "ZGui.signaturePad(host,{width,height,onChange})", (s) => Z.signaturePad(s, { width: 300, height: 120 })],
        ["Inputs & Forms", "dialPad", "ZGui.dialPad(host,{onKey,onDial})", (s) => Z.dialPad(s, { onDial: (v) => toast("dial " + (v || "—")) })],
        ["Inputs & Forms", "cronEditor", "ZGui.cronEditor(host,{value,onChange})", (s) => Z.cronEditor(s, { value: "0 9 * * 1" })],
        ["Inputs & Forms", "gradientPicker", "ZGui.gradientPicker(host,{stops,type,onChange})", (s) => Z.gradientPicker(s, {})],
        ["Inputs & Forms", "imageCropper", "ZGui.imageCropper(host,{src,aspect,onChange})", (s) => Z.imageCropper(s, { src: "../webui/img/chassis.png", width: 260 })],
        ["Data Display", "imageCompare", "ZGui.imageCompare(host,{before,after,onChange})", (s) => Z.imageCompare(s, { before: "../webui/img/keyboard.png", after: "../webui/img/chassis.png", width: 300 })],
        ["Novel / Experimental", "joystick", "ZGui.joystick(host,{size,sticky,onChange})", (s) => Z.joystick(s, { size: 120 })],
        ["Feedback & Status", "result", "ZGui.result(host,{status,title,subtitle,actions})", (s) => Z.result(s, { status: "success", title: "Deployed", subtitle: "Build #1042 shipped.", actions: [{ label: "View", primary: true, onClick: () => toast("view") }, { label: "Undo", onClick: () => toast("undo") }] })],

        ["Selection & Nav", "launcher", "ZGui.launcher(host,{sigil,items,onOpen,onAction})", (s) => {
            s.style.cssText = "display:block;padding:0";
            Z.launcher(s, {
                sigil: "zgo", placeholder: "Apps · a sum · the web · 'find …'",
                items: [
                    { icon: "🔎", title: "Google", subtitle: "google", kind: "search" },
                    { icon: "🔎", title: "DuckDuckGo", subtitle: "ddg", kind: "search" },
                    { icon: "🔎", title: "Amazon", subtitle: "amazon", kind: "search" },
                    { icon: "🔎", title: "Wikipedia", subtitle: "wiki", kind: "search" },
                    { icon: "🔎", title: "YouTube", subtitle: "youtube", kind: "search" },
                    { icon: "🔎", title: "GitHub", subtitle: "github", kind: "search" },
                ],
                onOpen: (it) => toast("open " + it.title), onAction: (it) => toast("actions: " + it.title),
            });
        }],

        // App-shell: two-pane preferences window (icon+title+subtitle sidebar nav + detail pane)
        ["Selection & Nav", "prefsShell", "ZGui.prefsShell(host,{logo,title,items:[{id,icon,name,sub,render}]})", (s) => {
            s.style.cssText = "display:block;height:300px;padding:0;overflow:hidden";
            const scope = (p, paths) => { p.appendChild(Z.prefsShell.section("Search scope")); paths.forEach((x) => { const r = document.createElement("div"); r.textContent = "📁  " + x; r.style.cssText = "padding:8px 12px;border:1px solid var(--border);border-radius:4px;margin-bottom:6px;font:12px 'Share Tech Mono',monospace;color:var(--text)"; p.appendChild(r); }); };
            const mk = (icon, title, desc, paths) => (p) => { p.appendChild(Z.prefsShell.paneHead(icon, title, desc)); if (paths) scope(p, paths); };
            Z.prefsShell(s, {
                logo: "zgui", title: "Preferences",
                items: [
                    { id: "results", icon: "🎩", name: "Default Results", sub: "Scope & index", render: mk("🎩", "Default Results", "Apps & files from a direct filesystem scan.", ["/Applications", "/System/Applications", "~/Applications"]) },
                    { id: "web", icon: "🔎", name: "Web Search", sub: "Built-in & custom", render: mk("🔎", "Web Search", "Keyword searches.") },
                    { id: "clip", icon: "📋", name: "Clipboard", sub: "History & merge", render: mk("📋", "Clipboard History", "Recent copies.") },
                    { id: "theme", icon: "🎨", name: "Appearance", sub: "Themes", render: mk("🎨", "Appearance", "Pick a colorscheme.") },
                ],
            });
        }],
    ];

    // ── render ────────────────────────────────────────────────────────────────
    const wrap = document.createElement("div");
    wrap.className = "demo-wrap";
    app.appendChild(wrap);

    if (Z.header && Z.header.build) {
        const h = Z.header.build({ glyph: "▦", title: "zgui-core", subtitle: "component showcase" });
        const node = h && (h.el || h);
        if (node && node.nodeType === 1) wrap.appendChild(node);
    }
    const toolbar = document.createElement("div");
    toolbar.className = "demo-toolbar";
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Filter components…";
    const count = document.createElement("span");
    count.className = "demo-count";
    // light/dark toggle — colorscheme.setLight() flips data-theme and re-applies the active scheme
    // (each scheme carries a lightVars map). Pair it with the colorscheme card to see every scheme in
    // both modes.
    let lightOn = document.documentElement.getAttribute("data-theme") === "light";
    const themeBtn = btn(lightOn ? "☀ Light" : "🌙 Dark", () => {
        lightOn = !lightOn;
        if (Z.colorscheme && Z.colorscheme.setLight) Z.colorscheme.setLight(lightOn);
        themeBtn.textContent = lightOn ? "☀ Light" : "🌙 Dark";
    });
    toolbar.appendChild(search);
    toolbar.appendChild(themeBtn);
    toolbar.appendChild(count);
    wrap.appendChild(toolbar);
    // apply the saved/default scheme so the toggle (and the colorscheme card) have an active theme.
    if (Z.colorscheme && Z.colorscheme.load) Z.colorscheme.load();
    if (Z.fx && Z.fx.load) Z.fx.load();   // re-apply persisted CRT/glow/anim effect prefs

    const cards = [];
    function section(title) {
        const h = document.createElement("div"); h.className = "demo-cat"; h.textContent = title; wrap.appendChild(h);
        const grid = document.createElement("div"); grid.className = "demo-grid"; wrap.appendChild(grid);
        return grid;
    }
    function makeCard(grid, name, api, run, opts) {
        const card = document.createElement("div");
        card.className = "demo-card" + (opts && opts.pop ? " demo-pop" : "");
        card.innerHTML = `<div class="demo-card-head"><span class="demo-card-name">${name}</span><span class="demo-card-api">${api}</span></div>`;
        const stage = document.createElement("div"); stage.className = "demo-stage"; card.appendChild(stage);
        if (run) {
            try { run(stage); if (!stage.childNodes.length) stage.innerHTML = '<span class="demo-muted">(rendered — no visible output)</span>'; }
            catch (err) { stage.innerHTML = `<span class="demo-error">⚠ ${String(err && err.message || err)}</span>`; }
        } else {
            stage.innerHTML = '<span class="demo-muted">programmatic / low-level — see README</span>';
        }
        grid.appendChild(card);
        cards.push({ card, nameEl: card.querySelector(".demo-card-name"), display: name });
    }

    const order = [];
    DEMOS.forEach(([cat]) => { if (!order.includes(cat)) order.push(cat); });
    order.forEach((cat) => {
        const grid = section(cat);
        DEMOS.filter((d) => d[0] === cat).forEach(([, name, api, run, opts]) => makeCard(grid, name, api, run, opts));
    });

    // Full-library coverage: list every remaining export so nothing is hidden. These are mostly
    // low-level helpers / engines (drag, fzf, i18n, sort-state, …) with no standalone visual.
    const covered = new Set(DEMOS.map((d) => d[1]).concat(["switch", "escapeHtml"]));
    const rest = Object.keys(Z).filter((k) => !covered.has(k)).sort();
    if (rest.length) {
        const grid = section(`More / low-level helpers (${rest.length})`);
        rest.forEach((k) => makeCard(grid, k, "ZGui." + k, null));
    }

    // ── fuzzy filter with highlight (ZGui.fzf — same engine as the command palette) ──
    const fz = Z.fzf;
    function applyFilter() {
        const q = (search.value || "").trim();
        let visible = 0;
        cards.forEach(({ card, nameEl, display }) => {
            let show = true, html = display;
            if (q) {
                if (fz && fz.fzfMatch) {
                    const m = fz.fzfMatch(q, display);
                    if (m) { html = fz.highlightWithIndices(display, m.indices); } else { show = false; }
                } else {
                    show = display.toLowerCase().includes(q.toLowerCase());
                }
            }
            if (nameEl) nameEl.innerHTML = html;
            card.style.display = show ? "" : "none";
            if (show) visible++;
        });
        document.querySelectorAll(".demo-cat").forEach((h) => {
            const g = h.nextElementSibling;
            const any = g && [...g.children].some((c) => c.style.display !== "none");
            h.style.display = any ? "" : "none";
            if (g) g.style.display = any ? "" : "none";
        });
        count.textContent = `${visible} / ${cards.length} components`;
    }
    search.addEventListener("input", applyFilter);
    applyFilter();
})();
