const { COOKIE_NAME } = require("../../../../lib/auth");
const { ok } = require("../../../../lib/apiResponse");

async function POST() {
  const res = ok({ success: true });
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}

module.exports = { POST };
