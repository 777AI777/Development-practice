import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import sqlite3 from "sqlite3";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const defaultDbPath = path.join(__dirname, "data", "tasks.db");
const dbPath = process.env.DATABASE_URL || defaultDbPath;

if (!process.env.DATABASE_URL) {
  const dataDir = path.dirname(defaultDbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

sqlite3.verbose();
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to open database:", err.message);
  }
});

const execDb = (sql) =>
  new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });

const runDb = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });

const getDb = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const allDb = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

const nowIso = () => new Date().toISOString();

const initSql =
  `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS team_members (
    team_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin','member')),
    created_at TEXT NOT NULL,
    PRIMARY KEY (team_id, user_id),
    FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
  );
` +
  `
  CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    planned_start TEXT,
    planned_end TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS work_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    parent_id INTEGER,
    kind TEXT NOT NULL CHECK (kind IN ('ticket','task')),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done')),
    planned_start TEXT,
    planned_end TEXT,
    planned_minutes INTEGER NOT NULL DEFAULT 0,
    actual_minutes INTEGER NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 0,
    milestone_id INTEGER,
    assignee_user_id INTEGER,
    is_daily INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY(parent_id) REFERENCES work_items(id) ON DELETE SET NULL,
    FOREIGN KEY(milestone_id) REFERENCES milestones(id) ON DELETE SET NULL,
    FOREIGN KEY(assignee_user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(project_id, name),
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS item_tags (
    item_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (item_id, tag_id),
    FOREIGN KEY(item_id) REFERENCES work_items(id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
  CREATE INDEX IF NOT EXISTS idx_projects_team ON projects(team_id);
  CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
  CREATE INDEX IF NOT EXISTS idx_items_project ON work_items(project_id);
` +
  `
  CREATE INDEX IF NOT EXISTS idx_items_parent ON work_items(parent_id);
  CREATE INDEX IF NOT EXISTS idx_items_status ON work_items(status);
  CREATE INDEX IF NOT EXISTS idx_items_planned_start ON work_items(planned_start);
  CREATE INDEX IF NOT EXISTS idx_tags_project ON tags(project_id);
`;

db.serialize(() => {
  execDb(initSql).catch((err) => {
    console.error("Failed to initialize schema:", err.message);
  });
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const asyncHandler =
  (handler) =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

const createPasswordHash = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("base64");
  return { hash, salt };
};

const verifyPassword = (password, salt, hash) => {
  const derived = crypto.scryptSync(password, salt, 64);
  const hashed = Buffer.from(hash, "base64");
  if (hashed.length !== derived.length) return false;
  return crypto.timingSafeEqual(hashed, derived);
};

const createToken = () => crypto.randomBytes(24).toString("hex");
const TOKEN_TTL_DAYS = 7;

const authRequired = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const token = auth.slice("Bearer ".length);
  const session = await getDb(
    `SELECT s.user_id, s.expires_at, u.username
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ?`,
    [token]
  );
  if (!session) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (new Date(session.expires_at) < new Date()) {
    await runDb("DELETE FROM sessions WHERE token = ?", [token]);
    return res.status(401).json({ error: "session_expired" });
  }
  req.user = { id: session.user_id, username: session.username, token };
  next();
});

const requireTeamMember = async (teamId, userId) =>
  getDb(
    "SELECT role FROM team_members WHERE team_id = ? AND user_id = ?",
    [teamId, userId]
  );

const requireTeamAdmin = async (teamId, userId) => {
  const row = await requireTeamMember(teamId, userId);
  return row && row.role === "admin";
};

const getProjectById = async (projectId) =>
  getDb("SELECT * FROM projects WHERE id = ?", [projectId]);

const assertTeamAccess = async (teamId, userId, res) => {
  const member = await requireTeamMember(teamId, userId);
  if (!member) {
    res.status(403).json({ error: "forbidden" });
    return null;
  }
  return member;
};

