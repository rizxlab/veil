import { icon } from "../../shared/ui/icons.js";

/** A single tabletop: drawn cards on the left, the deck at the right edge. */
export function renderTarot() {
  return /* HTML */ `
    <main
      id="main"
      class="tarot-page page-enter"
      tabindex="-1"
      aria-label="塔罗抽牌"
    >
      <nav class="tarot-navigation" aria-label="抽牌导航">
        <div class="reading-meta">
          <span id="spread-label" class="deck-label">自由牌阵 · 单副牌</span>
          <span id="selection-status" aria-live="polite">轻拨牌堆 · 点击选牌</span>
        </div>
        <div class="tarot-top-actions">
          <span id="remaining-count">剩余 78 张</span>
          <button class="top-action" id="new-reading" aria-label="开始新牌阵">${icon("plus")}<span>新牌阵</span></button>
          <button class="top-action" id="shuffle" aria-label="重新洗牌" title="只洗剩余的牌，桌面上的牌保持不动">${icon("shuffle")}<span>洗牌</span></button>
        </div>
      </nav>
      <div class="selection-bar" id="selection-bar" hidden>
        <button id="cancel-selection" class="button">取消</button>
        <button id="confirm-draw" class="button primary">确认抽牌 ${icon("arrow")}</button>
      </div>
      <section class="reading-room" aria-label="塔罗抽牌桌">
        <div class="table-area">
          <div class="reading-context">
            <div class="reading-title-row"><h1 id="reading-question">随心抽牌</h1><button class="title-settings" id="copy-reading" aria-label="复制牌阵内容" title="复制牌阵内容">${icon("copy")}</button><button class="title-settings" id="open-settings" aria-label="打开抽牌设置" title="抽牌设置">${icon("settings")}</button></div>
            <span id="draw-count" class="table-count" aria-live="polite">尚未抽牌</span>
          </div>
          <div
            id="table-cards"
            class="table-cards"
            tabindex="0"
            aria-label="已抽出的牌，可上下滚动"
          ></div>
        </div>
        <div class="deck-area">
          <div id="fan" class="fan" aria-label="扇形牌堆，拖动或使用方向键拨牌">
            <div class="fan-cards"></div>
          </div>
        </div>
      </section>
    </main>
  `;
}
