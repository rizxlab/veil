import { createRoll } from "./roll.js";
export function createDiceService(repository) {
  const transaction = async (operation) => {
    const commit = () => {
      const state = repository.load();
      const next = operation(state);
      if (next === null) return null;
      if (next === state) return state;
      return repository.save(next, state.revision);
    };
    return typeof window !== "undefined" && globalThis.navigator?.locks
      ? navigator.locks.request("veil-dice", commit)
      : commit();
  };
  const cleanTitle = (title) => {
    if (typeof title !== "string" || title.length > 120)
      throw new Error("标题最多可以输入 120 个字。");
    return title.trim();
  };
  const cleanReadingAt = (readingAt) => {
    if (
      typeof readingAt !== "string" ||
      !Number.isFinite(Date.parse(readingAt))
    )
      throw new Error("请选择有效的占卜时间。");
    return new Date(readingAt).toISOString();
  };
  return {
    load: () => repository.load(),
    updateTitle: (title) =>
      transaction((state) => {
        const draftTitle = cleanTitle(title);
        return draftTitle === state.draftTitle
          ? state
          : { ...state, draftTitle };
      }),
    updateSettings: (title, readingAt) =>
      transaction((state) => {
        const draftTitle = cleanTitle(title);
        const draftReadingAt = cleanReadingAt(readingAt);
        return {
          ...state,
          draftTitle,
          draftReadingAt,
        };
      }),
    async roll(isActive = () => true) {
      let record = null;
      await transaction((state) => {
        if (!isActive()) return null;
        const rolledAt = new Date().toISOString();
        record = createRoll(
          globalThis.crypto,
          rolledAt,
          state.draftTitle,
          state.draftReadingAt || rolledAt,
        );
        return {
          ...state,
          draftReadingAt: null,
          records: [record, ...state.records],
        };
      });
      return record;
    },
  };
}