const assertProjectAccess = async (projectId, userId, res) => {
  const project = await getProjectById(projectId);
  if (!project) {
    res.status(404).json({ error: "project_not_found" });
    return null;
  }
  const member = await requireTeamMember(project.team_id, userId);
  if (!member) {
    res.status(403).json({ error: "forbidden" });
    return null;
  }
  return { project, member };
};

app.post(
  "/api/auth/register",
  asyncHandler(async (req, res) => {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ error: "invalid_credentials" });
    }
    const now = nowIso();
    const { hash, salt } = createPasswordHash(password);
    try {
      const result = await runDb(
        `INSERT INTO users (username, password_hash, password_salt, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [username, hash, salt, now, now]
      );
      res.status(201).json({ id: result.lastID, username });
    } catch (err) {
      if (String(err.message || "").includes("UNIQUE")) {
        return res.status(409).json({ error: "username_taken" });
      }
      throw err;
    }
  })
);

app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    if (!username || !password) {
      return res.status(400).json({ error: "invalid_credentials" });
    }
    const user = await getDb("SELECT * FROM users WHERE username = ?", [
      username
    ]);
    if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
      return res.status(401).json({ error: "invalid_credentials" });
    }
    const token = createToken();
    const now = nowIso();
    const expires = new Date(Date.now() + TOKEN_TTL_DAYS * 86400000).toISOString();
    await runDb(
      `INSERT INTO sessions (user_id, token, created_at, expires_at)
       VALUES (?, ?, ?, ?)`,
      [user.id, token, now, expires]
    );
    res.json({ token, user: { id: user.id, username: user.username } });
  })
);

app.post(
  "/api/auth/logout",
  authRequired,
  asyncHandler(async (req, res) => {
    await runDb("DELETE FROM sessions WHERE token = ?", [req.user.token]);
    res.json({ ok: true });
  })
);


app.get(
  "/api/teams",
  authRequired,
  asyncHandler(async (req, res) => {
    const teams = await allDb(
      `SELECT t.id, t.name, t.created_at, t.updated_at, tm.role
       FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = ?
       ORDER BY t.id DESC`,
      [req.user.id]
    );
    res.json(teams);
  })
);

app.post(
  "/api/teams",
  authRequired,
  asyncHandler(async (req, res) => {
    const name = String(req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ error: "name_required" });
    }
    const now = nowIso();
    const result = await runDb(
      `INSERT INTO teams (name, created_at, updated_at)
       VALUES (?, ?, ?)`,
      [name, now, now]
    );
    await runDb(
      `INSERT INTO team_members (team_id, user_id, role, created_at)
       VALUES (?, ?, 'admin', ?)`,
      [result.lastID, req.user.id, now]
    );
    res.status(201).json({ id: result.lastID, name });
  })
);

app.get(
  "/api/teams/:teamId/members",
  authRequired,
  asyncHandler(async (req, res) => {
    const teamId = Number(req.params.teamId);
    if (!Number.isInteger(teamId)) {
      return res.status(400).json({ error: "invalid_team" });
    }
    const member = await assertTeamAccess(teamId, req.user.id, res);
    if (!member) return;
    const members = await allDb(
      `SELECT u.id, u.username, tm.role, tm.created_at
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = ?
       ORDER BY tm.created_at`,
      [teamId]
    );
    res.json(members);
  })
);

app.post(
  "/api/teams/:teamId/members",
  authRequired,
  asyncHandler(async (req, res) => {
    const teamId = Number(req.params.teamId);
    if (!Number.isInteger(teamId)) {
      return res.status(400).json({ error: "invalid_team" });
    }
    const isAdmin = await requireTeamAdmin(teamId, req.user.id);
    if (!isAdmin) {
      return res.status(403).json({ error: "forbidden" });
    }
    const username = String(req.body?.username || "").trim();
    const role = String(req.body?.role || "member");
    if (!username) {
      return res.status(400).json({ error: "username_required" });
    }
    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({ error: "invalid_role" });
    }
    const user = await getDb("SELECT id FROM users WHERE username = ?", [
      username
    ]);
    if (!user) {
      return res.status(404).json({ error: "user_not_found" });
    }
    const now = nowIso();
    try {
      await runDb(
        `INSERT INTO team_members (team_id, user_id, role, created_at)
         VALUES (?, ?, ?, ?)`,
        [teamId, user.id, role, now]
      );
      res.status(201).json({ ok: true });
    } catch (err) {
      if (String(err.message || "").includes("UNIQUE")) {
        return res.status(409).json({ error: "already_member" });
      }
      throw err;
    }
  })
);

app.patch(
  "/api/teams/:teamId/members/:userId",
  authRequired,
  asyncHandler(async (req, res) => {
    const teamId = Number(req.params.teamId);
    const userId = Number(req.params.userId);
    if (!Number.isInteger(teamId) || !Number.isInteger(userId)) {
      return res.status(400).json({ error: "invalid_params" });
    }
    const isAdmin = await requireTeamAdmin(teamId, req.user.id);
    if (!isAdmin) {
      return res.status(403).json({ error: "forbidden" });
    }
    const role = String(req.body?.role || "");
    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({ error: "invalid_role" });
    }
    const member = await getDb(
      "SELECT role FROM team_members WHERE team_id = ? AND user_id = ?",
      [teamId, userId]
    );
    if (!member) {
      return res.status(404).json({ error: "member_not_found" });
    }
    if (member.role === "admin" && role === "member") {
      const adminCount = await getDb(
        "SELECT COUNT(*) AS count FROM team_members WHERE team_id = ? AND role = 'admin'",
        [teamId]
      );
      if (adminCount?.count <= 1) {
        return res.status(400).json({ error: "last_admin" });
      }
    }
    await runDb(
      "UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?",
      [role, teamId, userId]
    );
    res.json({ ok: true });
  })
);

app.delete(
  "/api/teams/:teamId/members/:userId",
  authRequired,
  asyncHandler(async (req, res) => {
    const teamId = Number(req.params.teamId);
    const userId = Number(req.params.userId);
    if (!Number.isInteger(teamId) || !Number.isInteger(userId)) {
      return res.status(400).json({ error: "invalid_params" });
    }
    const isAdmin = await requireTeamAdmin(teamId, req.user.id);
    if (!isAdmin) {
      return res.status(403).json({ error: "forbidden" });
    }
    const member = await getDb(
      "SELECT role FROM team_members WHERE team_id = ? AND user_id = ?",
      [teamId, userId]
    );
    if (!member) {
      return res.status(404).json({ error: "member_not_found" });
    }
    if (member.role === "admin") {
      const adminCount = await getDb(
        "SELECT COUNT(*) AS count FROM team_members WHERE team_id = ? AND role = 'admin'",
        [teamId]
      );
      if (adminCount?.count <= 1) {
        return res.status(400).json({ error: "last_admin" });
      }
    }
    await runDb(
      "DELETE FROM team_members WHERE team_id = ? AND user_id = ?",
      [teamId, userId]
    );
    res.json({ ok: true });
  })
);

app.get(
  "/api/teams/:teamId/projects",
  authRequired,
  asyncHandler(async (req, res) => {
    const teamId = Number(req.params.teamId);
    if (!Number.isInteger(teamId)) {
      return res.status(400).json({ error: "invalid_team" });
    }
    const member = await assertTeamAccess(teamId, req.user.id, res);
    if (!member) return;
    const projects = await allDb(
      `SELECT id, name, description, created_at, updated_at
       FROM projects WHERE team_id = ?
       ORDER BY id DESC`,
      [teamId]
    );
    res.json(projects);
  })
);

app.post(
  "/api/teams/:teamId/projects",
  authRequired,
  asyncHandler(async (req, res) => {
    const teamId = Number(req.params.teamId);
    if (!Number.isInteger(teamId)) {
      return res.status(400).json({ error: "invalid_team" });
    }
    const member = await assertTeamAccess(teamId, req.user.id, res);
    if (!member) return;
    const name = String(req.body?.name || "").trim();
    const description = String(req.body?.description || "").trim();
    if (!name) {
      return res.status(400).json({ error: "name_required" });
    }
    const now = nowIso();
    const result = await runDb(
      `INSERT INTO projects (team_id, name, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [teamId, name, description || null, now, now]
    );
    res.status(201).json({ id: result.lastID, name, description });
  })
);

