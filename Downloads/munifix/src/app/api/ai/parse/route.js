const { getUserFromRequest } = require("../../../../lib/auth");
const { parseComplaintText } = require("../../../../lib/aiParser");
const { ok, badRequest, unauthorized, serverError } = require("../../../../lib/apiResponse");

async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized();

    const { text } = await request.json();
    if (!text || text.trim().length < 5) {
      return badRequest("Describe the issue in a sentence or two first.");
    }

    const result = parseComplaintText(text);
    return ok(result);
  } catch (err) {
    return serverError(err);
  }
}

module.exports = { POST };
