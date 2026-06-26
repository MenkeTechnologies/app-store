// zgui-core/event-calendar.js — a full event calendar: a month grid showing events per day (colored
// chips, "+N more"), plus an agenda list view. Prev/next/Today nav, click a day to add, click an event
// to open. Distinct from ZGui.calendar (a date picker) — this is the Thunderbird/Google-Calendar month
// view. window.ZGui.eventCalendar.
//   ZGui.eventCalendar(container, { events:[{id,title,date:'YYYY-MM-DD',color,time,allDay}], date:Date,
//       view:'month'|'agenda', maxPerDay:3, weekStart:0, onDayClick(dateStr), onEventClick(ev),
//       onNav(date), onChangeView(v) }) -> { el, set(events), goTo(date), today(), setView(v), get() }
(function () {
    "use strict";
    const esc = window.escapeHtml || ((s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; });
    const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    function d2(n) { return String(n).padStart(2, "0"); }
    function ymd(d) { return d.getFullYear() + "-" + d2(d.getMonth() + 1) + "-" + d2(d.getDate()); }
    function todayStr() { const d = new Date(); return ymd(d); }

    function eventCalendar(container, opts) {
        const host = typeof container === "string" ? document.querySelector(container) : container;
        if (!host) return null;
        opts = opts || {};
        let events = (opts.events || []).slice();
        let view = opts.view || "month";
        const maxPerDay = opts.maxPerDay || 3;
        const ws = opts.weekStart || 0;
        let cursor = opts.date ? new Date(opts.date) : new Date();
        cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1);

        const root = document.createElement("div"); root.className = "zg-evcal";
        host.appendChild(root);

        function byDay(dateStr) { return events.filter((e) => e.date === dateStr).sort((a, b) => (a.allDay ? -1 : 1) - (b.allDay ? -1 : 1) || String(a.time || "").localeCompare(String(b.time || ""))); }
        function header() {
            return `<div class="zg-evcal-head">`
                + `<div class="zg-evcal-nav"><button data-nav="prev" title="Previous">‹</button><button data-nav="today">Today</button><button data-nav="next" title="Next">›</button></div>`
                + `<div class="zg-evcal-title">${view === "agenda" ? "Agenda" : MON[cursor.getMonth()] + " " + cursor.getFullYear()}</div>`
                + `<div class="zg-evcal-views"><button data-view="month"${view === "month" ? ' class="on"' : ""}>Month</button><button data-view="agenda"${view === "agenda" ? ' class="on"' : ""}>Agenda</button></div></div>`;
        }
        function chip(e) { return `<div class="zg-evcal-chip${e.allDay ? " allday" : ""}" data-ev="${esc(e.id)}" style="--zg-ev-col:${e.color || "#05d9e8"}" title="${esc(e.title)}">${e.time && !e.allDay ? `<span class="zg-evcal-time">${esc(e.time)}</span> ` : ""}${esc(e.title)}</div>`; }
        function renderMonth() {
            const y = cursor.getFullYear(), m = cursor.getMonth();
            const first = new Date(y, m, 1), startDow = (first.getDay() - ws + 7) % 7;
            const gridStart = new Date(y, m, 1 - startDow);
            const tStr = todayStr();
            let cells = "";
            for (let i = 0; i < 42; i++) {
                const d = new Date(gridStart); d.setDate(gridStart.getDate() + i);
                const ds = ymd(d), inMonth = d.getMonth() === m, evs = byDay(ds);
                const shown = evs.slice(0, maxPerDay), more = evs.length - shown.length;
                cells += `<div class="zg-evcal-cell${inMonth ? "" : " other"}${ds === tStr ? " today" : ""}" data-day="${ds}">`
                    + `<div class="zg-evcal-daynum">${d.getDate()}</div>`
                    + shown.map(chip).join("") + (more > 0 ? `<div class="zg-evcal-more">+${more} more</div>` : "") + "</div>";
            }
            const dowRow = DOW.map((_, i) => `<div class="zg-evcal-dow">${DOW[(i + ws) % 7]}</div>`).join("");
            return `<div class="zg-evcal-dows">${dowRow}</div><div class="zg-evcal-grid">${cells}</div>`;
        }
        function renderAgenda() {
            const upcoming = events.slice().sort((a, b) => a.date.localeCompare(b.date) || String(a.time || "").localeCompare(String(b.time || "")));
            if (!upcoming.length) return '<div class="zg-evcal-empty">No events</div>';
            let html = '<div class="zg-evcal-agenda">', lastDate = "";
            upcoming.forEach((e) => {
                if (e.date !== lastDate) { lastDate = e.date; const d = new Date(e.date + "T00:00:00"); html += `<div class="zg-evcal-agday">${DOW[d.getDay()]} ${MON[d.getMonth()].slice(0, 3)} ${d.getDate()}</div>`; }
                html += `<div class="zg-evcal-agrow" data-ev="${esc(e.id)}"><span class="zg-evcal-agdot" style="background:${e.color || "#05d9e8"}"></span><span class="zg-evcal-agtime">${esc(e.allDay ? "all day" : (e.time || ""))}</span><span class="zg-evcal-agtitle">${esc(e.title)}</span></div>`;
            });
            return html + "</div>";
        }
        function render() { root.innerHTML = header() + (view === "agenda" ? renderAgenda() : renderMonth()); }

        root.addEventListener("click", (e) => {
            const nav = e.target.closest("[data-nav]");
            if (nav) { const n = nav.dataset.nav; if (n === "prev") cursor.setMonth(cursor.getMonth() - 1); else if (n === "next") cursor.setMonth(cursor.getMonth() + 1); else cursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1); render(); if (typeof opts.onNav === "function") opts.onNav(new Date(cursor)); return; }
            const vw = e.target.closest("[data-view]"); if (vw) { view = vw.dataset.view; render(); if (typeof opts.onChangeView === "function") opts.onChangeView(view); return; }
            const ev = e.target.closest("[data-ev]"); if (ev) { e.stopPropagation(); const found = events.find((x) => String(x.id) === ev.dataset.ev); if (found && typeof opts.onEventClick === "function") opts.onEventClick(found); return; }
            const day = e.target.closest("[data-day]"); if (day && typeof opts.onDayClick === "function") opts.onDayClick(day.dataset.day);
        });

        render();
        return {
            el: root,
            set(ev) { events = (ev || []).slice(); render(); },
            goTo(date) { const d = new Date(date); cursor = new Date(d.getFullYear(), d.getMonth(), 1); render(); },
            today() { cursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1); render(); },
            setView(v) { view = v; render(); },
            get() { return events.slice(); },
        };
    }
    window.ZGui = window.ZGui || {};
    window.ZGui.eventCalendar = eventCalendar;
})();