app.patch(
  "/api/projects/:projectId",
  authRequired,
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: "invalid_project" });
    }
    const access = await assertProjectAccess(projectId, req.user.id, res);
    if (!access) return;
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : null;
    const description =
      typeof req.body?.description === "string" ? req.body.description.trim() : null;
    if (!name && description === null) {
      return res.status(400).json({ error: "no_fields" });
    }
    const fields = [];
    const values = [];
    if (name) {
      fields.push("name = ?");
      values.push(name);
    }
    if (description !== null) {
      fields.push("description = ?");
      values.push(description || null);
    }
    fields.push("updated_at = ?");
    values.push(nowIso());
    values.push(projectId);
    await runDb(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`, values);
    res.json({ ok: true });
  })
);

app.delete(
  "/api/projects/:projectId",
  authRequired,
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: "invalid_project" });
    }
    const access = await assertProjectAccess(projectId, req.user.id, res);
    if (!access) return;
    await runDb("DELETE FROM projects WHERE id = ?", [projectId]);
    res.json({ ok: true });
  })
);

app.get(
  "/api/projects/:projectId/milestones",
  authRequired,
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: "invalid_project" });
    }
    const access = await assertProjectAccess(projectId, req.user.id, res);
    if (!access) return;
    const milestones = await allDb(
      `SELECT id, name, planned_start, planned_end, order_index, created_at, updated_at
       FROM milestones WHERE project_id = ?
       ORDER BY order_index, id`,
      [projectId]
    );
    res.json(milestones);
  })
);

app.post(
  "/api/projects/:projectId/milestones",
  authRequired,
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: "invalid_project" });
    }
    const access = await assertProjectAccess(projectId, req.user.id, res);
    if (!access) return;
    const name = String(req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ error: "name_required" });
    }
    const plannedStart = req.body?.planned_start || null;
    const plannedEnd = req.body?.planned_end || null;
    const orderIndex = Number(req.body?.order_index || 0);
    const now = nowIso();
    const result = await runDb(
      `INSERT INTO milestones (project_id, name, planned_start, planned_end, order_index, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [projectId, name, plannedStart, plannedEnd, orderIndex, now, now]
    );
    res.status(201).json({ id: result.lastID, name });
  })
);

