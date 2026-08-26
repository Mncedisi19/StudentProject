const { getUserFromRequest } = require("../../../lib/auth");
const { saveUploadedFile } = require("../../../lib/upload");
const { ok, badRequest, unauthorized, serverError } = require("../../../lib/apiResponse");

async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized();

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) return badRequest("No file provided under 'file' field.");

    const { url, originalName } = await saveUploadedFile(file);
    return ok({ url, originalName });
  } catch (err) {
    if (err.message?.startsWith("Unsupported") || err.message?.startsWith("File too large")) {
      return badRequest(err.message);
    }
    return serverError(err);
  }
}

module.exports = { POST };
