import { SERVICES } from "./config.js";
import { missingServiceEnv } from "./env.js";
import { getDistinctRandomGeos, getRealWorkerTrace, secureRandom } from "./geo.js";
import { logError, publicErrorCode } from "./http.js";
import { runService } from "./service-registry.js";

export async function handleScheduled(env, ctx) {
  const missing = [...new Set(SERVICES.flatMap(service => missingServiceEnv(env, service, "ping")))];
  if (missing.length) {
    logError("scheduled_configuration_error", { missing });
    throw new Error("configuration_error");
  }

  const delay = Math.floor(secureRandom() * 59_000);
  ctx.waitUntil(new Promise(resolve => {
    setTimeout(async () => {
      try {
        const simulated = getDistinctRandomGeos(SERVICES.length);
        const real = env.USE_REAL_TRACE === "true" ? await getRealWorkerTrace() : null;
        await Promise.all(SERVICES.map(async (service, index) => {
          const geo = real || simulated[index];
          const ok = await runService(service, env, geo);
          if (!ok) logError("scheduled_service_failed", { service, colo: geo.colo });
        }));
      } catch (error) {
        logError("scheduled_execution_error", { error: publicErrorCode(error) });
      } finally {
        resolve();
      }
    }, delay);
  }));
}
