import { notify } from "../../shared/ui/shell.js";
import { mountFan } from "./components/fan.js";
import { cardFace, attachImageFallbacks } from "./components/card-face.js";
import { createShuffleAnimation } from "./components/shuffle-animation.js";
import { createCardDetail } from "./components/card-detail.js";
import { createTarotSettings } from "./components/tarot-settings.js";
import { askConfirmation } from "../../shared/ui/confirm-dialog.js";
import { copyText } from "../../shared/lib/clipboard.js";
import { formatReadingForClipboard } from "./domain/reading-export.js";
import {
  DEFAULT_READING_TITLE,
  MAX_SPREAD_POSITIONS,
  spreadLimit,
  TABLECLOTHS,
} from "./domain/reading-config.js";
export async function mountTarot(root, service) {
  let state,
    fan,
    selected = null,
    busy = false,
    dragging = false,
    activeMotion = null,
    activeShuffle = null,
    disposed = false;
  const selection = root.querySelector("#selection-bar"),
    table = root.querySelector("#table-cards"),
    fanRoot = root.querySelector("#fan");
  const controller = new AbortController();
  const cardDetail = createCardDetail();
  const applyCloth = () => {
    const cloth = TABLECLOTHS.find(
      (item) => item.id === state?.current.config.clothId,
    );
    root.style.setProperty("--tablecloth", cloth?.color || "#ffffff");
    root.style.setProperty(
      "--tablecloth-pattern",
      cloth?.pattern ? `url("${cloth.pattern}")` : "none",
    );
  };
  const settings = createTarotSettings({
    async onSave(config, readingAt, snapshot, expectedRevision) {
      const deckChanged =
        config.deckCount !== snapshot.config.deckCount ||
        config.skinId !== snapshot.config.skinId;
      const spreadChanged =
        config.spread.type !== snapshot.config.spread.type ||
        config.spread.positions.length !== snapshot.config.spread.positions.length;
      let reset = false;
      if (
        (deckChanged || spreadChanged) &&
        (snapshot.draws.length > 0 || snapshot.config.spread.type !== "free")
      ) {
        reset = await askConfirmation({
          title: "重新开始这次抽牌？",
          message:
            "牌组或牌阵结构发生了变化。确认后，已有抽牌会归档，并使用新的设置重新准备牌堆。",
          confirmLabel: "归档并重置",
        });
        if (!reset) return false;
      }
      busy = true;
      updateControls();
      try {
        state = await service.configure(
          snapshot.id,
          expectedRevision,
          config,
          reset,
          readingAt,
        );
        if (!disposed) refresh();
        return true;
      } catch (error) {
        if (!disposed) notify(error.message);
        return false;
      } finally {
        busy = false;
        if (!disposed) updateControls();
      }
    },
  });
  const setSelection = (index) => {
    selected = index;
    selection.hidden = index === null;
    root.querySelector("#selection-status").textContent =
      index === null ? "轻拨牌堆 · 点击选牌" : "向左拖出，或点击确认";
  };
  function updateControls() {
    root
      .querySelectorAll(
        "#new-reading,#shuffle,#open-settings,#copy-reading,#confirm-draw,#cancel-selection",
      )
      .forEach((button) => (button.disabled = busy || dragging));
    fanRoot.inert = busy;
    root.querySelector("#shuffle").disabled =
      busy || dragging || !state || state.current.deck.length < 2;
  }
  function onDragState(active, ready) {
    dragging = active;
    updateControls();
    if (active)
      root.querySelector("#selection-status").textContent = ready
        ? "松手即可抽牌"
        : "向左拖出这张牌";
    else setSelection(selected);
  }
  function refreshFan() {
    const session = state.current;
    fan?.destroy();
    fanRoot.querySelector(".fan-cards").replaceChildren();
    setSelection(null);
    fan = mountFan(fanRoot, {
      count: session.deck.length,
      onSelect(index) {
        if (
          index !== null &&
          session.draws.length >= spreadLimit(session.config.spread) &&
          !(
            session.config.spread.type === "free" &&
            session.config.spread.positions.length < MAX_SPREAD_POSITIONS
          )
        ) {
          fan?.clear();
          if (session.config.spread.type === "free")
            notify(`自由牌阵最多可以抽 ${MAX_SPREAD_POSITIONS} 张牌。`);
          else void offerFreeSpread();
          return;
        }
        setSelection(index);
      },
      onDrop: confirm,
      onDragState,
      isEnabled: () => !busy && !dragging,
    });
    root.querySelector("#remaining-count").textContent = session.deck.length
      ? `剩余 ${session.deck.length} 张`
      : "本轮已抽完";
  }
  function refresh(animate = false, landing = false) {
    refreshFan();
    const session = state.current;
    applyCloth();
    root.querySelector("#spread-label").textContent = `${session.config.spread.name} · ${session.config.deckCount === 2 ? "双副牌" : "单副牌"}`;
    const question = root.querySelector("#reading-question");
    question.textContent = session.config.question || DEFAULT_READING_TITLE;
    root.querySelector("#draw-count").textContent = session.draws.length
      ? `${String(session.draws.length).padStart(2, "0")} 张已抽出`
      : "尚未抽牌";
    table.innerHTML = session.draws.length
      ? session.draws
          .map((draw, i) =>
            cardFace(draw, i, {
              animate: animate && i === session.draws.length - 1,
              compact: true,
              landing: landing && i === session.draws.length - 1,
              interactive: true,
              skinId: session.config.skinId,
              position:
                session.config.spread.positions.find(
                  (item) => item.id === draw.positionId,
                )?.question ||
                session.config.spread.positions.find(
                  (item) => item.id === draw.positionId,
                )?.label ||
                "",
            }),
          )
          .join("")
      : "";
    attachImageFallbacks(table);
    if (session.draws.length) table.scrollTop = table.scrollHeight;
  }
  async function offerFreeSpread() {
    if (busy || disposed) return;
      const accepted = await askConfirmation({
      title: "这个牌阵已经完成",
      message:
        "预设牌位已经全部抽满。要切换为 12 个牌位的自由牌阵，继续顺着直觉抽牌吗？",
      confirmLabel: "切换到自由牌阵",
    });
    if (!accepted || disposed) return;
    await action(() => service.switchToFree(state.current.id, state.revision));
  }
  async function action(operation, { animate = false, motion = null } = {}) {
    if (busy || disposed) {
      motion?.destroy();
      return false;
    }
    busy = true;
    activeMotion = motion;
    updateControls();
    try {
      state = await operation();
      if (!disposed) {
        refresh(animate && !motion, Boolean(motion));
        if (motion) {
          const card = table.lastElementChild;
          await motion.land(card.querySelector(".card-flip"));
          if (!disposed) {
            card.classList.remove("is-landing");
            card.classList.add("newly-drawn");
          }
        }
      }
      return true;
    } catch (error) {
      if (motion && !disposed) await motion.returnToSource();
      if (!disposed) notify(error.message);
      if (!disposed && !state) {
        table.innerHTML =
          '<div class="table-empty"><h2>暂时无法准备牌堆</h2><p>请检查浏览器存储权限，再刷新页面。</p></div>';
        root.querySelector("#remaining-count").textContent = "原有记录未被更改";
      }
      return false;
    } finally {
      motion?.destroy();
      if (activeMotion === motion) activeMotion = null;
      busy = false;
      if (!disposed) updateControls();
    }
  }
  function confirm(index, motion = null) {
    if (index === null || !state || busy || disposed) {
      motion?.destroy();
      return;
    }
    const sessionId = state.current.id;
    const cardId = state.current.deck[index];
    return action(() => service.confirm(sessionId, index, cardId), {
      animate: true,
      motion,
    });
  }
  async function shuffleDeck() {
    if (busy || dragging || disposed || !state || state.current.deck.length < 2)
      return;
    const sessionId = state.current.id,
      revision = state.revision;
    fan.clear();
    busy = true;
    updateControls();
    root.querySelector("#selection-status").textContent = "正在洗剩余的牌…";
    const animation = createShuffleAnimation(fanRoot);
    activeShuffle = animation;
    try {
      await animation.gatherAndCut();
      if (disposed) return;
      state = await service.reshuffle(sessionId, revision);
      if (disposed) return;
      // Only rebuild the fan: table nodes, scroll position and revealed cards stay put.
      refreshFan();
      root.querySelector("#selection-status").textContent = "正在展开牌堆…";
      await animation.expand();
    } catch (error) {
      if (!disposed) {
        await animation.expand();
        notify(error.message);
      }
    } finally {
      animation.destroy();
      if (activeShuffle === animation) activeShuffle = null;
      busy = false;
      if (!disposed) {
        setSelection(null);
        updateControls();
      }
    }
  }
  root
    .querySelector("#cancel-selection")
    .addEventListener("click", () => fan?.clear(), {
      signal: controller.signal,
    });
  root.querySelector("#confirm-draw").addEventListener(
    "click",
    () => {
      if (selected === null || !state) return;
      confirm(selected);
    },
    { signal: controller.signal },
  );
  root
    .querySelector("#shuffle")
    .addEventListener("click", shuffleDeck, { signal: controller.signal });
  root.querySelector("#new-reading").addEventListener(
    "click",
    async () => {
      if (busy || dragging || disposed || !state) return;
      await action(() =>
        service.startNewReading(state.current.id, state.revision),
      );
    },
    { signal: controller.signal },
  );
  root.querySelector("#open-settings").addEventListener(
    "click",
    () => {
      if (!busy && state) settings.open(state.current, state.revision);
    },
    { signal: controller.signal },
  );
  root.querySelector("#copy-reading").addEventListener(
    "click",
    async () => {
      if (busy || !state) return;
      try {
        await copyText(formatReadingForClipboard(state.current));
        notify("牌阵内容已复制到剪贴板。");
      } catch (error) {
        notify(error.message || "复制失败，请检查浏览器的剪贴板权限。");
      }
    },
    { signal: controller.signal },
  );
  table.addEventListener(
    "click",
    (event) => {
      if (busy) return;
      const card = event.target.closest(".drawn-card[data-card-id]");
      if (card && table.contains(card))
        cardDetail.open(card.dataset.cardId, card, state.current.config.skinId);
    },
    { signal: controller.signal },
  );
  table.addEventListener(
    "keydown",
    (event) => {
      if (busy || !["Enter", " "].includes(event.key)) return;
      const card = event.target.closest(".drawn-card[data-card-id]");
      if (!card || !table.contains(card)) return;
      event.preventDefault();
      cardDetail.open(card.dataset.cardId, card, state.current.config.skinId);
    },
    { signal: controller.signal },
  );
  await action(() => service.ensureSession());
  return () => {
    disposed = true;
    controller.abort();
    fan?.destroy();
    activeMotion?.destroy();
    activeShuffle?.destroy();
    cardDetail.destroy();
    settings.destroy();
  };
}
