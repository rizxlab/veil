import { icon } from "../../shared/ui/icons.js";
import { notify } from "../../shared/ui/shell.js";
import { askConfirmation } from "../../shared/ui/confirm-dialog.js";

function archiveCounts(readingService, diceService) {
  try {
    return {
      tarot: readingService.load().history.length,
      dice: diceService.load().records.length,
      available: true,
    };
  } catch {
    return { tarot: "—", dice: "—", available: false };
  }
}

export function renderProfile(readingService, diceService) {
  const counts = archiveCounts(readingService, diceService);
  return /* HTML */ `<main id="main" class="profile-page page-enter" tabindex="-1">
    <header class="profile-heading">
      <span class="profile-avatar">${icon("person")}</span>
      <div>
        <span class="eyebrow">YOUR SPACE</span>
        <h1>未命名的探索者</h1>
        <p>本地访客</p>
      </div>
    </header>
    <section class="profile-archives" aria-labelledby="archive-heading">
      <div class="profile-section-title">
        <span>${icon("history")}</span>
        <div><h2 id="archive-heading">我的存档</h2><p>保留走过的每一次探索</p></div>
      </div>
      <div class="archive-counts">
        <div><strong>${counts.tarot}</strong><span>塔罗牌阵</span></div>
        <i aria-hidden="true"></i>
        <div><strong>${counts.dice}</strong><span>星骰记录</span></div>
      </div>
      ${counts.available ? "" : '<p class="archive-unavailable">暂时无法读取本地存档</p>'}
      <a class="button profile-history-button" href="#/history">查看历史记录 ${icon("arrow")}</a>
    </section>
    <aside class="archive-note" aria-label="存档说明">
      ${icon("lock")}
      <div><h2>关于存档</h2><p>存档仅保存在当前设备和浏览器中，清除浏览器数据可能导致记录丢失。更多存档功能陆续开发中，敬请期待。</p></div>
    </aside>
    <section class="profile-danger" aria-labelledby="profile-danger-heading">
      <div>
        <span class="profile-danger-mark" aria-hidden="true">×</span>
        <div><h2 id="profile-danger-heading">清空本地记录</h2><p>删除当前设备中的塔罗牌阵、塔罗历史与星骰记录。</p></div>
      </div>
      <button type="button" class="button profile-clear">清空全部记录</button>
    </section>
  </main>`;
}

export function mountProfile(root, readingService, localDataService, onCleared) {
  const controller = new AbortController();
  const button = root.querySelector(".profile-clear");
  button.addEventListener(
    "click",
    async () => {
      const accepted = await askConfirmation({
        title: "清空全部本地记录？",
        message:
          "塔罗当前牌阵、塔罗历史、星骰记录与标题草稿都会永久删除，且无法恢复。",
        confirmLabel: "确认全部清空",
        destructive: true,
      });
      if (!accepted) return;
      button.disabled = true;
      try {
        localDataService.clearAll();
        await readingService.ensureSession();
        await onCleared();
        notify("本地记录已全部清空。");
      } catch (error) {
        button.disabled = false;
        notify(error.message);
      }
    },
    { signal: controller.signal },
  );
  return () => controller.abort();
}
