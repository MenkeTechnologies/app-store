// zgui-core/upload.js — a file picker / dropzone with a managed file list: each item shows a name,
// a per-item progress bar and status (uploading/done/error) plus preview & remove actions. Ported
// behavior from Ant Design's <Upload> (fileList[{uid,name,status,percent,url}], listType, multiple,
// accept, beforeUpload, onChange). The consumer drives real upload progress via setProgress/setStatus
// (no network here). window.ZGui.upload.
//   ZGui.upload(container, { listType:'text'|'picture', multiple, accept, buttonText:'Upload',
//       beforeUpload(file), onChange({file,fileList}), onRemove(file), onPreview(file) }) ->
//       { el, getFileList(), add(file), setProgress(uid,pct), setStatus(uid,status), remove(uid) }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    let _uid = 0;
    function upload(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        const fileList = [];

        const root = document.createElement("div"); root.className = "zg-upload zg-upload-" + (opts.listType || "text");
        const drop = document.createElement("div"); drop.className = "zg-upload-drop";
        drop.innerHTML = `<span class="zg-upload-plus">⬆</span><span>${esc(opts.buttonText || "Click or drag files to upload")}</span>`;
        const input = document.createElement("input"); input.type = "file"; input.className = "zg-upload-input"; input.hidden = true;
        if (opts.multiple) input.multiple = true; if (opts.accept) input.accept = opts.accept;
        const listEl = document.createElement("div"); listEl.className = "zg-upload-list";
        root.appendChild(drop); root.appendChild(input); root.appendChild(listEl); host.appendChild(root);

        function emit(file) { if (typeof opts.onChange === "function") opts.onChange({ file, fileList: fileList.slice() }); }
        function renderItem(item) {
            const el = document.createElement("div"); el.className = "zg-upload-item status-" + item.status; el.dataset.uid = item.uid;
            const thumb = (opts.listType === "picture" && item.url) ? `<img class="zg-upload-thumb" src="${esc(item.url)}" alt="">` : `<span class="zg-upload-icon">▦</span>`;
            el.innerHTML = `${thumb}<span class="zg-upload-name" title="${esc(item.name)}">${esc(item.name)}</span>`
                + `<span class="zg-upload-actions">${item.url ? '<button class="zg-upload-preview" title="Preview">👁</button>' : ""}<button class="zg-upload-remove" title="Remove">✕</button></span>`
                + `<div class="zg-upload-bar"><div class="zg-upload-bar-fill" style="width:${item.percent || 0}%"></div></div>`;
            el.querySelector(".zg-upload-remove").addEventListener("click", () => remove(item.uid));
            const pv = el.querySelector(".zg-upload-preview"); if (pv) pv.addEventListener("click", () => { if (typeof opts.onPreview === "function") opts.onPreview(item); else if (item.url && window.ZGui.image) window.ZGui.image.preview(item.url); });
            return el;
        }
        function rerender() { listEl.innerHTML = ""; fileList.forEach((it) => listEl.appendChild(renderItem(it))); }
        function add(file) {
            if (typeof opts.beforeUpload === "function" && opts.beforeUpload(file) === false) return null;
            const item = { uid: "u" + (++_uid), name: file.name || ("file-" + _uid), status: "uploading", percent: 0, url: file.url || null, raw: file };
            fileList.push(item); rerender(); emit(item); return item;
        }
        function find(uid) { return fileList.find((f) => f.uid === uid); }
        function setProgress(uid, pct) { const it = find(uid); if (!it) return; it.percent = Math.max(0, Math.min(100, pct)); const el = listEl.querySelector(`[data-uid="${uid}"] .zg-upload-bar-fill`); if (el) el.style.width = it.percent + "%"; }
        function setStatus(uid, status) { const it = find(uid); if (!it) return; it.status = status; const el = listEl.querySelector(`[data-uid="${uid}"]`); if (el) el.className = "zg-upload-item status-" + status; emit(it); }
        function remove(uid) { const i = fileList.findIndex((f) => f.uid === uid); if (i < 0) return; const [it] = fileList.splice(i, 1); rerender(); if (typeof opts.onRemove === "function") opts.onRemove(it); emit(it); }

        drop.addEventListener("click", () => input.click());
        input.addEventListener("change", () => { Array.from(input.files).forEach(add); input.value = ""; });
        drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("dragover"); });
        drop.addEventListener("dragleave", () => drop.classList.remove("dragover"));
        drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("dragover"); Array.from(e.dataTransfer.files).forEach(add); });

        return { el: root, getFileList: () => fileList.slice(), add, setProgress, setStatus, remove };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.upload = upload;
})();
