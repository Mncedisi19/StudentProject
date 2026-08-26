const db = require("../../../../db");
const { newId } = require("../../../lib/ids");
const { getUserFromRequest } = require("../../../lib/auth");
const { ok, created, badRequest, unauthorized, forbidden, serverError } = require("../../../lib/apiResponse");

const VALID_SERVICES = ["POLICE", "AMBULANCE", "FIRE", "DISASTER_MANAGEMENT"];

async function POST(request) {
  try {
    const requester = getUserFromRequest(request);
    if (!requester) return unauthorized();

    const body = await request.json();
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const service_type = body.service_type;

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return badRequest("GPS coordinates are required to log an emergency.");
    }
    if (!VALID_SERVICES.includes(service_type)) {
      return badRequest("Invalid service type.");
    }

    const id = newId("emg");
    db.prepare(
      `INSERT INTO emergency_logs (id, user_id, latitude, longitude, service_type, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'LOGGED', ?)`
    ).run(id, requester.id, latitude, longitude, service_type, new Date().toISOString());

    const row = db.prepare("SELECT * FROM emergency_logs WHERE id = ?").get(id);
    return created({ log: row });
  } catch (err) {
    return serverError(err);
  }
}

async function GET(request) {
  try {
    const requester = getUserFromRequest(request);
    if (!requester) return unauthorized();
    if (requester.role !== "MUNICIPAL_ADMIN") return forbidden();

    const rows = db
      .prepare(
        `SELECT e.*, u.name as reporter_name, u.phone as reporter_phone
         FROM emergency_logs e JOIN users u ON u.id = e.user_id
         ORDER BY e.created_at DESC LIMIT 200`
      )
      .all();
    return ok({ logs: rows });
  } catch (err) {
    return serverError(err);
  }
}

module.exports = { GET, POST };