app.patch(
  "/api/milestones/:id",
  authRequired,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "invalid_milestone" });
    }
    const milestone = await getDb(
      "SELECT id, project_id FROM milestones WHERE id = ?",
      [id]
    );
    if (!milestone) {
      return res.status(404).json({ error: "not_found" });
    }
    const access = await assertProjectAccess(milestone.project_id, req.user.id, res);
    if (!access) return;
    const fields = [];
    const values = [];
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : null;
    if (name) {
      fields.push("name = ?");
      values.push(name);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "planned_start")) {
      fields.push("planned_start = ?");
      values.push(req.body.planned_start || null);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "planned_end")) {
      fields.push("planned_end = ?");
      values.push(req.body.planned_end || null);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "order_index")) {
      fields.push("order_index = ?");
      values.push(Number(req.body.order_index || 0));
    }
    if (!fields.length) {
      return res.status(400).json({ error: "no_fields" });
    }
    fields.push("updated_at = ?");
    values.push(nowIso());
    values.push(id);
    await runDb(`UPDATE milestones SET ${fields.join(", ")} WHERE id = ?`, values);
    res.json({ ok: true });
  })
);

app.delete(
  "/api/milestones/:id",
  authRequired,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "invalid_milestone" });
    }
    const milestone = await getDb(
      "SELECT id, project_id FROM milestones WHERE id = ?",
      [id]
    );
    if (!milestone) {
      return res.status(404).json({ error: "not_found" });
    }
    const access = await assertProjectAccess(milestone.project_id, req.user.id, res);
    if (!access) return;
    await runDb("DELETE FROM milestones WHERE id = ?", [id]);
    res.json({ ok: true });
  })
);

