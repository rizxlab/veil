import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { listFiles } from "./files.mjs";
import { check } from "./check.mjs";
import { normalizeBasePath } from "./base-path.mjs";
const base = normalizeBasePath(process.env.VEIL_BASE_PATH);
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
const sourceHash = hash.digest("hex");
const workerSource = await readFile(
  "src/infrastructure/pwa/service-worker.js",
  "utf8",
);
const manifest = JSON.parse(
  await readFile("public/manifest.webmanifest", "utf8"),
);
async function offlineFiles(directory, basePath) {
  const version = createHash("sha256")
    .update(sourceHash + basePath)
    .digest("hex")
    .slice(0, 16);
  const assets = [
    basePath,
    ...sources
      .filter((p) => p !== "index.html")
      .map((p) => basePath + p.replace(/^public\//, "")),
  ];
  await writeFile(
    `${directory}/precache.json`,
    JSON.stringify({ version, basePath, assets }, null, 2),
  );
  await writeFile(
    `${directory}/sw.js`,
    workerSource.replaceAll("__VEIL_BUILD__", version),
  );
  return { version, assets };
}
// Dev artifacts always remain rooted at localhost:5106/, even after a Pages build.
await offlineFiles("public", "/");
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("public", "dist", { recursive: true });
await cp("src", "dist/src", { recursive: true });
await cp("index.html", "dist/index.html");
await writeFile(
  "dist/manifest.webmanifest",
  JSON.stringify(
    {
      ...manifest,
      id: base,
      start_url: base,
      scope: base,
      icons: manifest.icons.map((icon) => ({
        ...icon,
        src: base + icon.src.replace(/^\.?\//, ""),
      })),
    },
    null,
    2,
  ),
);
const { version, assets } = await offlineFiles("dist", base);
console.log(
  `Veil build complete: ${assets.length} local assets, base ${base}, version ${version}`,
);
