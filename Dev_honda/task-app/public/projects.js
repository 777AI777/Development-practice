requireAuth();

const teamId = getQueryParam("team_id") || getTeamId();
const listEl = document.getElementById("project-list");
const form = document.getElementById("project-form");

if (!teamId) {
  listEl.innerHTML = "<li>チームを選択してください</li>";
} else {
  saveTeamId(teamId);
}

const renderProjects = (projects) => {
  listEl.innerHTML = "";
  if (!projects.length) {
    const li = document.createElement("li");
    li.textContent = "プロジェクトがありません";
    listEl.appendChild(li);
    return;
  }
  projects.forEach((project) => {
    const li = document.createElement("li");
    li.className = "list-item";
    const span = document.createElement("span");
    span.textContent = project.name;
    const links = document.createElement("div");
    links.className = "link-group";
    const wbsLink = document.createElement("a");
    wbsLink.href = `/wbs.html?project_id=${project.id}`;
    wbsLink.textContent = "WBS";
    wbsLink.dataset.projectId = project.id;

    const ganttLink = document.createElement("a");
    ganttLink.href = `/gantt.html?project_id=${project.id}`;
    ganttLink.textContent = "ガント";
    ganttLink.dataset.projectId = project.id;

    const backlogLink = document.createElement("a");
    backlogLink.href = `/backlog.html?project_id=${project.id}`;
    backlogLink.textContent = "未着手";
    backlogLink.dataset.projectId = project.id;

    links.appendChild(wbsLink);
    links.appendChild(ganttLink);
    links.appendChild(backlogLink);
    li.appendChild(span);
    li.appendChild(links);
    listEl.appendChild(li);
  });
};

listEl.addEventListener("click", (event) => {
  const target = event.target;
  if (target && target.dataset && target.dataset.projectId) {
    saveProjectId(target.dataset.projectId);
  }
});

const loadProjects = async () => {
  if (!teamId) return;
  const res = await apiFetch(`/api/teams/${teamId}/projects`);
  if (!res || !res.ok) return;
  const projects = await res.json();
  renderProjects(projects);
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!teamId) return;
  const name = form.elements.name.value.trim();
  const description = form.elements.description.value.trim();
  if (!name) return;
  const res = await apiFetch(`/api/teams/${teamId}/projects`, {
    method: "POST",
    body: JSON.stringify({ name, description })
  });
  if (!res || !res.ok) {
    alert("作成に失敗しました");
    return;
  }
  form.reset();
  loadProjects();
});

loadProjects();