app.get(
  "/api/projects/:projectId/items",
  authRequired,
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: "invalid_project" });
    }
    const access = await assertProjectAccess(projectId, req.user.id, res);
    if (!access) return;

    const filters = ["project_id = ?"];
    const params = [projectId];

    if (req.query.kind) {
      filters.push("kind = ?");
      params.push(String(req.query.kind));
    }
    if (req.query.parent_id) {
      filters.push("parent_id = ?");
      params.push(Number(req.query.parent_id));
    }
    if (req.query.status) {
      filters.push("status = ?");
      params.push(String(req.query.status));
    }
    if (req.query.assignee_user_id) {
      filters.push("assignee_user_id = ?");
      params.push(Number(req.query.assignee_user_id));
    }
    if (req.query.milestone_id) {
      filters.push("milestone_id = ?");
      params.push(Number(req.query.milestone_id));
    }
    if (req.query.backlog === "1") {
      filters.push("planned_start IS NULL AND planned_end IS NULL");
    }
    if (req.query.scheduled === "1") {
      filters.push("(planned_start IS NOT NULL OR planned_end IS NOT NULL)");
    }

    const items = await allDb(
      `SELECT * FROM work_items WHERE ${filters.join(" AND ")}
       ORDER BY priority DESC, id DESC`,
      params
    );
    res.json(items);
  })
);

