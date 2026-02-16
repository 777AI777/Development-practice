const TOKEN_KEY = "task_app_token";
const TEAM_KEY = "task_app_team";
const PROJECT_KEY = "task_app_project";

const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);
const saveTeamId = (teamId) => localStorage.setItem(TEAM_KEY, String(teamId));
const getTeamId = () => localStorage.getItem(TEAM_KEY);
const saveProjectId = (projectId) =>
  localStorage.setItem(PROJECT_KEY, String(projectId));
const getProjectId = () => localStorage.getItem(PROJECT_KEY);

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => Array.from(document.querySelectorAll(selector));

const getQueryParam = (key) => {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
};

const apiFetch = async (url, options = {}) => {
  const headers = options.headers ? { ...options.headers } : {};
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    window.location.href = "/";
    return null;
  }
  return res;
};

const requireAuth = () => {
  if (!getToken()) {
    window.location.href = "/";
  }
};

const updateProjectLinks = (projectId) => {
  if (!projectId) return;
  qsa("nav a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || !href.endsWith(".html")) return;
    const url = new URL(href, window.location.origin);
    if (["/wbs.html", "/gantt.html", "/backlog.html"].includes(url.pathname)) {
      url.searchParams.set("project_id", projectId);
      link.setAttribute("href", url.pathname + "?" + url.searchParams.toString());
    }
  });
};
