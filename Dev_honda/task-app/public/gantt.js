requireAuth();

const projectId = getQueryParam("project_id") || getProjectId();
const ganttEl = document.getElementById("gantt");

if (!projectId) {
  ganttEl.textContent = "プロジェクトを選択してください";
} else {
  saveProjectId(projectId);
}
updateProjectLinks(projectId);

const parseDate = (value) => (value ? new Date(value) : null);
const fmtDate = (date) => date.toISOString().slice(0, 10);
const daysBetween = (start, end) =>
  Math.max(0, Math.round((end - start) / 86400000));

const renderGantt = (items) => {
  if (!items.length) {
    ganttEl.textContent = "スケジュールがありません";
    return;
  }

  const normalized = items.map((item) => {
    const start = parseDate(item.planned_start) || parseDate(item.planned_end) || new Date();
    const end = parseDate(item.planned_end) || start;
    return { ...item, start, end };
  });

  const minStart = new Date(Math.min(...normalized.map((i) => i.start.getTime())));
  const maxEnd = new Date(Math.max(...normalized.map((i) => i.end.getTime())));
  const rangeDays = Math.max(1, daysBetween(minStart, maxEnd) + 1);

  ganttEl.innerHTML = "";

  normalized.forEach((item) => {
    const row = document.createElement("div");
    row.className = "gantt-row";

    const label = document.createElement("div");
    label.className = "gantt-label";
    label.textContent = item.title;

    const lane = document.createElement("div");
    lane.className = "gantt-lane";

    const leftDays = daysBetween(minStart, item.start);
    const durationDays = Math.max(1, daysBetween(item.start, item.end) + 1);
    const leftPct = (leftDays / rangeDays) * 100;
    const widthPct = (durationDays / rangeDays) * 100;

    const bar = document.createElement("div");
    bar.className = "gantt-bar";
    bar.style.left = `${leftPct}%`;
    bar.style.width = `${widthPct}%`;
    bar.textContent = `${fmtDate(item.start)} → ${fmtDate(item.end)}`;

    const sliderWrap = document.createElement("div");
    sliderWrap.className = "gantt-slider";
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = String(Math.max(1, rangeDays + 14));
    slider.value = String(durationDays - 1);
    const value = document.createElement("span");
    value.textContent = `期限: ${fmtDate(item.end)}`;

    slider.addEventListener("input", () => {
      const newEnd = new Date(item.start.getTime() + Number(slider.value) * 86400000);
      value.textContent = `期限: ${fmtDate(newEnd)}`;
    });

    slider.addEventListener("change", async () => {
      const newEnd = new Date(item.start.getTime() + Number(slider.value) * 86400000);
      const res = await apiFetch(`/api/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ planned_end: newEnd.toISOString() })
      });
      if (!res || !res.ok) {
        alert("期限更新に失敗しました");
        return;
      }
      loadGantt();
    });

    sliderWrap.appendChild(slider);
    sliderWrap.appendChild(value);

    lane.appendChild(bar);
    row.appendChild(label);
    row.appendChild(lane);
    row.appendChild(sliderWrap);
    ganttEl.appendChild(row);
  });
};

const loadGantt = async () => {
  if (!projectId) return;
  const res = await apiFetch(`/api/projects/${projectId}/gantt`);
  if (!res || !res.ok) return;
  const items = await res.json();
  renderGantt(items);
};

loadGantt();
