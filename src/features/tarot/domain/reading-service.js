import { createSession, drawCard, shuffleRemaining } from "./session.js";
import {
  createSpread,
  MAX_SPREAD_POSITIONS,
  validReadingConfig,
} from "./reading-config.js";

/** Serializes mutations across tabs; persists a whole reading in one atomic write. */
export function createReadingService(repository) {
  const transaction = async (operation) => {
    const commit = () => {
      const state = repository.load();
      const next = operation(state);
      if (next === state) return state;
      return repository.save(next, state.revision);
    };
    return typeof window !== "undefined" && globalThis.navigator?.locks
      ? globalThis.navigator.locks.request("veil-readings", commit)
      : commit();
  };
  const currentAt = (state, sessionId, expectedRevision) => {
    if (
      !state.current ||
      state.current.id !== sessionId ||
      state.revision !== expectedRevision
    )
      throw new Error("牌桌已在其他页面更新，请刷新后继续。");
    return state.current;
  };
  return {
    load: () => repository.load(),
    ensureSession: () =>
      transaction((state) =>
        state.current ? state : { ...state, current: createSession() },
      ),
    confirm: (sessionId, index, expectedInstanceId) =>
      transaction((state) => {
        if (
          state.current?.id !== sessionId ||
          state.current.deck[index] !== expectedInstanceId
        )
          throw new Error("牌堆已更新，请刷新后重新选择。");
        return { ...state, current: drawCard(state.current, index) };
      }),
    reshuffle: (sessionId, expectedRevision) =>
      transaction((state) => {
        const session = currentAt(state, sessionId, expectedRevision);
        const current = shuffleRemaining(session);
        return current === session ? state : { ...state, current };
      }),
    startNewReading: (sessionId, expectedRevision) =>
      transaction((state) => {
        const session = currentAt(state, sessionId, expectedRevision);
        const config = structuredClone(session.config);
        return {
          ...state,
          current: createSession({ config }),
          history: session.draws.length
            ? [session, ...state.history]
            : state.history,
        };
      }),
    configure: (
      sessionId,
      expectedRevision,
      config,
      reset = false,
      readingAt = null,
    ) =>
      transaction((state) => {
        const session = currentAt(state, sessionId, expectedRevision);
        if (!validReadingConfig(config))
          throw new Error("设置内容不完整，请检查后重试。");
        const nextReadingAt = readingAt || session.readingAt;
        if (!Number.isFinite(Date.parse(nextReadingAt)))
          throw new Error("占卜时间无效，请重新选择。");
        const deckChanged =
          config.deckCount !== session.config.deckCount ||
          config.skinId !== session.config.skinId;
        const spreadChanged =
          config.spread.type !== session.config.spread.type ||
          config.spread.positions.length !==
            session.config.spread.positions.length;
        if ((deckChanged || spreadChanged) && session.draws.length && !reset)
          throw new Error("这项设置需要重新开始本轮抽牌。");
        if (reset || deckChanged || spreadChanged) {
          const history = session.draws.length
            ? [session, ...state.history]
            : state.history;
          return {
            ...state,
            current: createSession({ config, readingAt: nextReadingAt }),
            history,
          };
        }
        return {
          ...state,
          current: {
            ...session,
            config: structuredClone(config),
            readingAt: nextReadingAt,
            updatedAt: new Date().toISOString(),
          },
        };
      }),
    switchToFree: (sessionId, expectedRevision) =>
      transaction((state) => {
        const session = currentAt(state, sessionId, expectedRevision);
        const spread = createSpread("free", MAX_SPREAD_POSITIONS);
        spread.positions.forEach((position, index) => {
          position.question =
            session.config.spread.positions[index]?.question || "";
        });
        return {
          ...state,
          current: {
            ...session,
            config: {
              ...session.config,
              spread,
            },
            updatedAt: new Date().toISOString(),
          },
        };
      }),
  };
}
