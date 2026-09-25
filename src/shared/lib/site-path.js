/** Resolve from this module, never from the current hash route or hostname. */
export function baseFromModule(moduleUrl) {
  const url = new URL(moduleUrl);
  return url.protocol === "file:" ? "/" : new URL("../../../", url).pathname;
}
export const BASE_PATH = baseFromModule(import.meta.url);
export const sitePath = (path = "") => BASE_PATH + path.replace(/^\/+/, "");
