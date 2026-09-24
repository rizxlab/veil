import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const production = process.argv.includes("--production");
const root = resolve(production ? "dist" : ".");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
};
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost:5106").pathname,
    );
    const publicFile =
      pathname.startsWith("/assets/") ||
      ["/manifest.webmanifest", "/sw.js", "/precache.json"].includes(pathname);
    const path = resolve(
      root,
      (!production && publicFile ? "public/" : "") +
        (pathname === "/" ? "index.html" : pathname.slice(1)),
    );
    if (
      !path.startsWith(root + sep) ||
      (!production &&
        !publicFile &&
        !pathname.startsWith("/src/") &&
        pathname !== "/" &&
        pathname !== "/index.html")
    ) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    if (!(await stat(path)).isFile()) throw new Error("Not a file");
    res.writeHead(200, {
      "Content-Type": mime[extname(path)] || "application/octet-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(await readFile(path));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? "Veil 固定端口 5106 已被占用。请排查占用进程；不会改用其他端口。"
      : error,
  );
  process.exitCode = 1;
});
server.listen(5106, "localhost", () =>
  console.log(
    `Veil ${production ? "production" : "development"} · http://localhost:5106/`,
  ),
);
