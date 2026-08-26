const { getUserFromRequest } = require("../../../../lib/auth");
const { classifyImageHint } = require("../../../../lib/aiParser");
const { ok, badRequest, unauthorized, serverError } = require("../../../../lib/apiResponse");

async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized();

    const { filename } = await request.json();
    if (!filename) return badRequest("filename is required.");

    const suggestion = classifyImageHint(filename);
    return ok({ suggestion });
  } catch (err) {
    return serverError(err);
  }
}

module.exports = { POST };
