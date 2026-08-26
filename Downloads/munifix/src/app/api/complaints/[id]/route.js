const db = require("../../../../../db");
const { newId } = require("../../../../lib/ids");
const { getUserFromRequest } = require("../../../../lib/auth");
const { deadlineHoursFor } = require("../../../../lib/categories");
const { ok, badRequest, unauthorized, forbidden, notFound, serverError } = require("../../../../lib/apiResponse");

const VALID_STATUSES = ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REOPENED", "CLOSED"];
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function loadComplaint(id) {
  return db
    .prepare(`SELECT c.*, u.name as reporter_name, u.phone as reporter_phone FROM complaints c JOIN users u ON u.id = c.user_id WHERE c.id = ?`)
    .get(id);
}

function loadEvents(id) {
  return db
    .prepare(
      `SELECT e.*, u.name as actor_name FROM complaint_events e
       LEFT JOIN users u ON u.id = e.actor_id
       WHERE e.complaint_id = ? ORDER BY e.created_at ASC`
    )
    .all(id);
}

function sanitize(row, requester) {
  const isOwner = requester && requester.id === row.user_id;
  const isAdmin = requester && requester.role === "MUNICIPAL_ADMIN";
  const out = { ...row, is_overdue: !!row.is_overdue };
  if (!isAdmin && !isOwner) delete out.internal_notes;
  if (!isAdmin) delete out.reporter_phone;
  return out;
}

async function GET(request, { params }) {
  try {
    const requester = getUserFromRequest(request);
    const row = loadComplaint(params.id);
    if (!row) return notFound("Complaint not found.");

    const meTooCount = db.prepare("SELECT COUNT(*) as c FROM metoo_votes WHERE complaint_id = ?").get(params.id).c;
    let iMeTooed = false;
    if (requester) {
      iMeTooed = !!db.prepare("SELECT 1 FROM metoo_votes WHERE complaint_id = ? AND user_id = ?").get(params.id, requester.id);
    }

    const events = loadEvents(params.id);
    return ok({
      complaint: { ...sanitize(row, requester), me_too_count: meTooCount, i_me_tooed: iMeTooed },
      events,
    });
  } catch (err) {
    return serverError(err);
  }
}

async function PATCH(request, { params }) {
  try {
    const requester = getUserFromRequest(request);
    if (!requester) return unauthorized();
    if (requester.role !== "MUNICIPAL_ADMIN") return forbidden("Only municipal officials can update a complaint.");

    const row = loadComplaint(params.id);
    if (!row) return notFound("Complaint not found.");

    const body = await request.json();
    const now = new Date().toISOString();

    const updates = {};
    const events = [];

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) return badRequest("Invalid status.");
      if (body.status === "RESOLVED") {
        const proof = body.resolution_proof_url || row.resolution_proof_url;
        const note = (body.resolution_note || row.resolution_note || "").trim();
        if (!proof && !note) {
          return badRequest("Attach a proof photo or a resolution note before marking this resolved.");
        }
        if (body.resolution_proof_url) updates.resolution_proof_url = body.resolution_proof_url;
        if (body.resolution_note !== undefined) updates.resolution_note = body.resolution_note;
      }
      updates.status = body.status;
      events.push(`Status changed to ${body.status}.`);

      // Freshly (re)assigning resets the response clock, matching spec 3E.
      if (body.status === "ASSIGNED" && !body.response_deadline) {
        const priority = body.priority || row.priority;
        const hours = deadlineHoursFor(row.category, priority);
        updates.response_deadline = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        updates.is_overdue = 0;
      }
      if (["RESOLVED", "CLOSED"].includes(body.status)) {
        updates.is_overdue = 0;
      }
    }

    if (body.priority !== undefined) {
      if (!VALID_PRIORITIES.includes(body.priority)) return badRequest("Invalid priority.");
      updates.priority = body.priority;
      events.push(`Priority set to ${body.priority}.`);
    }

    if (body.assigned_department !== undefined) {
      updates.assigned_department = body.assigned_department;
      events.push(`Assigned to department: ${body.assigned_department}.`);
    }

    if (body.assigned_team !== undefined) {
      updates.assigned_team = body.assigned_team;
      events.push(`Assigned to team: ${body.assigned_team}.`);
    }

    if (body.response_deadline !== undefined) {
      updates.response_deadline = body.response_deadline;
      events.push(`Response deadline updated.`);
    }

    if (body.internal_notes !== undefined) {
      updates.internal_notes = body.internal_notes;
    }

    if (body.resolution_proof_url !== undefined && updates.resolution_proof_url === undefined) {
      updates.resolution_proof_url = body.resolution_proof_url;
      events.push(`Proof-of-resolution photo attached.`);
    }

    if (Object.keys(updates).length === 0) {
      return badRequest("No valid fields to update.");
    }

    updates.updated_at = now;
    const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
    const values = Object.values(updates);
    db.prepare(`UPDATE complaints SET ${setClause} WHERE id = ?`).run(...values, params.id);

    const insertEvent = db.prepare(
      `INSERT INTO complaint_events (id, complaint_id, actor_id, event_type, message, created_at) VALUES (?, ?, ?, 'ADMIN_UPDATE', ?, ?)`
    );
    for (const msg of events) {
      insertEvent.run(newId("evt"), params.id, requester.id, msg, now);
    }

    const updated = loadComplaint(params.id);
    return ok({ complaint: sanitize(updated, requester), events: loadEvents(params.id) });
  } catch (err) {
    return serverError(err);
  }
}

module.exports = { GET, PATCH };
