import test from "node:test";
import assert from "node:assert/strict";
import { normalizeBasePath } from "../scripts/base-path.mjs";
import { baseFromModule } from "../src/shared/lib/site-path.js";
test("base paths support root, project and nested sites, rejecting URL injection", () => {
  for (const [input, output] of [
    [undefined, "/"],
    ["", "/"],
    ["/", "/"],
    ["/veil", "/veil/"],
    ["/a/b/", "/a/b/"],
  ])
    assert.equal(normalizeBasePath(input), output);
  for (const input of [
    "veil",
    "//host/",
    "/../",
    "/a?b",
    "/a#b",
    "/a%2fb",
    "https://example.com/",
  ])
    assert.throws(() => normalizeBasePath(input));
});
test("runtime base comes from the deployed module without repository-name assumptions", () => {
  for (const base of ["/", "/veil/", "/another/project/"])
    assert.equal(
      baseFromModule(`https://example.com${base}src/shared/lib/site-path.js`),
      base,
    );
  assert.equal(baseFromModule("file:///tmp/src/shared/lib/site-path.js"), "/");
});
