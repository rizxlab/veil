import { renderDice } from "../features/astro-dice/dice-view.js";
import { mountDice } from "../features/astro-dice/dice.js";
import { createDiceService } from "../features/astro-dice/domain/dice-service.js";
import {
  createDiceRepository,
  DICE_STORAGE_KEY,
} from "../infrastructure/storage/dice-repository.js";
import { shell, notify } from "../shared/ui/shell.js";
import { renderHome } from "../features/home/home.js";
import { renderProfile, mountProfile } from "../features/profile/profile.js";
import { renderComingSoon } from "../features/coming-soon/coming-soon.js";
import { mountTarot } from "../features/tarot/tarot.js";
import { renderTarot } from "../features/tarot/tarot-view.js";
import { renderHistory, mountHistory } from "../features/history/history.js";
import { createReadingRepository } from "../infrastructure/storage/reading-repository.js";
import { createReadingService } from "../features/tarot/domain/reading-service.js";
import { registerOffline } from "../infrastructure/pwa/register.js";
import { registerReadingTool } from "../infrastructure/browser/agent-tools.js";
import { createLocalDataService } from "../infrastructure/storage/local-data-service.js";
import { renderKnowledge } from "../features/knowledge/knowledge.js";
const browserStorage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
};
const service = createReadingService(createReadingRepository(browserStorage));
const diceService = createDiceService(createDiceRepository(browserStorage));
const localDataService = createLocalDataService(browserStorage);
let cleanup,
  revision = 0;
async function render() {
  const current = ++revision;
  cleanup?.();
  cleanup = null;
  const path = location.hash.replace(/^#\/?/, "").replace(/\/$/, "");
  const app = document.querySelector("#app");
  app.dataset.page = path || "home";
  const content =
    path === "tarot"
      ? renderTarot()
      : path === "astro-dice"
        ? renderDice()
        : path === "history"
          ? renderHistory()
          : path === "profile"
            ? renderProfile(service, diceService)
          : path === "knowledge" || path.startsWith("knowledge/")
            ? renderKnowledge(path) || renderComingSoon("missing")
          : !path
            ? renderHome()
            : renderComingSoon(path);
  app.innerHTML = shell(content, { showProfile: !path });
  window.scrollTo(0, 0);
  document.title =
    (path.startsWith("knowledge/")
      ? "知识库"
      : ({
      tarot: "随心抽牌",
      history: "历史记录",
      profile: "个人信息",
      "astro-dice": "星骰",
      oracle: "神谕卡",
      knowledge: "知识库",
    }[path] || "未明")) + " · Veil";
  if (path === "tarot") {
    const dispose = await mountTarot(app.querySelector("main"), service);
    if (current === revision) cleanup = dispose;
    else dispose();
  }
  if (path === "astro-dice")
    cleanup = mountDice(app.querySelector("main"), diceService);
  if (path === "history") mountHistory(app, service, diceService);
  if (path === "profile")
    cleanup = mountProfile(
      app.querySelector("main"),
      service,
      localDataService,
      render,
    );
}
window.addEventListener("hashchange", () => {
  render();
  document.querySelector("#main")?.focus({ preventScroll: true });
});
window.addEventListener("storage", (event) => {
  if (event.key === "veil.readings.v1" || event.key === DICE_STORAGE_KEY) {
    render();
    notify("记录已与当前浏览器的其他页面同步。");
  }
});
render();
registerOffline();
registerReadingTool(service);
document.querySelector(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  document.querySelector("#main")?.focus();
});
