import { MAX_PAGE, PAGE_SIZE } from "../config.js";
import { fetchWithTimeout, logError, parseBoundedInt, publicErrorCode } from "../http.js";
import { getRandomGeo } from "../geo.js";

export async function pingDb2(env, geo = getRandomGeo()) {
  try {
    const tokenResponse = await fetchWithTimeout("https://iam.cloud.ibm.com/identity/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${encodeURIComponent(env.IBMCLOUD_API_KEY || "")}`
    });
    if (!tokenResponse.ok) return false;
    const token = (await tokenResponse.json()).access_token;
    if (!token) return false;

    const deploymentId = env.DB2_DEPLOYMENT_ID || env.DB2_INSTANCE_ID;
    const deploymentResponse = await fetchWithTimeout(
      `https://api.db2.cloud.ibm.com/v5/ibm/deployments/${encodeURIComponent(deploymentId)}`,
      { headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json", "User-Agent": "Mozilla/5.0" } }
    );
    if (!deploymentResponse.ok) return false;
    if ((await deploymentResponse.json())?.deployment?.status !== "OK") return false;

    const key = env.SUPABASE_SECRET_KEY;
    const logResponse = await fetchWithTimeout(`${env.SUPABASE_URL}/rest/v1/db2_keepalive_logs`, {
      method: "POST",
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ status: "SUCCESS", ...geo })
    });
    return logResponse.ok || logResponse.status === 201;
  } catch (error) {
    logError("service_ping_failed", { service: "db2", error: publicErrorCode(error) });
    return false;
  }
}

export async function queryDb2(env, page = 1, limit = PAGE_SIZE) {
  const p = parseBoundedInt(page, 1, 1, MAX_PAGE);
  const l = parseBoundedInt(limit, PAGE_SIZE, 1, 100);
  try {
    const key = env.SUPABASE_SECRET_KEY;
    const offset = (p - 1) * l;
    const response = await fetchWithTimeout(
      `${env.SUPABASE_URL}/rest/v1/db2_keepalive_logs?select=id,ping_time,status,colo,country,city,region,ip&order=ping_time.desc&limit=${l}&offset=${offset}`,
      { headers: { "apikey": key, "Authorization": `Bearer ${key}`, "Prefer": "count=exact" } }
    );
    if (!response.ok) throw new Error("upstream_error");
    const rows = await response.json();
    const count = Number.parseInt((response.headers.get("content-range") || "").split("/")[1] || "0", 10) || 0;
    return { ok: true, rows: Array.isArray(rows) ? rows : [], count, page: p, limit: l, totalPages: Math.max(1, Math.ceil(count / l)) };
  } catch (error) {
    return { ok: false, error: publicErrorCode(error), rows: [], count: 0, page: p, limit: l, totalPages: 1 };
  }
}
