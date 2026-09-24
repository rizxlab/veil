import { CARD_MEANINGS } from "../data/card-meanings.js";
import { CARD_BY_ID } from "../data/deck.js";
import { DEFAULT_READING_TITLE } from "./reading-config.js";

export function formatReadingForClipboard(session) {
  const lines = [session.config.question || DEFAULT_READING_TITLE, ""];
  session.config.spread.positions.forEach((position, index) => {
    const draw = session.draws.find((item) => item.positionId === position.id);
    lines.push(`${index + 1}. ${position.label}`);
    if (position.question) lines.push(`牌位问题：${position.question}`);
    if (!draw) {
      lines.push("抽牌结果：尚未抽牌", "");
      return;
    }
    const card = CARD_BY_ID.get(draw.cardId);
    const meaning = CARD_MEANINGS.get(draw.cardId);
    const orientation = draw.reversed ? "逆位" : "正位";
    lines.push(
      `塔罗牌：${card.name}（${orientation}）`,
      `牌面简介：${meaning.overview}`,
      `${orientation}牌义：${draw.reversed ? meaning.reversed : meaning.upright}`,
      "",
    );
  });
  return lines.join("\n").trim();
}
