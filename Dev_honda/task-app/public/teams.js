requireAuth();

const listEl = document.getElementById("team-list");
const form = document.getElementById("team-form");

const renderTeams = (teams) => {
  listEl.innerHTML = "";
  if (!teams.length) {
    const li = document.createElement("li");
    li.textContent = "チームがありません";
    listEl.appendChild(li);
    return;
  }
  teams.forEach((team) => {
    const li = document.createElement("li");
    li.className = "list-item";
    const span = document.createElement("span");
    span.textContent = `${team.name} (${team.role})`;
    const link = document.createElement("a");
    link.href = `/projects.html?team_id=${team.id}`;
    link.textContent = "プロジェクトへ";
    li.appendChild(span);
    li.appendChild(link);
    listEl.appendChild(li);
  });
};

const loadTeams = async () => {
  const res = await apiFetch("/api/teams");
  if (!res || !res.ok) return;
  const teams = await res.json();
  renderTeams(teams);
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = form.elements.name.value.trim();
  if (!name) return;
  const res = await apiFetch("/api/teams", {
    method: "POST",
    body: JSON.stringify({ name })
  });
  if (!res || !res.ok) {
    alert("作成に失敗しました");
    return;
  }
  form.reset();
  loadTeams();
});

loadTeams();
