import { DICE, resultFaces } from "../data/faces.js";
import { icon } from "../../../shared/ui/icons.js";
import { escapeHtml } from "../../../shared/lib/html.js";
export function diceHistoryRecord(record, format) {
  const faces = resultFaces(record);
  return `<details class="history-record dice-history-record"><summary><span class="history-symbol">${icon("star")}</span><span class="history-record-info"><strong>${record.title ? escapeHtml(record.title) : "星骰"}</strong><time datetime="${record.readingAt}">${format.format(new Date(record.readingAt))}</time><span class="history-names">${faces.map((f) => f.name).join(" · ")}</span></span><span class="history-total">3 枚骰子</span>${icon("chevron")}</summary><div class="dice-history-result">${faces.map((face, i) => `<div><small>${DICE[i].label}</small><b aria-hidden="true">${face.symbol}</b><span>${face.name}</span></div>`).join("")}</div></details>`;
}
