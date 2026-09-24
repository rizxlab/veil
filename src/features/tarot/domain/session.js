import { DECK } from "../data/deck.js";
import { shuffle, randomInt } from "../../../shared/lib/random.js";
import {
  createSpread,
  createReadingConfig,
  MAX_SPREAD_POSITIONS,
  spreadLimit,
} from "./reading-config.js";

export const cardIdFromInstance = (instanceId) => instanceId.split("::")[0];

function createDeck(deckCount) {
  return Array.from({ length: deckCount }, (_, copy) =>
    DECK.map((card) =>
      deckCount === 1 ? card.id : `${card.id}::${copy + 1}`,
    ),
  ).flat();
}
/** Reorder only the remaining cards. Draws and the round identity are immutable. */
export function shuffleRemaining(
  session,
  source = globalThis.crypto,
  now = new Date().toISOString(),
) {
  if (session.deck.length < 2) return session;
  return { ...session, deck: shuffle(session.deck, source), updatedAt: now };
}
export function createSession({
  source = globalThis.crypto,
  now = new Date().toISOString(),
  readingAt = now,
  config = createReadingConfig(),
} = {}) {
  return {
    id: globalThis.crypto.randomUUID(),
    startedAt: now,
    updatedAt: now,
    readingAt,
    config: structuredClone(config),
    deck: shuffle(createDeck(config.deckCount), source),
    draws: [],
  };
}

function expandFreeSpread(session) {
  const current = session.config.spread;
  if (
    current.type !== "free" ||
    current.positions.length >= MAX_SPREAD_POSITIONS
  )
    throw new RangeError("当前牌阵已经抽满");
  const spread = createSpread("free", current.positions.length + 1);
  spread.positions.forEach((position, index) => {
    position.question = current.positions[index]?.question || "";
  });
  return {
    ...session,
    config: {
      ...session.config,
      spread,
    },
  };
}

/** Pure state transition; selection alone never exposes or records a card. */
export function drawCard(
  session,
  index,
  source = globalThis.crypto,
  now = new Date().toISOString(),
) {
  const nextSession =
    session.draws.length >= spreadLimit(session.config.spread)
      ? expandFreeSpread(session)
      : session;
  if (!Number.isInteger(index) || index < 0 || index >= session.deck.length)
    throw new RangeError("这张牌已不在牌堆中");
  const deck = [...nextSession.deck];
  const [instanceId] = deck.splice(index, 1);
  const cardId = cardIdFromInstance(instanceId);
  const draw = {
    instanceId,
    cardId,
    positionId:
      nextSession.config.spread.positions[nextSession.draws.length]?.id ?? null,
    reversed: randomInt(2, source) === 1,
    drawnAt: now,
  };
  return {
    ...nextSession,
    deck,
    draws: [...nextSession.draws, draw],
    updatedAt: now,
  };
}
