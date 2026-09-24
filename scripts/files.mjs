import { readdir } from "node:fs/promises";
export async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) =>
      e.isDirectory()
        ? listFiles(`${directory}/${e.name}`)
        : `${directory}/${e.name}`,
    ),
  );
  return nested.flat().sort();
}
