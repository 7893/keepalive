import { MAX_PAGE, PAGE_SIZE } from "../config.js";
import { fetchWithTimeout, logError, parseBoundedInt, publicErrorCode } from "../http.js";
import { getRandomGeo } from "../geo.js";

function credentials(user, pass) {
  return `Basic ${btoa(`${user}:${pass}`)}`;
}

export async function pingOracle(ordsBase, user, pass, geo = getRandomGeo(), service = "oracle") {
  const authorization = credentials(user, pass);
  try {
    const status = await fetchWithTimeout(`${ordsBase}/_/db-api/stable/database/status`, {
      headers: { "Authorization": authorization, "Content-Type": "application/json" }
    });
    if (!status.ok) return false;

    // ORDS receives SQL text here, so every interpolated value is escaped explicitly.
    const field = value => String(value || "").replace(/'/g, "''");
    const sql = `INSERT INTO keepalive_log (status, colo, country, city, region, ip) VALUES ('SUCCESS', '${field(geo.colo)}', '${field(geo.country)}', '${field(geo.city)}', '${field(geo.region)}', '${field(geo.ip)}')`;
    const insert = await fetchWithTimeout(`${ordsBase}/_/sql`, {
      method: "POST",
      headers: { "Authorization": authorization, "Content-Type": "application/sql" },
      body: sql
    });
    return insert.ok;
  } catch (error) {
    logError("service_ping_failed", { service, error: publicErrorCode(error) });
    return false;
  }
}

export async function queryOracle(ordsBase, user, pass, page = 1, limit = PAGE_SIZE) {
  const p = parseBoundedInt(page, 1, 1, MAX_PAGE);
  const l = parseBoundedInt(limit, PAGE_SIZE, 1, 100);
  try {
    const headers = { "Authorization": credentials(user, pass), "Content-Type": "application/json" };
    const offset = (p - 1) * l;
    const [rowsResponse, countResponse] = await Promise.all([
      fetchWithTimeout(`${ordsBase}/_/sql`, {
        method: "POST", headers,
        body: JSON.stringify({ statementText: `SELECT id, ping_time, status, colo, country, city, region, ip FROM keepalive_log ORDER BY ping_time DESC OFFSET ${offset} ROWS FETCH NEXT ${l} ROWS ONLY` })
      }),
      fetchWithTimeout(`${ordsBase}/_/sql`, {
        method: "POST", headers,
        body: JSON.stringify({ statementText: "SELECT COUNT(*) AS cnt FROM keepalive_log" })
      })
    ]);
    if (!rowsResponse.ok || !countResponse.ok) throw new Error("upstream_error");
    const rowsData = await rowsResponse.json();
    const countData = await countResponse.json();
    const rows = rowsData?.items?.[0]?.resultSet?.items || [];
    const count = Number(countData?.items?.[0]?.resultSet?.items?.[0]?.cnt) || 0;
    return { ok: true, rows, count, page: p, limit: l, totalPages: Math.max(1, Math.ceil(count / l)) };
  } catch (error) {
    return { ok: false, error: publicErrorCode(error), rows: [], count: 0, page: p, limit: l, totalPages: 1 };
  }
}

export async function cleanOracle(ordsBase, user, pass, action) {
  try {
    const headers = { "Authorization": credentials(user, pass), "Content-Type": "application/sql" };
    const sql = action === "delete"
      ? "DELETE FROM keepalive_log WHERE city = 'Edge' OR (colo = 'SIN' AND country = 'US')"
      : "BEGIN UPDATE keepalive_log SET city = 'Salt Lake City', region = 'Utah' WHERE colo = 'SLC' AND city = 'Edge'; UPDATE keepalive_log SET country = 'SG' WHERE colo = 'SIN' AND country = 'US'; COMMIT; END;";
    const response = await fetchWithTimeout(`${ordsBase}/_/sql`, { method: "POST", headers, body: sql });
    return { action, ok: response.ok, status: response.status };
  } catch (error) {
    return { action, ok: false, error: publicErrorCode(error) };
  }
}
