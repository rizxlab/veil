export const KNOWLEDGE_CATALOG = Object.freeze([
  {
    id: "tarot",
    title: "塔罗",
    english: "TAROT",
    description: "认识牌面、牌义与牌阵之间的语言。",
    children: [],
  },
  {
    id: "astro-dice",
    title: "星骰",
    english: "ASTRO DICE",
    description: "从星体、星座与宫位理解一次投掷。",
    children: [],
  },
  {
    id: "oracle",
    title: "神谕卡",
    english: "ORACLE",
    description: "为直觉保留一处温和的阅读空间。",
    children: [],
  },
]);

export function findKnowledgePath(segments) {
  let nodes = KNOWLEDGE_CATALOG;
  const trail = [];
  for (const segment of segments) {
    const node = nodes.find((item) => item.id === segment);
    if (!node) return null;
    trail.push(node);
    nodes = node.children || [];
  }
  return trail;
}
