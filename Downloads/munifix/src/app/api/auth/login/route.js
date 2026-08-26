const db = require("../../../../../db");
const { verifyPassword, signToken, cookieOptions, COOKIE_NAME } = require("../../../../lib/auth");
const { ok, badRequest, unauthorized, serverError } = require("../../../../lib/apiResponse");

async function POST(request) {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) return badRequest("Email and password are required.");

    const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!row) return unauthorized("Incorrect email or password.");

    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) return unauthorized("Incorrect email or password.");

    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      phone: row.phone,
      department: row.department,
    };
    const token = signToken(user);

    const res = ok({ user });
    res.cookies.set(COOKIE_NAME, token, cookieOptions());
    return res;
  } catch (err) {
    return serverError(err);
  }
}

module.exports = { POST };
