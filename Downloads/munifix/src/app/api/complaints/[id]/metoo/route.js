const db = require("../../../../../../db");
const { newId } = require("../../../../../lib/ids");
const { getUserFromRequest } = require("../../../../../lib/auth");
const { ok, unauthorized, notFound, serverError } = require("../../../../../lib/apiResponse");

async function POST(request, { params }) {
  try {
    const requester = getUserFromRequest(request);
    if (!requester) return unauthorized();

    const complaint = db.prepare("SELECT id FROM complaints WHERE id = ?").get(params.id);
    if (!complaint) return notFound("Complaint not found.");

    const existing = db
      .prepare("SELECT id FROM metoo_votes WHERE complaint_id = ? AND user_id = ?")
      .get(params.id, requester.id);

    let active;
    if (existing) {
      db.prepare("DELETE FROM metoo_votes WHERE id = ?").run(existing.id);
      active = false;
    } else {
      db.prepare("INSERT INTO metoo_votes (id, complaint_id, user_id, created_at) VALUES (?, ?, ?, ?)").run(
        newId("vote"),
        params.id,
        requester.id,
        new Date().toISOString()
      );
      active = true;
    }

    const count = db.prepare("SELECT COUNT(*) as c FROM metoo_votes WHERE complaint_id = ?").get(params.id).c;
    return ok({ i_me_tooed: active, me_too_count: count });
  } catch (err) {
    return serverError(err);
  }
}

module.exports = { POST };
