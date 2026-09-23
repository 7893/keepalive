import { errorResponse } from "./http.js";

export async function verifyAdminRequest(request, env) {
  const expected = env.TRIGGER_SECRET;
  if (!expected) {
    return { ok: false, response: errorResponse(503, "admin_auth_not_configured", "Administrative routes are disabled.") };
  }

  const authorization = request.headers.get("authorization") || "";
  const hasBearer = authorization.startsWith("Bearer ");
  const provided = hasBearer ? authorization.slice(7) : "";
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected))
  ]);
  const matches = crypto.subtle.timingSafeEqual(providedHash, expectedHash);

  if (!hasBearer || !provided || !matches) {
    return { ok: false, response: errorResponse(401, "unauthorized", "A valid Bearer token is required.") };
  }
  return { ok: true };
}
