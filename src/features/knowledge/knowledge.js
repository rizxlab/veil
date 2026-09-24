import { icon } from "../../shared/ui/icons.js";
import {
  KNOWLEDGE_CATALOG,
  findKnowledgePath,
} from "./data/catalog.js";

const sectionCards = (sections, prefix) => /* HTML */ `
  <div class="knowledge-sections">
    ${sections
      .map(
        (section, index) => /* HTML */ `
          <a class="knowledge-card" href="#/${prefix}/${section.id}">
            <span class="knowledge-card-index">${String(index + 1).padStart(2, "0")}</span>
            <span class="knowledge-card-mark" aria-hidden="true">${index === 0 ? "✦" : index === 1 ? "◎" : "◇"}</span>
            <span class="eyebrow">${section.english}</span>
            <h2>${section.title}</h2>
            <p>${section.description}</p>
            <span class="knowledge-card-action">进入栏目 ${icon("arrow")}</span>
          </a>`,
      )
      .join("")}
  </div>`;

export function renderKnowledge(path = "knowledge") {
  const segments = path.split("/").slice(1).filter(Boolean);
  const trail = findKnowledgePath(segments);
  if (segments.length && !trail) return null;
  const current = trail?.at(-1);
  const children = current?.children || KNOWLEDGE_CATALOG;
  const prefix = ["knowledge", ...segments].join("/");
  return /* HTML */ `<main id="main" class="knowledge-page page-enter" tabindex="-1">
    <nav class="knowledge-breadcrumb" aria-label="知识库路径">
      <a href="#/">首页</a><span>/</span><a href="#/knowledge">知识库</a>
      ${(trail || []).map((item) => `<span>/</span><span>${item.title}</span>`).join("")}
    </nav>
    <header class="knowledge-heading">
      <span class="knowledge-heading-icon">${icon("book")}</span>
      <div>
        <span class="eyebrow">${current?.english || "THE LIBRARY"}</span>
        <h1>${current?.title || "知识库"}</h1>
        <p>${current?.description || "从一点好奇开始，慢慢认识塔罗、星象与直觉的语言。"}</p>
      </div>
    </header>
    ${
      children.length
        ? sectionCards(children, prefix)
        : `<section class="knowledge-empty">${icon("star")}<h2>内容正在整理中</h2><p>这个栏目已经为后续的子目录与文章留好位置。</p><a class="button" href="#/knowledge">返回知识库</a></section>`
    }
  </main>`;
}
