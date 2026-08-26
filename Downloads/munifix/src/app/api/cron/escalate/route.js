const { runEscalationSweep } = require("../../../../lib/escalation");
const { ok, serverError } = require("../../../../lib/apiResponse");

// Hit this from an external cron (Vercel Cron, a system crontab curl job,
// GitHub Actions schedule, etc). It's also called inline by the complaints
// and stats GET endpoints so the demo self-escalates without any scheduler.
async function handle() {
  try {
    const result = runEscalationSweep();
    return ok({ ranAt: new Date().toISOString(), ...result });
  } catch (err) {
    return serverError(err);
  }
}

module.exports = { GET: handle, POST: handle };
