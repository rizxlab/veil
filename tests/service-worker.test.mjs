import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
const source = await readFile(
  new URL("../src/infrastructure/pwa/service-worker.js", import.meta.url),
  "utf8",
);
function worker(
  base,
  version,
  { stores = new Map(), fail = false, manifestBase = base } = {},
) {
  const listeners = {};
  let offline = false,
    skipped = false,
    claimed = false;
  const scope = "https://example.com" + base;
  const cacheName = "veil-offline-" + encodeURIComponent(base) + "-" + version;
  const cacheFor = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const entries = stores.get(name);
    return {
      async addAll(paths) {
        if (fail) throw Error("network");
        for (const path of paths)
          entries.set(
            new URL(path, scope).href,
            new Response("cached " + path),
          );
      },
      async match(req) {
        const key = typeof req === "string" ? req : req.url;
        return entries.get(key)?.clone();
      },
    };
  };
  const self = {
    location: new URL(scope + "sw.js"),
    addEventListener: (type, fn) => (listeners[type] = fn),
    skipWaiting: async () => {
      skipped = true;
    },
    clients: {
      claim: async () => {
        claimed = true;
      },
    },
  };
  vm.runInNewContext(source.replaceAll("__VEIL_BUILD__", version), {
    self,
    URL,
    Response,
    caches: {
      open: async (name) => cacheFor(name),
      keys: async () => [...stores.keys()],
      delete: async (name) => stores.delete(name),
    },
    fetch: async (request) => {
      if (offline) throw Error("offline");
      if (String(request).endsWith("/precache.json"))
        return Response.json({
          version,
          basePath: manifestBase,
          assets: [base, base + "assets/test.svg"],
        });
      return new Response("network");
    },
  });
  return {
    stores,
    cacheName,
    get skipped() {
      return skipped;
    },
    get claimed() {
      return claimed;
    },
    offline() {
      offline = true;
    },
    async event(type) {
      let result;
      listeners[type]({ waitUntil: (p) => (result = p) });
      await result;
    },
    async request(path, mode = "cors", method = "GET") {
      let result;
      listeners.fetch({
        request: { url: "https://example.com" + path, mode, method },
        respondWith: (p) => (result = p),
      });
      return result;
    },
  };
}
test("worker installs scoped assets and supports offline navigation and images on both bases", async () => {
  for (const base of ["/", "/veil/"]) {
    const w = worker(base, "v1");
    await w.event("install");
    assert.ok(w.skipped);
    await w.event("activate");
    assert.ok(w.claimed);
    w.offline();
    assert.equal(
      await (await w.request(base + "?launch=1", "navigate")).text(),
      "cached " + base,
    );
    assert.equal(
      await (await w.request(base + "assets/test.svg")).text(),
      "cached " + base + "assets/test.svg",
    );
    assert.equal((await w.request(base + "missing.svg")).status, 503);
    if (base !== "/") assert.equal(await w.request("/other/app.js"), undefined);
    assert.equal(await w.request(base, "cors", "POST"), undefined);
  }
});
test("update replaces only this application scope and serves the new complete cache", async () => {
  const old = worker("/veil/", "old");
  await old.event("install");
  old.stores.set(
    "veil-offline-" + encodeURIComponent("/another/") + "-v1",
    new Map(),
  );
  old.stores.set("unrelated-cache", new Map());
  const next = worker("/veil/", "new", { stores: old.stores });
  await next.event("install");
  await next.event("activate");
  assert.ok(!next.stores.has(old.cacheName));
  assert.ok(next.stores.has(next.cacheName));
  assert.equal(next.stores.size, 3);
  next.offline();
  assert.equal((await next.request("/veil/", "navigate")).status, 200);
});
test("failed precache or mismatched base never activates or removes the previous working build", async () => {
  const old = worker("/veil/", "old");
  await old.event("install");
  for (const options of [{ fail: true }, { manifestBase: "/wrong/" }]) {
    const next = worker("/veil/", "bad", { stores: old.stores, ...options });
    await assert.rejects(next.event("install"));
    assert.ok(!next.skipped);
    assert.ok(old.stores.has(old.cacheName));
    assert.ok(!old.stores.has(next.cacheName));
  }
});
