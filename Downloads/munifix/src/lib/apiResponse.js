const { NextResponse } = require("next/server");

function ok(data, init) {
  return NextResponse.json(data, { status: 200, ...init });
}

function created(data) {
  return NextResponse.json(data, { status: 201 });
}

function badRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function unauthorized(message = "Not authenticated") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message = "Not allowed") {
  return NextResponse.json({ error: message }, { status: 403 });
}

function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

function serverError(err) {
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

module.exports = { ok, created, badRequest, unauthorized, forbidden, notFound, serverError };
