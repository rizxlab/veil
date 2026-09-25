/** One build input for root sites and project sites; reject ambiguous URL syntax. */
export function normalizeBasePath(value = "/") {
  if (value === "" || value === "/") return "/";
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\/?$/.test(value))
    throw new Error("VEIL_BASE_PATH must be / or a path such as /veil/.");
  return value.replace(/\/$/, "") + "/";
}
