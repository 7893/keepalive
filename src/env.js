export function missingEnv(env, names) {
  return names.filter(name => !env[name]);
}

export function serviceEnvNames(service, operation = "ping") {
  if (service === "supabase") return ["SUPABASE_URL", "SUPABASE_SECRET_KEY"];
  if (service === "adb_us") return ["OCI_ADB_US_URL", "OCI_ADB_US_USER", "OCI_ADB_US_PASS"];
  if (service === "adb_jp") return ["OCI_ADB_JP_URL", "OCI_ADB_JP_USER", "OCI_ADB_JP_PASS"];
  if (service === "db2") {
    return operation === "query"
      ? ["SUPABASE_URL", "SUPABASE_SECRET_KEY"]
      : ["IBMCLOUD_API_KEY", "SUPABASE_URL", "SUPABASE_SECRET_KEY"];
  }
  return [];
}

export function missingServiceEnv(env, service, operation = "ping") {
  const missing = missingEnv(env, serviceEnvNames(service, operation));
  if (service === "db2" && operation === "ping" && !env.DB2_DEPLOYMENT_ID && !env.DB2_INSTANCE_ID) {
    missing.push("DB2_DEPLOYMENT_ID|DB2_INSTANCE_ID");
  }
  return missing;
}
