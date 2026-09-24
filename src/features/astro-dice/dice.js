import { resultFaces } from "./data/faces.js";
import { showDice } from "./components/die.js";
import { createRollAnimation } from "./components/roll-animation.js";
import { notify } from "../../shared/ui/shell.js";
import { createDiceSettings } from "./components/dice-settings.js";
export function mountDice(root, service) {
  let disposed = false,
    busy = false,
    state = null;
  const button = root.querySelector("#roll-dice");
  const settingsButton = root.querySelector("#open-dice-settings");
  const status = root.querySelector("#dice-status");
  const title = root.querySelector("#dice-title");
  const controller = new AbortController();
  const animation = createRollAnimation(root);
  const refreshTitle = () => {
    title.textContent = state?.draftTitle || "星骰";
  };
  const settings = createDiceSettings({
    async onSave(nextTitle, readingAt) {
      try {
        state = await service.updateSettings(nextTitle, readingAt);
        if (!disposed) refreshTitle();
        return true;
      } catch (error) {
        if (!disposed) notify(error.message);
        return false;
      }
    },
  });
  const display = (record) => {
    showDice(root, record);
    root.querySelector("#dice-result-heading").textContent = "本次星象";
    root.querySelector("#dice-result-values").innerHTML = resultFaces(record)
      .map((face) => `<span>${face.name}</span>`)
      .join("");
    button.querySelector("span").textContent = "投掷";
  };
  try {
    state = service.load();
    refreshTitle();
    const last = state.records[0];
    if (last) {
      display(last);
      status.textContent = "上次结果已恢复";
    }
  } catch (error) {
    status.textContent = "记录暂时无法读取";
    button.disabled = true;
    settingsButton.disabled = true;
    notify(error.message);
  }
  const roll = async () => {
    if (busy || disposed) return;
    busy = true;
    button.disabled = true;
    settingsButton.disabled = true;
    root.classList.add("is-rolling");
    root.setAttribute("aria-busy", "true");
    status.textContent = "星骰正在落下…";
    try {
      await animation.play();
      if (disposed) return;
      const record = await service.roll(() => !disposed);
      if (disposed || !record) return;
      state = service.load();
      display(record);
      status.textContent = "投掷完成";
    } catch (error) {
      if (!disposed) {
        status.textContent = "未能保存，请重试";
        notify(error.message);
      }
    } finally {
      busy = false;
      if (!disposed) {
        button.disabled = false;
        settingsButton.disabled = false;
        root.classList.remove("is-rolling");
        root.removeAttribute("aria-busy");
      }
    }
  };
  button.addEventListener("click", roll, { signal: controller.signal });
  settingsButton.addEventListener(
    "click",
    () => {
      if (!busy && state) settings.open(state);
    },
    { signal: controller.signal },
  );
  return () => {
    disposed = true;
    animation.cancel();
    settings.destroy();
    controller.abort();
  };
}
