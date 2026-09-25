import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, cp, readFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { listFiles } from "../scripts/files.mjs";
test("clean builds resolve every precache, HTML, CSS and manifest resource for root and project paths", async () => {
  const root = await mkdtemp(join(tmpdir(), "veil-base-test-"));
  try {
    for (const path of [
      "src",
      "scripts",
      "public",
      "tests",
      "index.html",
      "package.json",
    ])
      await cp(path, join(root, path), { recursive: true });
    let previous;
    for (const base of ["/", "/veil/", "/custom-site/"]) {
      execFileSync(process.execPath, ["scripts/build.mjs"], {
        cwd: root,
        env: { ...process.env, VEIL_BASE_PATH: base },
      });
      const read = (path) => readFile(join(root, "dist", path), "utf8");
      const manifest = JSON.parse(await read("manifest.webmanifest"));
      assert.equal(manifest.scope, base);
      assert.equal(manifest.start_url, base);
      assert.equal(manifest.id, base);
      const precache = JSON.parse(await read("precache.json"));
      assert.equal(precache.basePath, base);
      if (previous) assert.notEqual(precache.version, previous);
      previous = precache.version;
      const verify = async (path, relative = base) => {
        const url = new URL(path, "https://example.com" + relative);
        assert.ok(url.pathname.startsWith(base), url.href);
        await access(
          join(root, "dist", url.pathname.slice(base.length) || "index.html"),
        );
      };
      for (const path of precache.assets) await verify(path);
      for (const icon of manifest.icons) await verify(icon.src);
      for (const match of (await read("index.html")).matchAll(
        /(?:src|href)="([^"#]+)"/g,
      ))
        await verify(match[1]);
      for (const file of (await listFiles(join(root, "dist/src"))).filter((p) =>
        p.endsWith(".css"),
      )) {
        for (const match of (await readFile(file, "utf8")).matchAll(
          /url\(["']?([^\s"')]+)["']?\)/g,
        )) {
          if (!match[1].startsWith("data:"))
            await verify(
              match[1],
              base + file.slice(join(root, "dist").length + 1),
            );
        }
      }
      // Node's browser-style imports resolve the module's actual URL for generated image paths.
      const source = await read("src/shared/lib/site-path.js");
      const runtime = await import(
        "data:text/javascript," +
          encodeURIComponent(
            source.replace(
              "baseFromModule(import.meta.url)",
              `baseFromModule("https://example.com${base}src/shared/lib/site-path.js")`,
            ),
          )
      );
      assert.equal(
        runtime.sitePath("assets/icons/veil.svg"),
        base + "assets/icons/veil.svg",
      );
      assert.equal(
        JSON.parse(await readFile(join(root, "public/precache.json"), "utf8"))
          .basePath,
        "/",
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
