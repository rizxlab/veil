import { BASE_PATH, sitePath } from "../../shared/lib/site-path.js";
export async function registerOffline() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register(sitePath("sw.js"), {
      type: "module",
      scope: BASE_PATH,
      updateViaCache: "none",
    });
  } catch (error) {
    console.warn("Veil offline preparation unavailable:", error.message);
  }
}
