import test from "node:test";
import assert from "node:assert/strict";
import {
  createSession,
  drawCard,
  shuffleRemaining,
} from "../src/features/tarot/domain/session.js";
import {
  createReadingRepository,
  emptyStore,
  STORAGE_KEY,
} from "../src/infrastructure/storage/reading-repository.js";
import { createReadingService } from "../src/features/tarot/domain/reading-service.js";
import {
  createReadingConfig,
  createSpread,
  MAX_SPREAD_POSITIONS,
  validReadingConfig,
} from "../src/features/tarot/domain/reading-config.js";
import { cardImage } from "../src/features/tarot/data/skins.js";
import { formatReadingForClipboard } from "../src/features/tarot/domain/reading-export.js";
const source = (value) => ({
  getRandomValues(a) {
    a[0] = value;
  },
});
const memory = () => {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
  };
};
test("entering an existing round does not write or trigger cross-tab update loops", async () => {
  const service = createReadingService(createReadingRepository(memory()));
  const before = await service.ensureSession();
  const after = await service.ensureSession();
  assert.deepEqual(after, before);
});
test("all 78 cards are unique and bounded drawing does not mutate previous state", () => {
  const config = createReadingConfig();
  config.spread = createSpread("free", 12);
  let state = createSession({ config });
  const initial = state;
  assert.equal(new Set(initial.deck).size, 78);
  for (let i = 0; i < 12; i++)
    state = drawCard(state, 0, source(i % 2));
  assert.equal(initial.deck.length, 78);
  assert.equal(initial.draws.length, 0);
  assert.equal(state.deck.length, 66);
  assert.equal(state.draws.filter((d) => d.reversed).length, 6);
  assert.throws(() => drawCard(state, 0), RangeError);
});
test("clipboard export includes title, every position, card direction and meaning", () => {
  const config = createReadingConfig();
  config.question = "这段旅程需要看见什么";
  config.spread = createSpread("double");
  config.spread.positions[0].question = "我已经拥有的力量";
  const session = drawCard(createSession({ config }), 0, source(1));
  const output = formatReadingForClipboard(session);
  assert.match(output, /^这段旅程需要看见什么/);
  assert.match(output, /1\. 牌位 1/);
  assert.match(output, /牌位问题：我已经拥有的力量/);
  assert.match(output, /塔罗牌：.+（逆位）/);
  assert.match(output, /牌面简介：/);
  assert.match(output, /逆位牌义：/);
  assert.match(output, /2\. 牌位 2[\s\S]*抽牌结果：尚未抽牌/);
});
test("remaining-only shuffle preserves round, history, draws and timestamps", async () => {
  const storage = memory();
  const repo = createReadingRepository(storage);
  const service = createReadingService(repo);
  let state = await service.ensureSession();
  for (let i = 0; i < 3; i++)
    state = await service.confirm(state.current.id, 0, state.current.deck[0]);
  const oldRound = drawCard(createSession(), 0);
  state = repo.save({ ...state, history: [oldRound] }, state.revision);
  const before = structuredClone(state);
  state = await service.reshuffle(state.current.id, state.revision);
  assert.equal(state.current.id, before.current.id);
  assert.equal(state.current.startedAt, before.current.startedAt);
  assert.deepEqual(state.current.draws, before.current.draws);
  assert.deepEqual(state.history, before.history);
  assert.equal(state.current.deck.length, 75);
  assert.deepEqual(
    [...state.current.deck].sort(),
    [...before.current.deck].sort(),
  );
  assert.equal(state.revision, before.revision + 1);
  assert.deepEqual(createReadingRepository(storage).load(), state);
});
test("remaining shuffle is immutable and uses the existing Fisher–Yates algorithm", () => {
  const original = drawCard(drawCard(createSession(), 0), 0);
  const snapshot = structuredClone(original);
  const mixed = shuffleRemaining(
    original,
    source(0),
    "2026-09-19T12:00:00.000Z",
  );
  assert.deepEqual(original, snapshot);
  assert.deepEqual(mixed.draws, original.draws);
  assert.equal(mixed.id, original.id);
  assert.notDeepEqual(mixed.deck, original.deck);
  assert.deepEqual([...mixed.deck].sort(), [...original.deck].sort());
  assert.ok(mixed.draws.every((d) => !mixed.deck.includes(d.cardId)));
});
test("fewer than two remaining cards makes shuffle a no-op", () => {
  for (const remaining of [0, 1]) {
    const original = createSession();
    const session = { ...original, deck: original.deck.slice(0, remaining) };
    assert.strictEqual(shuffleRemaining(session), session);
  }
});
test("shuffle rejects stale tabs and storage failure without touching the deck", async () => {
  const storage = memory();
  const repo = createReadingRepository(storage);
  const service = createReadingService(repo);
  const initial = await service.ensureSession();
  const before = await service.confirm(
    initial.current.id,
    0,
    initial.current.deck[0],
  );
  await assert.rejects(
    () => service.reshuffle(initial.current.id, initial.revision),
    /其他页面/,
  );
  storage.setItem = () => {
    throw new Error("quota");
  };
  await assert.rejects(
    () => service.reshuffle(before.current.id, before.revision),
    /未保存/,
  );
  assert.deepEqual(repo.load(), before);
});
test("stale card confirmations and revisions cannot overwrite records", async () => {
  const repo = createReadingRepository(memory());
  const service = createReadingService(repo);
  const original = await service.ensureSession();
  await service.confirm(original.current.id, 0, original.current.deck[0]);
  await assert.rejects(
    () => service.confirm(original.current.id, 0, original.current.deck[0]),
    /牌堆已更新/,
  );
  assert.throws(() => repo.save(original, original.revision), /另一个页面/);
  assert.equal(repo.load().current.draws.length, 1);
});
test("corrupt or future data is preserved, never reset silently", () => {
  for (const value of [
    "bad JSON",
    JSON.stringify({ ...emptyStore(), version: 5 }),
  ]) {
    const storage = memory();
    storage.setItem(STORAGE_KEY, value);
    const repo = createReadingRepository(storage);
    assert.throws(() => repo.load(), /保留原始数据/);
    assert.equal(storage.getItem(STORAGE_KEY), value);
  }
});
test("two decks are fully mixed as 156 unique instances with two copies per card", () => {
  const config = createReadingConfig();
  config.deckCount = 2;
  const session = createSession({ config, source: source(0) });
  assert.equal(session.deck.length, 156);
  assert.equal(new Set(session.deck).size, 156);
  const counts = new Map();
  for (const instanceId of session.deck) {
    const id = instanceId.split("::")[0];
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  assert.equal(counts.size, 78);
  assert.ok([...counts.values()].every((count) => count === 2));
});
test("Marseille skin and patterned cloth are valid without changing card identities", () => {
  const config = createReadingConfig();
  config.skinId = "marseille";
  config.clothId = "celestial";
  assert.equal(validReadingConfig(config), true);
  assert.equal(
    cardImage("major-08", config.skinId),
    "/assets/tarot/marseille/major-08.jpg",
  );
  assert.equal(cardImage("major-08", "unknown"), "/assets/tarot/rws/major-08.jpg");
  const session = createSession({ config, source: source(0) });
  assert.equal(session.deck.length, 78);
  assert.equal(new Set(session.deck).size, 78);
});
test("fixed spreads enforce their limit and can atomically switch to free", async () => {
  const repository = createReadingRepository(memory());
  const service = createReadingService(repository);
  let state = await service.ensureSession();
  const config = structuredClone(state.current.config);
  config.spread = createSpread("single");
  state = await service.configure(
    state.current.id,
    state.revision,
    config,
  );
  state = await service.confirm(
    state.current.id,
    0,
    state.current.deck[0],
  );
  await assert.rejects(
    () => service.confirm(state.current.id, 0, state.current.deck[0]),
    /牌阵已经抽满/,
  );
  state = await service.switchToFree(state.current.id, state.revision);
  state = await service.confirm(
    state.current.id,
    0,
    state.current.deck[0],
  );
  assert.equal(state.current.draws.length, 2);
  assert.equal(state.current.config.spread.type, "free");
  assert.equal(state.current.config.spread.positions.length, 12);
});
test("free spreads atomically grow beyond their initial count up to twelve", async () => {
  for (const count of [1, 6]) {
    const config = createReadingConfig();
    config.spread = createSpread("free", count);
    config.spread.positions[0].question = "保留原有问题";
    let session = createSession({ config });
    for (let index = 0; index < count; index++)
      session = drawCard(session, 0, source(0));
    const before = structuredClone(session);
    session = drawCard(session, 0, source(0));
    assert.equal(before.config.spread.positions.length, count);
    assert.equal(session.draws.length, count + 1);
    assert.equal(session.config.spread.positions.length, count + 1);
    assert.equal(session.config.spread.positions[0].question, "保留原有问题");
    assert.equal(session.draws.at(-1).positionId, `position-${count + 1}`);
  }

  const repository = createReadingRepository(memory());
  const service = createReadingService(repository);
  let state = await service.ensureSession();
  const config = structuredClone(state.current.config);
  config.spread = createSpread("free", 1);
  state = await service.configure(state.current.id, state.revision, config);
  state = await service.confirm(state.current.id, 0, state.current.deck[0]);
  const revision = state.revision;
  state = await service.confirm(state.current.id, 0, state.current.deck[0]);
  assert.equal(state.revision, revision + 1);
  assert.equal(state.current.draws.length, 2);
  assert.equal(state.current.config.spread.positions.length, 2);
  assert.deepEqual(repository.load(), state);

  while (state.current.draws.length < MAX_SPREAD_POSITIONS)
    state = await service.confirm(
      state.current.id,
      0,
      state.current.deck[0],
    );
  await assert.rejects(
    () => service.confirm(state.current.id, 0, state.current.deck[0]),
    /牌阵已经抽满/,
  );
});
test("changing deck structure archives a started reading and creates a clean deck", async () => {
  const repository = createReadingRepository(memory());
  const service = createReadingService(repository);
  let state = await service.ensureSession();
  state = await service.confirm(
    state.current.id,
    0,
    state.current.deck[0],
  );
  const oldId = state.current.id;
  const config = structuredClone(state.current.config);
  config.deckCount = 2;
  state = await service.configure(
    oldId,
    state.revision,
    config,
    true,
  );
  assert.notEqual(state.current.id, oldId);
  assert.equal(state.current.deck.length, 156);
  assert.equal(state.current.draws.length, 0);
  assert.equal(state.history[0].id, oldId);
  assert.equal(state.history[0].draws.length, 1);
});
test("starting a new spread atomically archives draws and preserves all current settings", async () => {
  const repository = createReadingRepository(memory());
  const service = createReadingService(repository);
  let state = await service.ensureSession();
  const config = structuredClone(state.current.config);
  config.deckCount = 2;
  config.clothId = "sage";
  config.question = "这一轮想问的问题";
  config.spread = createSpread("triple");
  state = await service.configure(state.current.id, state.revision, config, true);
  state = await service.confirm(state.current.id, 0, state.current.deck[0]);
  const previous = state.current;
  state = await service.startNewReading(previous.id, state.revision);
  assert.equal(state.history[0].id, previous.id);
  assert.equal(state.history[0].draws.length, 1);
  assert.notEqual(state.current.id, previous.id);
  assert.equal(state.current.config.deckCount, 2);
  assert.equal(state.current.config.skinId, previous.config.skinId);
  assert.equal(state.current.config.clothId, "sage");
  assert.equal(state.current.config.question, "这一轮想问的问题");
  assert.equal(state.current.config.spread.type, "triple");
  assert.deepEqual(state.current.config, previous.config);
  assert.equal(state.current.draws.length, 0);
  assert.equal(state.current.deck.length, 156);
});
test("starting over from an empty table does not create an empty archive", async () => {
  const service = createReadingService(createReadingRepository(memory()));
  let state = await service.ensureSession();
  const firstId = state.current.id;
  state = await service.startNewReading(firstId, state.revision);
  assert.notEqual(state.current.id, firstId);
  assert.deepEqual(state.history, []);
});
test("custom reading time is saved independently from technical timestamps", async () => {
  const service = createReadingService(createReadingRepository(memory()));
  let state = await service.ensureSession();
  const startedAt = state.current.startedAt;
  const readingAt = "2024-02-03T04:05:00.000Z";
  state = await service.configure(
    state.current.id,
    state.revision,
    structuredClone(state.current.config),
    false,
    readingAt,
  );
  assert.equal(state.current.readingAt, readingAt);
  assert.equal(state.current.startedAt, startedAt);
  assert.notEqual(state.current.updatedAt, readingAt);
});
test("failed structural reset preserves the active reading and its history", async () => {
  const storage = memory();
  const repository = createReadingRepository(storage);
  const service = createReadingService(repository);
  let state = await service.ensureSession();
  state = await service.confirm(
    state.current.id,
    0,
    state.current.deck[0],
  );
  const before = structuredClone(state);
  const config = structuredClone(state.current.config);
  config.deckCount = 2;
  storage.setItem = () => {
    throw new Error("quota");
  };
  await assert.rejects(
    () =>
      service.configure(
        state.current.id,
        state.revision,
        config,
        true,
      ),
    /未保存/,
  );
  assert.deepEqual(repository.load(), before);
});
test("version 1 readings migrate in memory without changing the stored raw value", () => {
  const storage = memory();
  const session = drawCard(createSession(), 0);
  const legacy = {
    version: 1,
    revision: 4,
    current: {
      ...session,
      config: undefined,
      draws: session.draws.map(({ cardId, reversed, drawnAt }) => ({
        cardId,
        reversed,
        drawnAt,
      })),
    },
    history: [],
  };
  delete legacy.current.config;
  const raw = JSON.stringify(legacy);
  storage.setItem(STORAGE_KEY, raw);
  const migrated = createReadingRepository(storage).load();
  assert.equal(migrated.version, 4);
  assert.equal(migrated.current.readingAt, migrated.current.startedAt);
  assert.equal(migrated.current.config.deckCount, 1);
  assert.equal(migrated.current.config.spread.positions.length, 12);
  assert.equal(migrated.current.draws[0].instanceId, migrated.current.draws[0].cardId);
  assert.equal(storage.getItem(STORAGE_KEY), raw);
});
test("version 2 custom and unlimited free spreads migrate without overwriting raw data", () => {
  for (const oldType of ["custom", "free"]) {
    const storage = memory();
    const config = createReadingConfig();
    config.spread = createSpread("free", 2);
    if (oldType === "custom") {
      config.spread.type = "custom";
      config.spread.name = "自定义";
      config.spread.positions[0].question = "保留的问题";
    } else {
      config.spread.positions[0].question = "旧自由牌阵问题";
    }
    const legacy = {
      version: 2,
      revision: 7,
      current: createSession({ config }),
      history: [],
    };
    const raw = JSON.stringify(legacy);
    storage.setItem(STORAGE_KEY, raw);
    const migrated = createReadingRepository(storage).load();
    assert.equal(migrated.version, 4);
    assert.equal(migrated.current.readingAt, migrated.current.startedAt);
    assert.equal(migrated.current.config.spread.type, "free");
    assert.equal(
      migrated.current.config.spread.positions.length,
      oldType === "custom" ? 2 : 12,
    );
    if (oldType === "custom")
      assert.equal(
        migrated.current.config.spread.positions[0].question,
        "保留的问题",
      );
    else
      assert.equal(
        migrated.current.config.spread.positions[0].question,
        "旧自由牌阵问题",
      );
    assert.equal(storage.getItem(STORAGE_KEY), raw);
  }
});
test("version 3 readings gain a reading time without overwriting raw data", () => {
  const storage = memory();
  const session = createSession();
  const { readingAt: _readingAt, ...legacySession } = session;
  const legacy = {
    version: 3,
    revision: 2,
    current: legacySession,
    history: [],
  };
  const raw = JSON.stringify(legacy);
  storage.setItem(STORAGE_KEY, raw);
  const migrated = createReadingRepository(storage).load();
  assert.equal(migrated.version, 4);
  assert.equal(migrated.current.readingAt, migrated.current.startedAt);
  assert.equal(storage.getItem(STORAGE_KEY), raw);
});
test("storage failure does not mutate the saved session", async () => {
  const storage = memory();
  const repo = createReadingRepository(storage);
  const service = createReadingService(repo);
  const state = await service.ensureSession();
  storage.setItem = () => {
    throw new Error("quota");
  };
  await assert.rejects(
    () => service.confirm(state.current.id, 0, state.current.deck[0]),
    /未保存/,
  );
  assert.equal(repo.load().current.draws.length, 0);
});
