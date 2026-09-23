import test from "node:test";
import assert from "node:assert/strict";
import { missingEnv, missingServiceEnv, serviceEnvNames } from "../src/env.js";
import { escapeHtml, fetchWithTimeout, parseBoundedInt } from "../src/http.js";
import { publicIp, publicQueryResult } from "../src/privacy.js";
import { withMockedFetch } from "./helpers.js";

test("environment requirements reflect each service operation", () => {
  assert.deepEqual(serviceEnvNames("supabase", "ping"), [
    "SUPABASE_URL", "SUPABASE_SECRET_KEY"
  ]);
  assert.deepEqual(serviceEnvNames("db2", "query"), [
    "SUPABASE_URL", "SUPABASE_SECRET_KEY"
  ]);
  assert.deepEqual(missingEnv({ PRESENT: "yes" }, ["PRESENT", "MISSING"]), ["MISSING"]);
  assert.deepEqual(missingServiceEnv({}, "db2", "ping"), [
    "IBMCLOUD_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "DB2_DEPLOYMENT_ID|DB2_INSTANCE_ID"
  ]);
  assert.deepEqual(missingServiceEnv({
    IBMCLOUD_API_KEY: "test-key",
    SUPABASE_URL: "https://example.test",
    SUPABASE_SECRET_KEY: "test-secret",
    DB2_INSTANCE_ID: "test-instance"
  }, "db2", "ping"), []);
});

test("input and output helpers clamp, escape, and mask values", () => {
  assert.equal(parseBoundedInt("5", 1, 1, 10), 5);
  assert.equal(parseBoundedInt("999", 1, 1, 10), 10);
  assert.equal(parseBoundedInt("not-a-number", 3, 1, 10), 3);
  assert.equal(escapeHtml(`<a href="x">O'Reilly & Co</a>`), "&lt;a href=&quot;x&quot;&gt;O&#39;Reilly &amp; Co&lt;/a&gt;");
  assert.equal(publicIp("203.0.113.42"), "203.0.113.xxx");
  assert.equal(publicIp("2001:db8:abcd:12::1"), "2001:db8:abcd::");
  assert.equal(publicIp("203.0.113.42", true), "203.0.113.42");
  assert.equal(publicIp("invalid"), "—");

  const result = publicQueryResult({ rows: [{ id: 1, ip: "198.51.100.9" }] });
  assert.equal(result.rows[0].ip, "198.51.100.xxx");
});

test("fetch timeout becomes a stable public error", async () => {
  await withMockedFetch((_input, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
  }), async () => {
    await assert.rejects(fetchWithTimeout("https://upstream.test", {}, 1), /upstream_timeout/);
  });
});
