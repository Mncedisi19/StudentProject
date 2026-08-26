const db = require("../../db");
const { newId } = require("./ids");

const PRIORITY_ORDER = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function bumpPriority(priority) {
  const idx = PRIORITY_ORDER.indexOf(priority);
  if (idx === -1) return priority;
  return PRIORITY_ORDER[Math.min(idx + 1, PRIORITY_ORDER.length - 1)];
}

// Runs the overdue sweep: any complaint still open (SUBMITTED, ASSIGNED, or
// IN_PROGRESS) whose response_deadline has passed gets is_overdue = 1 and,
// the first time it crosses that line, a priority bump + an audit event.
// Called opportunistically on read endpoints so the demo stays "live"
// without needing an external process scheduler, and is also exposed at
// /api/cron/escalate for a real cron job or hosting platform's scheduler.
function runEscalationSweep() {
  const now = new Date().toISOString();

  const candidates = db
    .prepare(
      `SELECT id, priority, is_overdue FROM complaints
       WHERE status IN ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS')
       AND response_deadline IS NOT NULL
       AND response_deadline < ?`
    )
    .all(now);

  if (candidates.length === 0) return { checked: 0, escalated: 0 };

  const updateStmt = db.prepare(
    `UPDATE complaints SET is_overdue = 1, priority = ?, updated_at = ? WHERE id = ?`
  );
  const eventStmt = db.prepare(
    `INSERT INTO complaint_events (id, complaint_id, actor_id, event_type, message, created_at)
     VALUES (?, ?, NULL, 'ESCALATED', ?, ?)`
  );

  let escalated = 0;
  db.exec("BEGIN");
  try {
    for (const row of candidates) {
      const wasAlreadyOverdue = !!row.is_overdue;
      const newPriority = wasAlreadyOverdue ? row.priority : bumpPriority(row.priority);
      updateStmt.run(newPriority, now, row.id);
      if (!wasAlreadyOverdue) {
        eventStmt.run(
          newId("evt"),
          row.id,
          `Auto-escalated: missed response deadline. Priority raised to ${newPriority}.`,
          now
        );
        escalated += 1;
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  return { checked: candidates.length, escalated };
}

module.exports = { runEscalationSweep, bumpPriority };
