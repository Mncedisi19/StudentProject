const fs = require("fs/promises");
const path = require("path");
const { newId } = require("./ids");

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

const EXT_BY_TYPE = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

// Persists a File (from a parsed FormData) to disk under public/uploads and
// returns { url, filename } where url is a path servable directly by Next's
// static file handler (e.g. "/uploads/cmp_abc123.jpg").
async function saveUploadedFile(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("No file provided");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error("File too large (max 8MB)");
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const ext = EXT_BY_TYPE[file.type] || path.extname(file.name || "") || ".bin";
  const filename = `${newId("img")}${ext}`;
  const destPath = path.join(UPLOAD_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(destPath, buffer);

  return { url: `/uploads/${filename}`, filename, originalName: file.name || null };
}

module.exports = { saveUploadedFile, ALLOWED_TYPES, MAX_BYTES };
