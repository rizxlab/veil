import { CARD_BY_ID } from "../data/deck.js";
import { CARD_MEANINGS } from "../data/card-meanings.js";
import { cardImage } from "../data/skins.js";
import { icon } from "../../../shared/ui/icons.js";

/** Modal presentation for a confirmed card. It never reads or changes a draw. */
export function createCardDetail() {
  const dialog = document.createElement("dialog");
  dialog.className = "card-detail";
  dialog.setAttribute("aria-labelledby", "card-detail-title");
  document.body.append(dialog);
  let trigger = null;
  let previousOverflow = "";

  function close() {
    if (!dialog.open) return;
    dialog.close();
  }

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("close", () => {
    document.body.style.overflow = previousOverflow;
    trigger?.focus({ preventScroll: true });
    trigger = null;
  });

  return {
    open(cardId, source, skinId = "rws") {
      const card = CARD_BY_ID.get(cardId);
      const meaning = CARD_MEANINGS.get(cardId);
      if (!card || !meaning || dialog.open) return;
      trigger = source;
      dialog.innerHTML = /* HTML */ `
        <article class="card-detail-panel">
          <button class="card-detail-close" type="button" aria-label="关闭牌义介绍" autofocus>
            ${icon("close")}
          </button>
          <div class="card-detail-visual">
            <span class="card-detail-index">${meaning.number}</span>
            <div class="card-detail-image">
              <img src="${cardImage(card.id, skinId)}" alt="${card.name}牌面" width="350" height="600" />
              <span class="face-fallback" hidden>${card.name}<small>牌面加载失败</small></span>
            </div>
          </div>
          <div class="card-detail-copy">
            <p class="card-detail-arcana">${meaning.arcana}</p>
            <h2 id="card-detail-title">${card.name}</h2>
            <p class="card-detail-english">${card.english}</p>
            <p class="card-detail-overview">${meaning.overview}</p>
            <section class="card-meaning card-meaning-upright">
              <div><span>UPRIGHT</span><h3>正位</h3></div>
              <p>${meaning.upright}</p>
            </section>
            <section class="card-meaning card-meaning-reversed">
              <div><span>REVERSED</span><h3>逆位</h3></div>
              <p>${meaning.reversed}</p>
            </section>
            <p class="card-detail-note">牌义是一种观察视角，也请相信你对画面的第一感受。</p>
          </div>
        </article>`;
      dialog.querySelector(".card-detail-close").addEventListener("click", close);
      const image = dialog.querySelector(".card-detail-image img");
      image.addEventListener(
        "error",
        () => {
          image.hidden = true;
          image.nextElementSibling.hidden = false;
        },
        { once: true },
      );
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      dialog.showModal();
    },
    destroy() {
      if (dialog.open) dialog.close();
      dialog.remove();
    },
  };
}
