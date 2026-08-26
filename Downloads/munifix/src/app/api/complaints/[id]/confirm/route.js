const db = require("../../../../../../db");
const { newId } = require("../../../../../lib/ids");
const { getUserFromRequest } = require("../../../../../lib/auth");
const { bumpPriority } = require("../../../../../lib/escalation");
const { ok, badRequest, unauthorized, forbidden, notFound, serverError } = require("../../../../../lib/apiResponse");

async function POST(request, { params }) {
  try {
    const requester = getUserFromRequest(request);
    if (!requester) return unauthorized();

    const row = db.prepare("SELECT * FROM complaints WHERE id = ?").get(params.id);
    if (!row) return notFound("Complaint not found.");
    if (row.user_id !== requester.id) return forbidden("Only the resident who filed this complaint can verify its resolution.");
    if (row.status !== "RESOLVED") return badRequest("This complaint is not currently marked resolved.");

    const body = await request.json();
    const confirmed = body.confirmed === true;
    const reason = (body.reason || "").trim();
    const now = new Date().toISOString();

    if (confirmed) {
      db.prepare("UPDATE complaints SET status = 'CLOSED', updated_at = ? WHERE id = ?").run(now, params.id);
      db.prepare(
        `INSERT INTO complaint_events (id, complaint_id, actor_id, event_type, message, created_at)
         VALUES (?, ?, ?, 'CONFIRMED', 'Resident confirmed the issue is fixed. Complaint closed.', ?)`
      ).run(newId("evt"), params.id, requester.id, now);
    } else {
      if (!reason) return badRequest("Please tell us why this still isn't fixed.");
      const escalatedPriority = bumpPriority(row.priority);
      // Reopening triggers an escalation flag: shorter fuse, bumped priority.
      const newDeadline = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      db.prepare(
        `UPDATE complaints
         SET status = 'REOPENED', priority = ?, is_overdue = 0, response_deadline = ?,
             rejection_reason = ?, updated_at = ?
         WHERE id = ?`
      ).run(escalatedPriority, newDeadline, reason, now, params.id);
      db.prepare(
        `INSERT INTO complaint_events (id, complaint_id, actor_id, event_type, message, created_at)
         VALUES (?, ?, ?, 'REJECTED', ?, ?)`
      ).run(
        newId("evt"),
        params.id,
        requester.id,
        `Resident rejected the resolution: "${reason}". Escalated to ${escalatedPriority} priority and reopened.`,
        now
      );
    }

    const updated = db
      .prepare(`SELECT c.*, u.name as reporter_name FROM complaints c JOIN users u ON u.id = c.user_id WHERE c.id = ?`)
      .get(params.id);
    return ok({ complaint: { ...updated, is_overdue: !!updated.is_overdue } });
  } catch (err) {
    return serverError(err);
  }
}

module.exports = { POST };
