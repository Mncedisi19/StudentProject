const db = require("../../../../db");
const { newId } = require("../../../lib/ids");
const { getUserFromRequest } = require("../../../lib/auth");
const { parseComplaintText } = require("../../../lib/aiParser");
const { departmentFor, deadlineHoursFor, CATEGORY_KEYS } = require("../../../lib/categories");
const { runEscalationSweep } = require("../../../lib/escalation");
const { ok, created, badRequest, unauthorized, serverError } = require("../../../lib/apiResponse");

function metooCounts() {
  const rows = db.prepare("SELECT complaint_id, COUNT(*) as c FROM metoo_votes GROUP BY complaint_id").all();
  const map = {};
  for (const r of rows) map[r.complaint_id] = r.c;
  return map;
}

function sanitize(row, requester, myVotes) {
  const isOwner = requester && requester.id === row.user_id;
  const isAdmin = requester && requester.role === "MUNICIPAL_ADMIN";
  const out = { ...row };
  out.is_overdue = !!row.is_overdue;
  out.me_too_count = row.me_too_count || 0;
  out.i_me_tooed = myVotes ? myVotes.has(row.id) : false;
  if (!isAdmin && !isOwner) {
    delete out.internal_notes;
  }
  return out;
}

async function GET(request) {
  try {
    // Keep the demo self-healing: sweep for overdue complaints on every read.
    runEscalationSweep();

    const requester = getUserFromRequest(request);
    const { searchParams } = new URL(request.url);

    const scope = searchParams.get("scope") || "all"; // all | mine
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const department = searchParams.get("department");
    const search = searchParams.get("search");
    const overdueOnly = searchParams.get("overdue") === "true";
    const sort = searchParams.get("sort") || "newest";

    if (scope === "mine" && !requester) return unauthorized();

    const clauses = [];
    const params = [];

    if (scope === "mine") {
      clauses.push("c.user_id = ?");
      params.push(requester.id);
    }
    if (status) {
      clauses.push("c.status = ?");
      params.push(status);
    }
    if (category) {
      clauses.push("c.category = ?");
      params.push(category);
    }
    if (priority) {
      clauses.push("c.priority = ?");
      params.push(priority);
    }
    if (department) {
      clauses.push("c.assigned_department = ?");
      params.push(department);
    }
    if (overdueOnly) {
      clauses.push("c.is_overdue = 1");
    }
    if (search) {
      clauses.push("(c.title LIKE ? OR c.description LIKE ? OR c.address LIKE ?)");
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

    const sortMap = {
      newest: "c.created_at DESC",
      oldest: "c.created_at ASC",
      priority: `CASE c.priority WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END ASC, c.created_at DESC`,
      overdue: "c.is_overdue DESC, c.created_at DESC",
    };
    const orderBy = sortMap[sort] || sortMap.newest;

    const rows = db
      .prepare(
        `SELECT c.*, u.name as reporter_name
         FROM complaints c
         JOIN users u ON u.id = c.user_id
         ${where}
         ORDER BY ${orderBy}
         LIMIT 500`
      )
      .all(...params);

    const counts = metooCounts();
    let myVotes = null;
    if (requester) {
      const voteRows = db.prepare("SELECT complaint_id FROM metoo_votes WHERE user_id = ?").all(requester.id);
      myVotes = new Set(voteRows.map((v) => v.complaint_id));
    }

    const complaints = rows.map((row) =>
      sanitize({ ...row, me_too_count: counts[row.id] || 0 }, requester, myVotes)
    );

    return ok({ complaints });
  } catch (err) {
    return serverError(err);
  }
}

async function POST(request) {
  try {
    const requester = getUserFromRequest(request);
    if (!requester) return unauthorized();

    const body = await request.json();
    const title = (body.title || "").trim();
    const description = (body.description || "").trim();
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const address = (body.address || "").trim() || null;
    const photo_url = body.photo_url || null;

    if (!description || description.length < 5) {
      return badRequest("Please describe the issue.");
    }
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return badRequest("Location (latitude/longitude) is required. Use GPS or drop a pin on the map.");
    }

    // AI-assisted auto-fill: if the citizen didn't pick a category/priority,
    // or explicitly requested AUTO, derive them from the free-text description.
    let category = body.category && CATEGORY_KEYS.includes(body.category) ? body.category : null;
    let priority = body.priority || null;
    let parsed = null;
    if (!category || !priority) {
      parsed = parseComplaintText(description);
      category = category || parsed.category;
      priority = priority || parsed.priority;
    }

    const finalTitle = title || parsed?.suggestedTitle || `${category} issue reported`;
    const department = departmentFor(category);
    const deadlineHours = deadlineHoursFor(category, priority);
    const deadline = new Date(Date.now() + deadlineHours * 60 * 60 * 1000).toISOString();

    const id = newId("cmp");
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO complaints
        (id, user_id, title, description, category, latitude, longitude, address, photo_url,
         status, priority, assigned_department, is_overdue, response_deadline, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, ?, 0, ?, ?, ?)`
    ).run(
      id, requester.id, finalTitle, description, category, latitude, longitude, address, photo_url,
      priority, department, deadline, now, now
    );

    db.prepare(
      `INSERT INTO complaint_events (id, complaint_id, actor_id, event_type, message, created_at)
       VALUES (?, ?, ?, 'SUBMITTED', ?, ?)`
    ).run(newId("evt"), id, requester.id, "Complaint submitted by resident.", now);

    const row = db
      .prepare(`SELECT c.*, u.name as reporter_name FROM complaints c JOIN users u ON u.id = c.user_id WHERE c.id = ?`)
      .get(id);

    return created({ complaint: sanitize({ ...row, me_too_count: 0 }, requester, new Set()), ai: parsed });
  } catch (err) {
    return serverError(err);
  }
}

module.exports = { GET, POST };
