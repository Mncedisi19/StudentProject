const { getUserFromRequest } = require("../../../../lib/auth");
const { ok, serverError } = require("../../../../lib/apiResponse");

async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    return ok({ user: user || null });
  } catch (err) {
    return serverError(err);
  }
}

module.exports = { GET };
