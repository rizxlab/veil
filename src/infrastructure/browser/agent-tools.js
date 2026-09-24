/** Optional read-only browser API. Never reveal the unconfirmed deck order. */
export function registerReadingTool(service) {
  if (!document.modelContext?.registerTool) return;
  const lifecycle = new AbortController();
  try {
    Promise.resolve(
      document.modelContext.registerTool(
        {
          name: "read_confirmed_tarot_readings",
          description:
            "Read locally saved, confirmed tarot draws. Does not draw, select, shuffle, or reveal unseen cards.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute(input) {
            if (
              !input ||
              typeof input !== "object" ||
              Array.isArray(input) ||
              Object.keys(input).length
            )
              throw new Error("Expected an empty object");
            const state = service.load();
            return [state.current, ...state.history]
              .filter((reading) => reading?.draws.length)
              .map(({ id, readingAt, draws }) => ({ id, readingAt, draws }));
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch((error) =>
      console.warn("Reading tool unavailable:", error.message),
    );
  } catch (error) {
    console.warn("Reading tool unavailable:", error.message);
  }
  window.addEventListener("pagehide", () => lifecycle.abort(), { once: true });
}
