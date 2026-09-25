import { access, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { listFiles } from "./files.mjs";
import { DECK } from "../src/features/tarot/data/deck.js";
import { TAROT_SKINS, cardImage } from "../src/features/tarot/data/skins.js";
export async function check() {
  const files = [
    ...(await listFiles("src")),
    ...(await listFiles("scripts")),
    ...(await listFiles("tests")),
  ];
  for (const file of files.filter((p) => /\.(js|mjs)$/.test(p))) {
    const result = spawnSync(process.execPath, ["--check", file], {
      encoding: "utf8",
    });
    if (result.status !== 0) throw new Error(result.stderr);
  }
  for (const skin of TAROT_SKINS)
    for (const card of DECK) {
      const file = "public" + cardImage(card.id, skin.id);
      await access(file);
      const bytes = await readFile(file);
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8)
        throw new Error(`Invalid JPEG: ${file}`);
    }
  const manifest = JSON.parse(
    await readFile("public/manifest.webmanifest", "utf8"),
  );
  for (const icon of manifest.icons)
    await access("public/" + icon.src.replace(/^\.?\//, ""));
  if (DECK.length !== 78 || new Set(DECK.map((c) => c.id)).size !== 78)
    throw new Error("Deck must have 78 unique cards");
  console.log(
    `Checked JavaScript, PWA icons, and ${DECK.length * TAROT_SKINS.length} local tarot images.`,
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await check();
