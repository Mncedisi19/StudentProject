const db = require("../../../../../db");
const { getUserFromRequest } = require("../../../../lib/auth");
const { runEscalationSweep } = require("../../../../lib/escalation");
const { ok, unauthorized, forbidden, serverError } = require("../../../../lib/apiResponse");

async function GET(request) {
  try {
    const requester = getUserFromRequest(request);
    if (!requester) return unauthorized();
    if (requester.role !== "MUNICIPAL_ADMIN") return forbidden();

    runEscalationSweep();

    const total = db.prepare("SELECT COUNT(*) as c FROM complaints").get().c;
    const submitted = db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status = 'SUBMITTED'").get().c;
    const assigned = db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status = 'ASSIGNED'").get().c;
    const inProgress = db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status = 'IN_PROGRESS'").get().c;
    const resolved = db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status = 'RESOLVED'").get().c;
    const closed = db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status = 'CLOSED'").get().c;
    const reopened = db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status = 'REOPENED'").get().c;
    const overdue = db.prepare("SELECT COUNT(*) as c FROM complaints WHERE is_overdue = 1").get().c;

    const pending = submitted + assigned;
    const resolvedRate = total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0;

    const byCategory = db
      .prepare("SELECT category, COUNT(*) as count FROM complaints GROUP BY category ORDER BY count DESC")
      .all();
    const byDepartment = db
      .prepare(
        "SELECT assigned_department as department, COUNT(*) as count FROM complaints GROUP BY assigned_department ORDER BY count DESC"
      )
      .all();
    const byPriority = db
      .prepare("SELECT priority, COUNT(*) as count FROM complaints GROUP BY priority")
      .all();

    const emergencyCount = db.prepare("SELECT COUNT(*) as c FROM emergency_logs").get().c;

    return ok({
      totals: {
        total,
        pending,
        submitted,
        assigned,
        inProgress,
        resolved,
        closed,
        reopened,
        overdue,
        resolvedRate,
        emergencyCount,
      },
      byCategory,
      byDepartment,
      byPriority,
    });
  } catch (err) {
    return serverError(err);
  }
}

module.exports = { GET };
