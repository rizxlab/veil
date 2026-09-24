import { diceHistoryRecord } from "../astro-dice/components/history-record.js";
import { icon } from "../../shared/ui/icons.js";
import { CARD_BY_ID } from "../tarot/data/deck.js";
import {
  cardFace,
  attachImageFallbacks,
} from "../tarot/components/card-face.js";
import { notify } from "../../shared/ui/shell.js";
import { escapeHtml } from "../../shared/lib/html.js";
const dateFormat = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
export function renderHistory() {
  return /* HTML */ `<main
    id="main"
    class="simple-page history-page page-enter"
    tabindex="-1"
  >
    <a class="back-link" href="#/">${icon("back")}返回首页</a>
    <div class="page-heading">
      <span class="eyebrow">YOUR LITTLE ARCHIVE</span>
      <h1>留住相遇的片刻。</h1>
      <p>每一次抽牌与投掷，都留在这里。</p>
    </div>
    <div id="history-content"></div>
    <p class="history-privacy">
      ${icon("lock")}记录仅保存在当前浏览器。清除网站数据会删除这些记录。
    </p>
  </main>`;
}
export function mountHistory(root, service, diceService) {
  const target = root.querySelector("#history-content");
  try {
    const state = service.load();
    const tarotRecords = [
      ...(state.current?.draws.length ? [state.current] : []),
      ...state.history,
    ];
    const records = [
      ...tarotRecords.map((record) => ({
        kind: "tarot",
        date: record.readingAt,
        record,
      })),
      ...diceService
        .load()
        .records.map((record) => ({
          kind: "dice",
          date: record.readingAt,
          record,
        })),
    ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    target.innerHTML = records.length
      ? `<div class="history-summary">共 ${records.length} 次记录<span>按占卜时间排列</span></div><div class="history-list">${records.map(({ kind, record }) => (kind === "dice" ? diceHistoryRecord(record, dateFormat) : `<details class="history-record"><summary><span class="history-symbol">${icon("star")}</span><span class="history-record-info"><strong>${record.config?.question ? escapeHtml(record.config.question) : "随心抽牌"} <i>${state.current?.id === record.id ? "进行中" : "已收起"}</i></strong><time datetime="${record.readingAt}">${dateFormat.format(new Date(record.readingAt))} · ${escapeHtml(record.config?.spread.name || "自由牌阵")}</time><span class="history-names">${record.draws.map((d) => `${CARD_BY_ID.get(d.cardId).name} · ${d.reversed ? "逆位" : "正位"}`).join(" / ")}</span></span><span class="history-total">${record.draws.length} 张牌</span>${icon("chevron")}</summary><div class="history-cards">${record.draws.map((draw, i) => { const position = record.config?.spread.positions.find((item) => item.id === draw.positionId); return cardFace(draw, i, { position: position?.question || position?.label || "", skinId: record.config?.skinId || "rws" }); }).join("")}</div></details>`)).join("")}</div>`
      : `<div class="empty-state">${icon("history")}<h2>故事，从一次相遇开始。</h2><p>抽牌或投掷完成后，记录会自动留在这里。</p><a class="button primary" href="#/tarot">去抽一张牌 ${icon("arrow")}</a></div>`;
    attachImageFallbacks(target);
  } catch (error) {
    target.innerHTML =
      '<div class="empty-state"><h2>暂时无法读取记录</h2><p>原有数据未被更改。请检查浏览器存储权限或备份本地数据。</p></div>';
    notify(error.message);
  }
}
