import { missingEnv } from "./env.js";
import { cleanSupabase } from "./services/supabase.js";
import { cleanOracle } from "./services/oracle.js";

const REQUIRED = [
  "SUPABASE_URL", "SUPABASE_SECRET_KEY",
  "OCI_ADB_US_URL", "OCI_ADB_US_USER", "OCI_ADB_US_PASS",
  "OCI_ADB_JP_URL", "OCI_ADB_JP_USER", "OCI_ADB_JP_PASS"
];

export async function cleanServices(env, action) {
  const missing = missingEnv(env, REQUIRED);
  if (missing.length) return { success: false, error: "configuration_error", missing };

  const [supabase, adb_us, adb_jp] = await Promise.all([
    cleanSupabase(env, action),
    cleanOracle(env.OCI_ADB_US_URL, env.OCI_ADB_US_USER, env.OCI_ADB_US_PASS, action),
    cleanOracle(env.OCI_ADB_JP_URL, env.OCI_ADB_JP_USER, env.OCI_ADB_JP_PASS, action)
  ]);
  const results = { supabase, adb_us, adb_jp };
  return { success: Object.values(results).every(result => result.ok), results };
}
