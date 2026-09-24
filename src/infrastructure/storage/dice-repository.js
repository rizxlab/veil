import { validRoll } from "../../features/astro-dice/domain/roll.js";
export const DICE_STORAGE_KEY = "veil.dice.v1";
const emptyStore = () => ({
  version: 3,
  revision: 0,
  draftTitle: "",
  draftReadingAt: null,
  records: [],
});
const valid = (state) =>
  state?.version === 3 &&
  Number.isSafeInteger(state.revision) &&
  state.revision >= 0 &&
  typeof state.draftTitle === "string" &&
  state.draftTitle.length <= 120 &&
  (state.draftReadingAt === null ||
    (typeof state.draftReadingAt === "string" &&
      Number.isFinite(Date.parse(state.draftReadingAt)))) &&
  Array.isArray(state.records) &&
  state.records.every(validRoll) &&
  new Set(state.records.map((r) => r.id)).size === state.records.length;

const migrateLegacy = (state) => {
  if (
    ![1, 2].includes(state?.version) ||
    !Number.isSafeInteger(state.revision) ||
    state.revision < 0 ||
    !Array.isArray(state.records)
  )
    return null;
  const records = state.records.map((record) => ({
    ...record,
    title: state.version === 1 ? "" : record.title,
    readingAt: record.rolledAt,
  }));
  const migrated = {
    ...state,
    version: 3,
    draftTitle: state.version === 1 ? "" : state.draftTitle,
    draftReadingAt: null,
    records,
  };
  return valid(migrated) ? migrated : null;
};
/** Independent versioned collection: existing tarot data never needs migration. */
export function createDiceRepository(storage) {
  return {
    load() {
      let raw;
      try {
        raw = storage.getItem(DICE_STORAGE_KEY);
      } catch {
        throw new Error("无法访问星骰记录，请检查浏览器存储权限。");
      }
      if (raw === null) return emptyStore();
      try {
        const parsed = JSON.parse(raw);
        const state = [1, 2].includes(parsed?.version)
          ? migrateLegacy(parsed)
          : parsed;
        if (!valid(state)) throw Error();
        return state;
      } catch {
        throw new Error("星骰记录格式异常，已保留原始数据，请先备份后再处理。");
      }
    },
    save(next, revision) {
      if (this.load().revision !== revision)
        throw new Error("星骰记录已更新，请重试。");
      const state = { ...next, version: 3, revision: revision + 1 };
      if (!valid(state)) throw new Error("星骰数据校验失败，本次结果未保存。");
      try {
        storage.setItem(DICE_STORAGE_KEY, JSON.stringify(state));
      } catch {
        throw new Error("本地空间不足或存储不可用，本次投掷未保存。");
      }
      return state;
    },
  };
}
