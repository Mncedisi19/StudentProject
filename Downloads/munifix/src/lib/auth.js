const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../../db");

const COOKIE_NAME = "munifix_token";
const JWT_SECRET = process.env.JWT_SECRET || "munifix-dev-secret-change-me-in-production";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL_SECONDS }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Reads + verifies the auth cookie off a NextRequest and loads the fresh
// user row from the DB (never trust stale JWT claims for authorization).
function getUserFromRequest(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = db.prepare("SELECT id, name, email, role, phone, department, created_at FROM users WHERE id = ?").get(payload.sub);
  return user || null;
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  };
}

module.exports = {
  COOKIE_NAME,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  getUserFromRequest,
  cookieOptions,
};
