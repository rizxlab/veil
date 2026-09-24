import { TAROT_SKINS } from "../data/skins.js";

export const DEFAULT_READING_TITLE = "随心抽牌";
export const MAX_SPREAD_POSITIONS = 12;

export const TABLECLOTHS = Object.freeze([
  { id: "white", name: "月白", color: "#ffffff" },
  { id: "mist", name: "雾紫", color: "#f3eff6" },
  { id: "sage", name: "浅鼠尾草", color: "#edf3ee" },
  { id: "pearl", name: "月光灰", color: "#f1f2f4" },
  { id: "ivory", name: "暖米色", color: "#f7f2e9" },
  {
    id: "celestial",
    name: "星轨薄暮",
    color: "#eee9f0",
    pattern: "/assets/tablecloths/celestial-veil.svg",
  },
]);

const templates = {
  single: ["此刻最需要看见什么"],
  double: ["当前的状态", "可以采取的建议"],
  triple: ["过去如何影响现在", "此刻正在发生什么", "未来可能走向哪里"],
};

export const SPREAD_OPTIONS = Object.freeze([
  { id: "free", name: "自由牌阵", description: "自定义 1–12 个牌位" },
  { id: "single", name: "经典单牌", description: "1 个牌位" },
  { id: "double", name: "经典双牌", description: "2 个牌位" },
  { id: "triple", name: "过去 · 现在 · 未来", description: "3 个牌位" },
]);

const position = (index, question = "") => ({
  id: `position-${index + 1}`,
  label: `牌位 ${index + 1}`,
  question,
});

export function createSpread(type = "free", count = 3) {
  const questions =
    type === "free"
      ? Array.from(
          { length: Math.max(1, Math.min(MAX_SPREAD_POSITIONS, count)) },
          () => "",
        )
      : templates[type];
  if (!questions) throw new Error("未知的牌阵模板");
  return {
    type,
    name: SPREAD_OPTIONS.find((item) => item.id === type).name,
    positions: questions.map((question, index) => position(index, question)),
  };
}

export function createReadingConfig() {
  return {
    deckCount: 1,
    skinId: "rws",
    clothId: "white",
    question: "",
    spread: createSpread(),
  };
}

export function spreadLimit(spread) {
  return spread.positions.length;
}

export function validReadingConfig(config) {
  return Boolean(
    config &&
      [1, 2].includes(config.deckCount) &&
      TAROT_SKINS.some((skin) => skin.id === config.skinId) &&
      TABLECLOTHS.some((cloth) => cloth.id === config.clothId) &&
      typeof config.question === "string" &&
      config.question.length <= 120 &&
      config.spread &&
      SPREAD_OPTIONS.some((spread) => spread.id === config.spread.type) &&
      typeof config.spread.name === "string" &&
      Array.isArray(config.spread.positions) &&
      config.spread.positions.length > 0 &&
      config.spread.positions.length <= MAX_SPREAD_POSITIONS &&
      config.spread.positions.every(
        (item, index) =>
          item?.id === `position-${index + 1}` &&
          item.label === `牌位 ${index + 1}` &&
          typeof item.question === "string" &&
          item.question.length <= 80,
      )
  );
}
