requireAuth();

const projectId = getQueryParam("project_id") || getProjectId();
const ticketList = document.getElementById("ticket-list");
const taskList = document.getElementById("task-list");
const ticketSelect = document.getElementById("ticket-select");
const ticketForm = document.getElementById("ticket-form");
const taskForm = document.getElementById("task-form");

if (!projectId) {
  ticketList.innerHTML = "<li>プロジェクトを選択してください</li>";
} else {
  saveProjectId(projectId);
}
updateProjectLinks(projectId);

const createItemRow = (item, onDelete, onToggle) => {
  const li = document.createElement("li");
  li.className = "list-item";
  const left = document.createElement("div");
  left.className = "item-main";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = item.status === "done";
  checkbox.addEventListener("change", () => onToggle(item, checkbox.checked));
  const title = document.createElement("span");
  title.textContent = item.title;
  if (item.status === "done") title.classList.add("done");
  left.appendChild(checkbox);
  left.appendChild(title);
  const del = document.createElement("button");
  del.textContent = "削除";
  del.addEventListener("click", () => onDelete(item.id));
  li.appendChild(left);
  li.appendChild(del);
  return li;
};

const loadItems = async () => {
  if (!projectId) return;
  const res = await apiFetch(`/api/projects/${projectId}/items`);
  if (!res || !res.ok) return;
  const items = await res.json();
  const tickets = items.filter((item) => item.kind === "ticket");
  const tasks = items.filter((item) => item.kind === "task");

  ticketList.innerHTML = "";
  ticketSelect.innerHTML = "";
  tickets.forEach((ticket) => {
    const option = document.createElement("option");
    option.value = ticket.id;
    option.textContent = ticket.title;
    ticketSelect.appendChild(option);
    ticketList.appendChild(
      createItemRow(ticket, handleDelete, handleToggle)
    );
  });
  if (!tickets.length) {
    ticketList.innerHTML = "<li>課題がありません</li>";
  }

  taskList.innerHTML = "";
  tasks.forEach((task) => {
    taskList.appendChild(createItemRow(task, handleDelete, handleToggle));
  });
  if (!tasks.length) {
    taskList.innerHTML = "<li>子課題がありません</li>";
  }
};

const handleDelete = async (id) => {
  const res = await apiFetch(`/api/items/${id}`, { method: "DELETE" });
  if (!res || !res.ok) {
    alert("削除に失敗しました");
    return;
  }
  loadItems();
};

const handleToggle = async (item, done) => {
  const status = done ? "done" : "open";
  const res = await apiFetch(`/api/items/${item.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
  if (!res || !res.ok) {
    alert("更新に失敗しました");
    return;
  }
  loadItems();
};

ticketForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = ticketForm.elements.title.value.trim();
  if (!title) return;
  const res = await apiFetch(`/api/projects/${projectId}/items`, {
    method: "POST",
    body: JSON.stringify({ kind: "ticket", title })
  });
  if (!res || !res.ok) {
    alert("追加に失敗しました");
    return;
  }
  ticketForm.reset();
  loadItems();
});

taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const parentId = Number(taskForm.elements.parent_id.value);
  const title = taskForm.elements.title.value.trim();
  const plannedMinutes = Number(taskForm.elements.planned_minutes.value || 0);
  const plannedStart = taskForm.elements.planned_start.value || null;
  const plannedEnd = taskForm.elements.planned_end.value || null;
  if (!parentId || !title) return;
  const res = await apiFetch(`/api/projects/${projectId}/items`, {
    method: "POST",
    body: JSON.stringify({
      kind: "task",
      parent_id: parentId,
      title,
      planned_minutes: plannedMinutes,
      planned_start: plannedStart ? new Date(plannedStart).toISOString() : null,
      planned_end: plannedEnd ? new Date(plannedEnd).toISOString() : null
    })
  });
  if (!res || !res.ok) {
    alert("追加に失敗しました");
    return;
  }
  taskForm.reset();
  loadItems();
});

loadItems();
