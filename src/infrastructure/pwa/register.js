export async function registerOffline() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js", {
      type: "module",
      updateViaCache: "none",
    });
  } catch (error) {
    console.warn("Veil offline preparation unavailable:", error.message);
  }
}
