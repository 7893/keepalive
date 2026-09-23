import { MAX_PAGE, PAGE_SIZE } from "./config.js";
import { missingServiceEnv } from "./env.js";
import { getRandomGeo } from "./geo.js";
import { pingSupabase, querySupabase } from "./services/supabase.js";
import { pingOracle, queryOracle } from "./services/oracle.js";
import { pingDb2, queryDb2 } from "./services/db2.js";
import { parseBoundedInt } from "./http.js";

const failure = (env, service) => ({
  ok: false,
  error: "configuration_error",
  missing: missingServiceEnv(env, service, "query"),
  rows: [], count: 0, page: 1, limit: PAGE_SIZE, totalPages: 1
});

export async function runService(service, env, geo = getRandomGeo()) {
  if (service === "supabase") return pingSupabase(env, geo);
  if (service === "adb_us") return pingOracle(env.OCI_ADB_US_URL, env.OCI_ADB_US_USER, env.OCI_ADB_US_PASS, geo, service);
  if (service === "adb_jp") return pingOracle(env.OCI_ADB_JP_URL, env.OCI_ADB_JP_USER, env.OCI_ADB_JP_PASS, geo, service);
  if (service === "db2") return pingDb2(env, geo);
  throw new Error("unsupported_service");
}

export async function queryService(env, service, page) {
  if (missingServiceEnv(env, service, "query").length) return failure(env, service);
  if (service === "supabase") return querySupabase(env, page);
  if (service === "adb_us") return queryOracle(env.OCI_ADB_US_URL, env.OCI_ADB_US_USER, env.OCI_ADB_US_PASS, page);
  if (service === "adb_jp") return queryOracle(env.OCI_ADB_JP_URL, env.OCI_ADB_JP_USER, env.OCI_ADB_JP_PASS, page);
  return queryDb2(env, page);
}

export async function getStats(env, pages = {}) {
  const aliases = {
    supabase: pages.supabase || pages.sb_p,
    adb_us: pages.adb_us || pages.us_p,
    adb_jp: pages.adb_jp || pages.jp_p,
    db2: pages.db2 || pages.db2_p
  };
  const query = (service, value) => queryService(
    env,
    service,
    parseBoundedInt(value || pages.page, 1, 1, MAX_PAGE)
  ).then(result => [service, result]);
  return Object.fromEntries(await Promise.all([
    query("supabase", aliases.supabase),
    query("adb_us", aliases.adb_us),
    query("adb_jp", aliases.adb_jp),
    query("db2", aliases.db2)
  ]));
}
