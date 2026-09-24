import { icon } from "../../../shared/ui/icons.js";
import { escapeHtml } from "../../../shared/lib/html.js";
import {
  dateTimePickerMarkup,
  mountDateTimePicker,
} from "../../../shared/ui/date-time-picker.js";
import {
  createSpread,
  SPREAD_OPTIONS,
  TABLECLOTHS,
} from "../domain/reading-config.js";
import { TAROT_SKINS } from "../data/skins.js";

const spreadPreview = (type) => {
  const count = { free: 5, single: 1, double: 2, triple: 3 }[type] || 1;
  return `<span class="spread-preview spread-preview--${type}" aria-hidden="true"><span class="spread-glyph">${Array.from({ length: count }, () => "<i></i>").join("")}</span>${type === "free" ? "<em>1–12</em>" : ""}</span>`;
};

export function createTarotSettings({ onSave }) {
  const dialog = document.createElement("dialog");
  dialog.className = "tarot-settings";
  dialog.setAttribute("aria-labelledby", "tarot-settings-title");
  document.body.append(dialog);
  let session = null;
  let revision = 0;
  let spread = null;
  let dateTimePicker = null;
  let previousOverflow = "";

  const readPositionQuestions = () => {
    const form = dialog.querySelector("form");
    if (!form || !spread) return;
    spread.positions = spread.positions.map((position, index) => ({
      ...position,
      question: form.elements[`position-${index}`]?.value.trim() || "",
    }));
  };

  const renderPositions = () => {
    const target = dialog.querySelector("#setting-positions");
    const countControl = dialog.querySelector("#free-count-field");
    countControl.hidden = spread.type !== "free";
    const countOutput = dialog.querySelector("#free-position-count");
    if (countOutput) countOutput.value = spread.positions.length;
    countControl
      .querySelectorAll("[data-position-delta]")
      .forEach((button) => {
        const next =
          spread.positions.length + Number(button.dataset.positionDelta);
        button.disabled = next < 1 || next > 12;
      });
    target.innerHTML = spread.positions.length
      ? spread.positions
          .map(
            (position, index) => /* HTML */ `
              <label class="position-setting">
                <span>${index + 1}</span>
                <span><b>${position.label}</b><input name="position-${index}" maxlength="80" value="${escapeHtml(position.question)}" placeholder="输入这个牌位想问的问题" /></span>
              </label>`,
          )
          .join("")
      : "";
  };

  const close = () => {
    if (dialog.open) dialog.close();
  };

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
    const countButton = event.target.closest("[data-position-delta]");
    if (countButton && dialog.contains(countButton)) {
      readPositionQuestions();
      const previous = spread.positions;
      spread = createSpread(
        "free",
        spread.positions.length + Number(countButton.dataset.positionDelta),
      );
      spread.positions.forEach((position, index) => {
        if (previous[index]?.question)
          position.question = previous[index].question;
      });
      renderPositions();
    }
  });
  dialog.addEventListener("close", () => {
    dateTimePicker?.destroy();
    dateTimePicker = null;
    document.body.style.overflow = previousOverflow;
  });
  dialog.addEventListener("change", (event) => {
    if (event.target.name === "spread-type") {
      readPositionQuestions();
      const previous = spread;
      spread = createSpread(
        event.target.value,
        event.target.value === "free" ? previous.positions.length || 3 : 3,
      );
      spread.positions.forEach((position, index) => {
        if (previous.positions[index]?.question)
          position.question = previous.positions[index].question;
      });
      renderPositions();
    }
  });
  dialog.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const submit = form.querySelector('[type="submit"]');
    readPositionQuestions();
    const config = {
      deckCount: Number(form.elements["deck-count"].value),
      skinId: form.elements["skin-id"].value,
      clothId: form.elements["cloth-id"].value,
      question: form.elements.question.value.trim(),
      spread: structuredClone(spread),
    };
    const readingAt = dateTimePicker.value();
    submit.disabled = true;
    const saved = await onSave(config, readingAt, session, revision);
    submit.disabled = false;
    if (saved) close();
  });

  return {
    open(currentSession, currentRevision) {
      if (dialog.open) return;
      session = structuredClone(currentSession);
      revision = currentRevision;
      spread = structuredClone(session.config.spread);
      const config = session.config;
      dialog.innerHTML = /* HTML */ `
        <form class="tarot-settings-panel">
          <header>
            <div><span class="eyebrow">READING SETTINGS</span><h2 id="tarot-settings-title">本次抽牌设置</h2></div>
            <button class="settings-close" type="button" aria-label="关闭设置">${icon("close")}</button>
          </header>
          <div class="settings-body">
            <section class="setting-section">
              <div class="setting-heading"><span>01</span><div><h3>主标题</h3><p>写下这次最想询问的主题。</p></div></div>
              <textarea name="question" maxlength="120" rows="2" placeholder="例如：这段关系正邀请我看见什么？">${escapeHtml(config.question)}</textarea>
            </section>
            <section class="setting-section">
              <div class="setting-heading"><span>02</span><div><h3>占卜时间</h3><p>默认使用当前时间，也可以为这次记录指定其他时间。</p></div></div>
              ${dateTimePickerMarkup({ id: "tarot-reading-time", name: "reading-at", value: session.readingAt })}
            </section>
            <section class="setting-section">
              <div class="setting-heading"><span>03</span><div><h3>牌位设计</h3><p>选择模板，并为每个牌位写下具体问题。</p></div></div>
              <div class="spread-options">
                ${SPREAD_OPTIONS.map((item) => `<label><input type="radio" name="spread-type" value="${item.id}" ${spread.type === item.id ? "checked" : ""} />${spreadPreview(item.id)}<span class="spread-caption"><b>${item.name}</b><small>${item.description}</small></span></label>`).join("")}
              </div>
              <div id="free-count-field" class="position-count" ${spread.type === "free" ? "" : "hidden"}><span>牌位数量</span><div class="position-stepper" role="group" aria-label="调整自由牌阵的牌位数量"><button type="button" data-position-delta="-1" aria-label="减少一个牌位">−</button><output id="free-position-count" aria-live="polite">${spread.positions.length || 3}</output><button type="button" data-position-delta="1" aria-label="增加一个牌位">＋</button></div></div>
              <div id="setting-positions" class="position-settings"></div>
            </section>
            <section class="setting-section">
              <div class="setting-heading"><span>04</span><div><h3>牌组数量</h3><p>两副牌会完整混合，每一张都保持相同概率。</p></div></div>
              <div class="setting-options two-options">
                <label><input type="radio" name="deck-count" value="1" ${config.deckCount === 1 ? "checked" : ""} /><span><b>单副牌</b><small>78 张</small></span></label>
                <label><input type="radio" name="deck-count" value="2" ${config.deckCount === 2 ? "checked" : ""} /><span><b>双副牌</b><small>156 张</small></span></label>
              </div>
            </section>
            <section class="setting-section">
              <div class="setting-heading"><span>05</span><div><h3>牌面</h3><p>切换整副牌的视觉风格。</p></div></div>
              <div class="skin-options">
                ${TAROT_SKINS.map((skin) => `<label><input type="radio" name="skin-id" value="${skin.id}" ${config.skinId === skin.id ? "checked" : ""} /><span class="skin-preview"><img src="${skin.preview}" alt="${skin.name}示例" /></span><b>${skin.name}</b><small>${skin.description}</small></label>`).join("")}
              </div>
            </section>
            <section class="setting-section">
              <div class="setting-heading"><span>06</span><div><h3>桌布</h3><p>选择一层安静、低饱和的桌面颜色。</p></div></div>
              <div class="cloth-options">
                ${TABLECLOTHS.map((cloth) => `<label title="${cloth.name}"><input type="radio" name="cloth-id" value="${cloth.id}" ${config.clothId === cloth.id ? "checked" : ""} /><span style="--cloth:${cloth.color};--cloth-pattern:${cloth.pattern ? `url('${cloth.pattern}')` : "none"}"></span><small>${cloth.name}</small></label>`).join("")}
              </div>
            </section>
          </div>
          <footer><button type="button" class="button settings-cancel">取消</button><button type="submit" class="button primary">保存设置</button></footer>
        </form>`;
      dialog.querySelector(".settings-close").addEventListener("click", close);
      dialog.querySelector(".settings-cancel").addEventListener("click", close);
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      renderPositions();
      dateTimePicker = mountDateTimePicker(
        dialog.querySelector("[data-date-time-picker]"),
        session.readingAt,
      );
      dialog.showModal();
    },
    destroy() {
      if (dialog.open) dialog.close();
      dialog.remove();
    },
  };
}