app.post(
  "/api/projects/:projectId/items",
  authRequired,
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: "invalid_project" });
    }
    const access = await assertProjectAccess(projectId, req.user.id, res);
    if (!access) return;

    const kind = String(req.body?.kind || "").trim();
    if (!["ticket", "task"].includes(kind)) {
      return res.status(400).json({ error: "invalid_kind" });
    }
    const title = String(req.body?.title || "").trim();
    if (!title) {
      return res.status(400).json({ error: "title_required" });
    }
    const parentId = req.body?.parent_id ? Number(req.body.parent_id) : null;
    if (kind === "task") {
      if (!parentId) {
        return res.status(400).json({ error: "parent_required" });
      }
      const parent = await getDb(
        "SELECT id, kind FROM work_items WHERE id = ? AND project_id = ?",
        [parentId, projectId]
      );
      if (!parent || parent.kind !== "ticket") {
        return res.status(400).json({ error: "invalid_parent" });
      }
    }

    const status = req.body?.status || "open";
    if (!["open", "in_progress", "done"].includes(status)) {
      return res.status(400).json({ error: "invalid_status" });
    }
    const plannedStart = req.body?.planned_start || null;
    const plannedEnd = req.body?.planned_end || null;
    const plannedMinutes = Number(req.body?.planned_minutes || 0);
    const actualMinutes = Number(req.body?.actual_minutes || 0);
    const priority = Number(req.body?.priority || 0);
    const milestoneId = req.body?.milestone_id ? Number(req.body.milestone_id) : null;
    const assigneeUserId = req.body?.assignee_user_id
      ? Number(req.body.assignee_user_id)
      : null;
    const isDaily = req.body?.is_daily ? 1 : 0;
    const now = nowIso();
    const completedAt = status === "done" ? now : null;

    const result = await runDb(
      `INSERT INTO work_items (
        project_id, parent_id, kind, title, description, status,
        planned_start, planned_end, planned_minutes, actual_minutes,
        priority, milestone_id, assignee_user_id, is_daily, completed_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        parentId,
        kind,
        title,
        req.body?.description || null,
        status,
        plannedStart,
        plannedEnd,
        plannedMinutes,
        actualMinutes,
        priority,
        milestoneId,
        assigneeUserId,
        isDaily,
        completedAt,
        now,
        now
      ]
    );
    res.status(201).json({ id: result.lastID });
  })
);

app.patch(
  "/api/items/:id",
  authRequired,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "invalid_item" });
    }
    const item = await getDb("SELECT * FROM work_items WHERE id = ?", [id]);
    if (!item) {
      return res.status(404).json({ error: "not_found" });
    }
    const access = await assertProjectAccess(item.project_id, req.user.id, res);
    if (!access) return;

    if (Object.prototype.hasOwnProperty.call(req.body, "status")) {
      const status = req.body.status;
      if (!["open", "in_progress", "done"].includes(status)) {
        return res.status(400).json({ error: "invalid_status" });
      }
    }

    const fields = [];
    const values = [];
    const updatable = [
      "title",
      "description",
      "status",
      "planned_start",
      "planned_end",
      "planned_minutes",
      "actual_minutes",
      "priority",
      "milestone_id",
      "assignee_user_id",
      "is_daily"
    ];
    updatable.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        let value = req.body[key];
        if (key === "title" && typeof value === "string") value = value.trim();
        if (key === "is_daily") value = value ? 1 : 0;
        fields.push(`${key} = ?`);
        values.push(value === "" ? null : value);
      }
    });
    if (!fields.length) {
      return res.status(400).json({ error: "no_fields" });
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "status")) {
      const status = req.body.status;
      fields.push("completed_at = ?");
      values.push(status === "done" ? nowIso() : null);
    }
    fields.push("updated_at = ?");
    values.push(nowIso());
    values.push(id);
    await runDb(`UPDATE work_items SET ${fields.join(", ")} WHERE id = ?`, values);
    res.json({ ok: true });
  })
);

app.delete(
  "/api/items/:id",
  authRequired,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "invalid_item" });
    }
    const item = await getDb("SELECT id, project_id FROM work_items WHERE id = ?", [id]);
    if (!item) {
      return res.status(404).json({ error: "not_found" });
    }
    const access = await assertProjectAccess(item.project_id, req.user.id, res);
    if (!access) return;
    await runDb("DELETE FROM work_items WHERE id = ?", [id]);
    res.json({ ok: true });
  })
);

app.get(
  "/api/projects/:projectId/tags",
  authRequired,
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: "invalid_project" });
    }
    const access = await assertProjectAccess(projectId, req.user.id, res);
    if (!access) return;
    const tags = await allDb(
      "SELECT id, name, color, created_at FROM tags WHERE project_id = ? ORDER BY id DESC",
      [projectId]
    );
    res.json(tags);
  })
);

app.post(
  "/api/projects/:projectId/tags",
  authRequired,
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: "invalid_project" });
    }
    const access = await assertProjectAccess(projectId, req.user.id, res);
    if (!access) return;
    const name = String(req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ error: "name_required" });
    }
    const color = req.body?.color || null;
    const now = nowIso();
    try {
      const result = await runDb(
        `INSERT INTO tags (project_id, name, color, created_at)
         VALUES (?, ?, ?, ?)`,
        [projectId, name, color, now]
      );
      res.status(201).json({ id: result.lastID, name, color });
    } catch (err) {
      if (String(err.message || "").includes("UNIQUE")) {
        return res.status(409).json({ error: "tag_exists" });
      }
      throw err;
    }
  })
);

app.delete(
  "/api/tags/:id",
  authRequired,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "invalid_tag" });
    }
    const tag = await getDb("SELECT id, project_id FROM tags WHERE id = ?", [id]);
    if (!tag) {
      return res.status(404).json({ error: "not_found" });
    }
    const access = await assertProjectAccess(tag.project_id, req.user.id, res);
    if (!access) return;
    await runDb("DELETE FROM tags WHERE id = ?", [id]);
    res.json({ ok: true });
  })
);

app.post(
  "/api/items/:id/tags",
  authRequired,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "invalid_item" });
    }
    const item = await getDb("SELECT id, project_id FROM work_items WHERE id = ?", [id]);
    if (!item) {
      return res.status(404).json({ error: "not_found" });
    }
    const access = await assertProjectAccess(item.project_id, req.user.id, res);
    if (!access) return;
    const tagId = Number(req.body?.tag_id);
    if (!Number.isInteger(tagId)) {
      return res.status(400).json({ error: "invalid_tag" });
    }
    const tag = await getDb(
      "SELECT id FROM tags WHERE id = ? AND project_id = ?",
      [tagId, item.project_id]
    );
    if (!tag) {
      return res.status(404).json({ error: "tag_not_found" });
    }
    await runDb(
      "INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)",
      [id, tagId]
    );
    res.json({ ok: true });
  })
);

app.delete(
  "/api/items/:id/tags/:tagId",
  authRequired,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const tagId = Number(req.params.tagId);
    if (!Number.isInteger(id) || !Number.isInteger(tagId)) {
      return res.status(400).json({ error: "invalid_params" });
    }
    const item = await getDb("SELECT id, project_id FROM work_items WHERE id = ?", [id]);
    if (!item) {
      return res.status(404).json({ error: "not_found" });
    }
    const access = await assertProjectAccess(item.project_id, req.user.id, res);
    if (!access) return;
    await runDb("DELETE FROM item_tags WHERE item_id = ? AND tag_id = ?", [id, tagId]);
    res.json({ ok: true });
  })
);

app.get(
  "/api/projects/:projectId/progress",
  authRequired,
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: "invalid_project" });
    }
    const access = await assertProjectAccess(projectId, req.user.id, res);
    if (!access) return;
    const row = await getDb(
      `SELECT
        COALESCE(SUM(planned_minutes), 0) AS planned_total,
        COALESCE(SUM(CASE WHEN status = 'done' THEN planned_minutes ELSE 0 END), 0) AS planned_done
       FROM work_items
       WHERE project_id = ? AND kind = 'task'`,
      [projectId]
    );
    const plannedTotal = Number(row?.planned_total || 0);
    const plannedDone = Number(row?.planned_done || 0);
    const progress = plannedTotal > 0 ? plannedDone / plannedTotal : 0;
    res.json({ planned_total: plannedTotal, planned_done: plannedDone, progress });
  })
);

app.get(
  "/api/projects/:projectId/weekly",
  authRequired,
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: "invalid_project" });
    }
    const access = await assertProjectAccess(projectId, req.user.id, res);
    if (!access) return;
    const start = req.query.start
      ? new Date(String(req.query.start))
      : new Date(Date.now() - 6 * 86400000);
    const rows = await allDb(
      `SELECT completed_at FROM work_items
       WHERE project_id = ? AND status = 'done' AND completed_at IS NOT NULL`,
      [projectId]
    );
    const buckets = {};
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(start.getTime() + i * 86400000);
      const key = day.toISOString().slice(0, 10);
      buckets[key] = 0;
    }
    rows.forEach((row) => {
      const day = String(row.completed_at).slice(0, 10);
      if (Object.prototype.hasOwnProperty.call(buckets, day)) {
        buckets[day] += 1;
      }
    });
    res.json({ start: start.toISOString().slice(0, 10), days: buckets });
  })
);

app.get(
  "/api/projects/:projectId/gantt",
  authRequired,
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: "invalid_project" });
    }
    const access = await assertProjectAccess(projectId, req.user.id, res);
    if (!access) return;
    const items = await allDb(
      `SELECT * FROM work_items
       WHERE project_id = ? AND (planned_start IS NOT NULL OR planned_end IS NOT NULL)
       ORDER BY planned_start, planned_end`,
      [projectId]
    );
    res.json(items);
  })
);

app.get(
  "/api/projects/:projectId/list",
  authRequired,
  asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: "invalid_project" });
    }
    const access = await assertProjectAccess(projectId, req.user.id, res);
    if (!access) return;
    const items = await allDb(
      `SELECT * FROM work_items
       WHERE project_id = ?
       ORDER BY CASE WHEN planned_end IS NULL THEN 1 ELSE 0 END, planned_end`,
      [projectId]
    );
    res.json(items);
  })
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "server_error" });
});

app.listen(PORT, () => {
  console.log(`Task app running on http://localhost:${PORT}`);
  console.log(`DB: ${dbPath}`);
});


