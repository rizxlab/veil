import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { listFiles } from "./files.mjs";
import { check } from "./check.mjs";
await check();
const sources = [
  "index.html",
  ...(await listFiles("src")),
  ...(await listFiles("public")),
].filter((p) => !["public/sw.js", "public/precache.json"].includes(p));
const hash = createHash("sha256");
for (const path of sources) {
  hash.update(path);
  hash.update(await readFile(path));
}
const version = hash.digest("hex").slice(0, 16);
const assets = [
  "/",
  ...sources
    .filter((p) => p !== "index.html")
    .map((p) => "/" + p.replace(/^public\//, "")),
];
await writeFile(
  "public/precache.json",
  JSON.stringify({ version, assets }, null, 2),
);
const workerSource = await readFile(
  "src/infrastructure/pwa/service-worker.js",
  "utf8",
);
await writeFile(
  "public/sw.js",
  workerSource.replaceAll("__VEIL_BUILD__", version),
);
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("public", "dist", { recursive: true });
await cp("src", "dist/src", { recursive: true });
await cp("index.html", "dist/index.html");
console.log(
  `Veil build complete: ${assets.length} local assets, version ${version}`,
);
