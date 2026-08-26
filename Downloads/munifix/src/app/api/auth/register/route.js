const db = require("../../../../../db");
const { newId } = require("../../../../lib/ids");
const { hashPassword, signToken, cookieOptions, COOKIE_NAME } = require("../../../../lib/auth");
const { ok, badRequest, serverError } = require("../../../../lib/apiResponse");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function POST(request) {
  try {
    const body = await request.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const role = body.role === "MUNICIPAL_ADMIN" ? "MUNICIPAL_ADMIN" : "RESIDENT";
    const phone = (body.phone || "").trim() || null;
    const department = role === "MUNICIPAL_ADMIN" ? (body.department || "General Services").trim() : null;

    if (!name || name.length < 2) return badRequest("Please provide your full name.");
    if (!EMAIL_RE.test(email)) return badRequest("Please provide a valid email address.");
    if (password.length < 6) return badRequest("Password must be at least 6 characters.");

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) return badRequest("An account with this email already exists.");

    const password_hash = await hashPassword(password);
    const id = newId("usr");

    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, phone, department)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, name, email, password_hash, role, phone, department);

    const user = { id, name, email, role, phone, department };
    const token = signToken(user);

    const res = ok({ user }, { status: 201 });
    res.cookies.set(COOKIE_NAME, token, cookieOptions());
    return res;
  } catch (err) {
    return serverError(err);
  }
}

module.exports = { POST };
