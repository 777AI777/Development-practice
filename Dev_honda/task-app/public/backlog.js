requireAuth();

const projectId = getQueryParam("project_id") || getProjectId();
const listEl = document.getElementById("backlog-list");

if (!projectId) {
  listEl.innerHTML = "<li>プロジェクトを選択してください</li>";
} else {
  saveProjectId(projectId);
}
updateProjectLinks(projectId);

const loadBacklog = async () => {
  if (!projectId) return;
  const res = await apiFetch(`/api/projects/${projectId}/items?backlog=1`);
  if (!res || !res.ok) return;
  const items = await res.json();
  listEl.innerHTML = "";
  if (!items.length) {
    listEl.innerHTML = "<li>未着手はありません</li>";
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.textContent = `${item.title} (${item.kind === "ticket" ? "課題" : "子課題"})`;
    listEl.appendChild(li);
  });
};

loadBacklog();
