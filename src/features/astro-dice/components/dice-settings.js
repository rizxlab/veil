import { escapeHtml } from "../../../shared/lib/html.js";
import { icon } from "../../../shared/ui/icons.js";
import {
  dateTimePickerMarkup,
  mountDateTimePicker,
} from "../../../shared/ui/date-time-picker.js";

export function createDiceSettings({ onSave }) {
  const dialog = document.createElement("dialog");
  dialog.className = "dice-settings";
  dialog.setAttribute("aria-labelledby", "dice-settings-title");
  document.body.append(dialog);
  let picker = null;
  let previousOverflow = "";

  const close = () => {
    if (dialog.open) dialog.close();
  };
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("close", () => {
    picker?.destroy();
    picker = null;
    document.body.style.overflow = previousOverflow;
  });
  dialog.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    const saved = await onSave(
      form.elements.title.value.trim(),
      picker.value(),
    );
    submit.disabled = false;
    if (saved) close();
  });

  return {
    open(state) {
      if (dialog.open) return;
      const readingAt = state.draftReadingAt || new Date().toISOString();
      dialog.innerHTML = /* HTML */ `
        <form class="dice-settings-panel">
          <header>
            <div><span class="eyebrow">ASTRO DICE SETTINGS</span><h2 id="dice-settings-title">本次星骰设置</h2></div>
            <button class="dice-settings-close" type="button" aria-label="关闭设置">${icon("close")}</button>
          </header>
          <div class="dice-settings-body">
            <section class="dice-setting-section">
              <div class="dice-setting-heading"><span>01</span><div><h3>主标题</h3><p>写下这次最想询问的主题。</p></div></div>
              <textarea name="title" maxlength="120" rows="2" placeholder="例如：此刻最需要留意什么？">${escapeHtml(state.draftTitle)}</textarea>
            </section>
            <section class="dice-setting-section">
              <div class="dice-setting-heading"><span>02</span><div><h3>占卜时间</h3><p>自定义时间用于下一次投掷，完成后自动恢复为当前时间。</p></div></div>
              ${dateTimePickerMarkup({ id: "dice-reading-time", name: "reading-at", value: readingAt })}
            </section>
          </div>
          <footer><button type="button" class="button dice-settings-cancel">取消</button><button type="submit" class="button primary">保存设置</button></footer>
        </form>`;
      dialog.querySelector(".dice-settings-close").addEventListener("click", close);
      dialog.querySelector(".dice-settings-cancel").addEventListener("click", close);
      picker = mountDateTimePicker(
        dialog.querySelector("[data-date-time-picker]"),
        readingAt,
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
