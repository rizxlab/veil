import { icon } from "../../shared/ui/icons.js";
const content = {
  "astro-dice": [
    "星骰",
    "ASTRO DICE",
    "星体、星座与宫位的故事，正在慢慢展开。",
  ],
  oracle: ["神谕卡", "ORACLE", "给直觉的一封来信，即将到来。"],
  knowledge: [
    "知识库",
    "THE LIBRARY",
    "关于塔罗与星象的基础知识，将在这里相遇。",
  ],
};
export function renderComingSoon(key) {
  const [title, en, description] = content[key] || [
    "页面未找到",
    "NOT FOUND",
    "沿着来时的路，回到你的空间。",
  ];
  return /* HTML */ `<main
    id="main"
    class="simple-page page-enter"
    tabindex="-1"
  >
    <a class="back-link" href="#/">${icon("back")}返回首页</a>
    <div class="empty-state">
      ${icon(key === "knowledge" ? "book" : "star")}
      <p class="eyebrow">${en}</p>
      <h1 style="font-size:28px;font-weight:400;letter-spacing:4px">
        ${title}
      </h1>
      <p>${description}<br />${content[key] ? "即将开放" : ""}</p>
      <a class="button" href="#/">回到首页 ${icon("arrow")}</a>
    </div>
  </main>`;
}
