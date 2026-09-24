import { CARD_BY_ID } from "../../features/tarot/data/deck.js";
import { cardIdFromInstance } from "../../features/tarot/domain/session.js";
import {
  createReadingConfig,
  createSpread,
  validReadingConfig,
} from "../../features/tarot/domain/reading-config.js";

export const STORAGE_KEY = "veil.readings.v1";
export const emptyStore = () => ({
  version: 4,
  revision: 0,
  current: null,
  history: [],
});

const validDate = (value) =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

function validLegacySession(session) {
  if (
    !session ||
    typeof session.id !== "string" ||
    !validDate(session.startedAt) ||
    !validDate(session.updatedAt) ||
    !Array.isArray(session.deck) ||
    !Array.isArray(session.draws)
  )
    return false;
  const ids = [
    ...session.deck,
    ...session.draws.map((draw) => draw.cardId),
  ];
  return (
    ids.length === 78 &&
    new Set(ids).size === 78 &&
    ids.every((id) => CARD_BY_ID.has(id)) &&
    session.draws.every(
      (draw) =>
        typeof draw.reversed === "boolean" && validDate(draw.drawnAt),
    )
  );
}

function migrateSession(session) {
  const config = createReadingConfig();
  config.spread = createSpread("free", 12);
  return {
    ...session,
    readingAt: session.startedAt,
    config,
    draws: session.draws.map((draw) => ({
      ...draw,
      instanceId: draw.cardId,
      positionId: null,
    })),
  };
}

function migrateLegacyStore(value) {
  const valid =
    value?.version === 1 &&
    Number.isInteger(value.revision) &&
    value.revision >= 0 &&
    (value.current === null || validLegacySession(value.current)) &&
    Array.isArray(value.history) &&
    value.history.every(
      (session) => validLegacySession(session) && session.draws.length > 0,
    ) &&
    new Set(value.history.map((session) => session.id)).size ===
      value.history.length &&
    !value.history.some((session) => session.id === value.current?.id);
  if (!valid) return null;
  return {
    ...value,
    version: 4,
    current: value.current ? migrateSession(value.current) : null,
    history: value.history.map(migrateSession),
  };
}

function migrateVersion2Session(session) {
  if (!session || typeof session !== "object") return session;
  const migrated = structuredClone(session);
  migrated.readingAt = migrated.startedAt;
  const spread = migrated.config?.spread;
  if (spread?.type === "custom") {
    spread.type = "free";
    spread.name = "自由牌阵";
  } else if (spread?.type === "free") {
    const positions = createSpread("free", 12).positions;
    positions.forEach((position, index) => {
      position.question = spread.positions?.[index]?.question || "";
    });
    migrated.config.spread = {
      type: "free",
      name: "自由牌阵",
      positions,
    };
  }
  return migrated;
}

function migrateVersion2Store(value) {
  if (value?.version !== 2 || !Array.isArray(value.history)) return null;
  return {
    ...value,
    version: 4,
    current: value.current ? migrateVersion2Session(value.current) : null,
    history: value.history.map(migrateVersion2Session),
  };
}

function migrateVersion3Store(value) {
  if (value?.version !== 3 || !Array.isArray(value.history)) return null;
  const addReadingTime = (session) =>
    session ? { ...structuredClone(session), readingAt: session.startedAt } : null;
  return {
    ...value,
    version: 4,
    current: addReadingTime(value.current),
    history: value.history.map(addReadingTime),
  };
}

function validSession(session) {
  if (
    !session ||
    typeof session.id !== "string" ||
    !validDate(session.startedAt) ||
    !validDate(session.updatedAt) ||
    !validDate(session.readingAt) ||
    !validReadingConfig(session.config) ||
    !Array.isArray(session.deck) ||
    !Array.isArray(session.draws)
  )
    return false;
  const instances = [
    ...session.deck,
    ...session.draws.map((draw) => draw.instanceId),
  ];
  const expectedCount = 78 * session.config.deckCount;
  if (
    instances.length !== expectedCount ||
    new Set(instances).size !== expectedCount
  )
    return false;
  const validInstance = (instanceId) => {
    if (typeof instanceId !== "string") return false;
    const cardId = cardIdFromInstance(instanceId);
    if (!CARD_BY_ID.has(cardId)) return false;
    return session.config.deckCount === 1
      ? instanceId === cardId
      : instanceId === `${cardId}::1` || instanceId === `${cardId}::2`;
  };
  return (
    instances.every(validInstance) &&
    session.draws.every(
      (draw) =>
        draw.cardId === cardIdFromInstance(draw.instanceId) &&
        typeof draw.reversed === "boolean" &&
        validDate(draw.drawnAt) &&
        (draw.positionId === null ||
          session.config.spread.positions.some(
            (position) => position.id === draw.positionId,
          )),
    )
  );
}

export function validateStore(value) {
  return (
    value?.version === 4 &&
    Number.isInteger(value.revision) &&
    value.revision >= 0 &&
    (value.current === null || validSession(value.current)) &&
    Array.isArray(value.history) &&
    value.history.every(
      (session) => validSession(session) && session.draws.length > 0,
    ) &&
    new Set(value.history.map((session) => session.id)).size ===
      value.history.length &&
    !value.history.some((session) => session.id === value.current?.id)
  );
}

/** All browser persistence is isolated here. Replace this adapter for future sync. */
export function createReadingRepository(storage) {
  return {
    load() {
      let raw;
      try {
        raw = storage.getItem(STORAGE_KEY);
      } catch {
        throw new Error("无法访问本地记录。请检查浏览器的存储权限。");
      }
      if (raw === null) return emptyStore();
      try {
        const parsed = JSON.parse(raw);
        const data =
          parsed?.version === 1
            ? migrateLegacyStore(parsed)
            : parsed?.version === 2
              ? migrateVersion2Store(parsed)
              : parsed?.version === 3
                ? migrateVersion3Store(parsed)
                : parsed;
        if (!data || !validateStore(data)) throw new Error();
        return data;
      } catch {
        throw new Error("本地记录格式异常，已保留原始数据。请先备份后再处理。");
      }
    },
    save(next, expectedRevision) {
      const previous = this.load();
      if (previous.revision !== expectedRevision)
        throw new Error("记录已在另一个页面更新，请刷新后继续。");
      const value = { ...next, version: 4, revision: expectedRevision + 1 };
      if (!validateStore(value))
        throw new Error("抽牌数据校验失败，本次变更未保存。");
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        throw new Error("本地空间不足或存储不可用，本次操作未保存。");
      }
      return value;
    },
  };
}
