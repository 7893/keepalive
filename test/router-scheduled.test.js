import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
import { handleScheduled } from "../src/scheduled.js";
import { ADMIN_ENV, authorized, FULL_ENV, request, withMockedFetch } from "./helpers.js";

test("router returns stable errors without contacting unconfigured services", async () => {
  let fetchCalls = 0;
  await withMockedFetch(async () => {
    fetchCalls += 1;
    throw new Error("unexpected fetch");
  }, async () => {
    const missingData = await worker.fetch(request("/api/data?service=supabase"), {}, {});
    assert.equal(missingData.status, 503);
    assert.deepEqual((await missingData.json()).missing, ["SUPABASE_URL", "SUPABASE_SECRET_KEY"]);

    const missingTrigger = await worker.fetch(
      request("/trigger?target=supabase", authorized()),
      ADMIN_ENV,
      {}
    );
    assert.equal(missingTrigger.status, 503);

    const missingClean = await worker.fetch(
      request("/admin/clean?action=repair", authorized()),
      ADMIN_ENV,
      {}
    );
    assert.equal(missingClean.status, 503);

    const head = await worker.fetch(request("/", { method: "HEAD" }), {}, {});
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");

    const notFound = await worker.fetch(request("/missing"), {}, {});
    assert.equal(notFound.status, 404);
    assert.equal(fetchCalls, 0);
  });
});

test("authorized debug output reports per-service configuration failures", async () => {
  const response = await worker.fetch(
    request("/debug", { headers: authorized().headers }),
    ADMIN_ENV,
    {}
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(body), ["supabase", "adb_us", "adb_jp", "db2"]);
  assert.ok(Object.values(body).every(result => result.error === "configuration_error"));
});

test("scheduled execution fails before queuing work when configuration is missing", async () => {
  const originalError = console.error;
  console.error = () => {};
  try {
    await assert.rejects(handleScheduled({}, { waitUntil() {} }), /configuration_error/);
  } finally {
    console.error = originalError;
  }
});

test("scheduled execution reaches every adapter using only mocked upstreams", async () => {
  const urls = [];
  let pending;
  const originalSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (callback, delay, ...args) => {
    if (callback.constructor?.name === "AsyncFunction") {
      queueMicrotask(() => callback(...args));
      return 0;
    }
    return originalSetTimeout(callback, delay, ...args);
  };

  try {
    await withMockedFetch(async (input) => {
      const url = String(input);
      urls.push(url);
      if (url.includes("identity/token")) return Response.json({ access_token: "test-access-token" });
      if (url.includes("ibm/deployments")) return Response.json({ deployment: { status: "OK" } });
      if (url.endsWith("/database/status")) return new Response(null, { status: 200 });
      return new Response(null, { status: 201 });
    }, async () => {
      await handleScheduled(FULL_ENV, {
        waitUntil(promise) {
          pending = promise;
        }
      });
      assert.ok(pending instanceof Promise);
      await pending;
    });
  } finally {
    globalThis.setTimeout = originalSetTimeout;
  }

  assert.equal(urls.length, 8);
  assert.ok(urls.some(url => url.startsWith(FULL_ENV.SUPABASE_URL)));
  assert.ok(urls.some(url => url.startsWith(FULL_ENV.OCI_ADB_US_URL)));
  assert.ok(urls.some(url => url.startsWith(FULL_ENV.OCI_ADB_JP_URL)));
  assert.ok(urls.some(url => url.includes("api.db2.cloud.ibm.com")));
});
