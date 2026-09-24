import { CARD_BY_ID } from "../data/deck.js";
import { cardImage } from "../data/skins.js";
import { escapeHtml } from "../../../shared/lib/html.js";
export function cardFace(
  draw,
  index,
  {
    animate = false,
    compact = false,
    landing = false,
    interactive = false,
    position = "",
    skinId = "rws",
  } = {},
) {
  const card = CARD_BY_ID.get(draw.cardId);
  return /* HTML */ `<figure
    class="drawn-card ${animate ? "newly-drawn" : ""} ${compact ? "drawn-card--compact" : ""} ${landing ? "is-landing" : ""}"
    ${interactive ? `data-card-id="${card.id}" role="button" tabindex="0" aria-label="查看${card.name}的牌义介绍"` : ""}
  >
    <div class="card-flip">
      <div class="card-front">
        <img
          class="${draw.reversed ? "reversed" : ""}"
          src="${cardImage(card.id, skinId)}"
          alt="${card.name} · ${draw.reversed ? "逆位" : "正位"}"
          width="180"
          height="300"
        /><span class="face-fallback" hidden
          >${card.name}<small>牌面加载失败</small></span
        >
      </div>
      ${animate || landing ? '<div class="card-reveal-back"></div>' : ""}
    </div>
    <figcaption>
      ${position ? `<span class="card-position">${escapeHtml(position)}</span>` : ""}
      <span class="draw-number">${String(index + 1).padStart(2, "0")}</span
      ><strong>${card.name}</strong
      ><span class="orientation ${draw.reversed ? "is-reversed" : ""}"
        >${draw.reversed ? "逆位" : "正位"}</span
      ><small>${card.english}</small>
    </figcaption>
  </figure>`;
}
export function attachImageFallbacks(root) {
  root.querySelectorAll(".card-front img").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        img.hidden = true;
        img.nextElementSibling.hidden = false;
      },
      { once: true },
    );
  });
}
