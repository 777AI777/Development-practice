const storageKey = "orbit_tasks_v1";

const form = document.querySelector("#taskForm");
const list = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const submitBtn = document.querySelector("#submitBtn");
const cancelEditBtn = document.querySelector("#cancelEditBtn");
const resetBtn = document.querySelector("#resetBtn");
const searchInput = document.querySelector("#search");
const filterSelect = document.querySelector("#filter");
const sortSelect = document.querySelector("#sort");
const editIdInput = document.querySelector("#editId");

// Reason: Keep data local to avoid server dependency and meet "ログイン機能なし".
const loadTasks = () => {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Failed to parse tasks", error);
    return [];
  }
};

const saveTasks = (tasks) => {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
};

const state = {
  tasks: loadTasks(),
};

const formatDateTime = (value) => {
  if (!value) return "未設定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未設定";
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const sanitizeText = (value) => value.replace(/[<>]/g, "");

const normalizeUrl = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.toString();
  } catch (error) {
    return "";
  }
};

const resetForm = () => {
  form.reset();
  editIdInput.value = "";
  submitBtn.textContent = "追加する";
  cancelEditBtn.style.display = "none";
};

const upsertTask = (data) => {
  const now = new Date().toISOString();
  if (data.id) {
    state.tasks = state.tasks.map((task) =>
      task.id === data.id ? { ...task, ...data, updatedAt: now } : task
    );
  } else {
    state.tasks = [
      {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        done: false,
      },
      ...state.tasks,
    ];
  }
  saveTasks(state.tasks);
  render();
  resetForm();
};

const removeTask = (id) => {
  // Reason: Protect users from accidental deletes in a no-login environment.
  const ok = window.confirm("このタスクを削除しますか？");
  if (!ok) return;
  state.tasks = state.tasks.filter((task) => task.id !== id);
  saveTasks(state.tasks);
  render();
};

const toggleDone = (id) => {
  state.tasks = state.tasks.map((task) =>
    task.id === id ? { ...task, done: !task.done } : task
  );
  saveTasks(state.tasks);
  render();
};

const sortTasks = (tasks, sort) => {
  const copy = [...tasks];
  if (sort === "time") {
    return copy.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }
  if (sort === "assignee") {
    return copy.sort((a, b) => (a.assignee || "").localeCompare(b.assignee || ""));
  }
  return copy.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
};

const matchesSearch = (task, query) => {
  if (!query) return true;
  const target = `${task.title} ${task.assignee} ${task.location}`.toLowerCase();
  return target.includes(query);
};

const render = () => {
  const query = searchInput.value.trim().toLowerCase();
  const filter = filterSelect.value;
  const sort = sortSelect.value;
  const filtered = state.tasks.filter((task) => {
    if (filter === "done") return task.done;
    if (filter === "active") return !task.done;
    return true;
  });
  const tasks = sortTasks(filtered, sort).filter((task) => matchesSearch(task, query));

  list.innerHTML = "";
  emptyState.style.display = tasks.length ? "none" : "block";

  tasks.forEach((task) => {
    const card = document.createElement("article");
    card.className = `task-card${task.done ? " done" : ""}`;

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.innerHTML = `
      <span class="badge">${task.done ? "完了" : "進行中"}</span>
      <span>時間: ${formatDateTime(task.time)}</span>
      <span>場所: ${task.location || "未設定"}</span>
      <span>担当: ${task.assignee || "未設定"}</span>
    `;

    const detail = document.createElement("p");
    detail.className = "task-detail";
    detail.textContent = task.details || "詳細は未入力です。";

    const link = normalizeUrl(task.link);
    const linkNode = document.createElement("div");
    if (link) {
      const anchor = document.createElement("a");
      anchor.href = link;
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
      anchor.className = "link";
      anchor.textContent = "関連リンクを開く";
      linkNode.append(anchor);
    }

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "secondary";
    toggleBtn.textContent = task.done ? "未完了に戻す" : "完了にする";
    toggleBtn.addEventListener("click", () => toggleDone(task.id));

    const editBtn = document.createElement("button");
    editBtn.className = "secondary";
    editBtn.textContent = "編集";
    editBtn.addEventListener("click", () => startEdit(task));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "ghost";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () => removeTask(task.id));

    actions.append(toggleBtn, editBtn, deleteBtn);

    card.append(title, meta, detail, linkNode, actions);
    list.append(card);
  });
};

const startEdit = (task) => {
  document.querySelector("#title").value = task.title;
  document.querySelector("#details").value = task.details;
  document.querySelector("#time").value = task.time || "";
  document.querySelector("#location").value = task.location;
  document.querySelector("#assignee").value = task.assignee;
  document.querySelector("#link").value = task.link;
  editIdInput.value = task.id;
  submitBtn.textContent = "更新する";
  cancelEditBtn.style.display = "inline-flex";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const title = sanitizeText(formData.get("title").trim());
  if (!title) return;

  const data = {
    id: editIdInput.value || null,
    title,
    details: sanitizeText(formData.get("details").trim()),
    time: formData.get("time"),
    location: sanitizeText(formData.get("location").trim()),
    assignee: sanitizeText(formData.get("assignee").trim()),
    link: formData.get("link").trim(),
  };

  upsertTask(data);
});

cancelEditBtn.addEventListener("click", () => resetForm());
resetBtn.addEventListener("click", () => resetForm());
searchInput.addEventListener("input", render);
filterSelect.addEventListener("change", render);
sortSelect.addEventListener("change", render);

resetForm();
render();
