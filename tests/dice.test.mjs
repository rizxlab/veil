import test from "node:test";
import assert from "node:assert/strict";
import { createRoll } from "../src/features/astro-dice/domain/roll.js";
import {
  createDiceRepository,
  DICE_STORAGE_KEY,
} from "../src/infrastructure/storage/dice-repository.js";
import { createDiceService } from "../src/features/astro-dice/domain/dice-service.js";
function fixture() {
  const map = new Map();
  const storage = {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  };
  const repository = createDiceRepository(storage);
  return { map, storage, repository, service: createDiceService(repository) };
}
test("dice consume independent unbiased samples and reach all twelve faces", () => {
  for (let i = 0; i < 12; i++) {
    let n = i;
    const source = {
      getRandomValues(a) {
        a[0] = n++ % 12;
        return a;
      },
    };
    const r = createRoll(source);
    assert.deepEqual(r.values, {
      planet: i,
      sign: (i + 1) % 12,
      house: (i + 2) % 12,
    });
  }
});
test("roll commits once and reloads exact latest result without touching tarot", async () => {
  const { map, service, repository } = fixture();
  map.set("veil.readings.v1", "unchanged");
  const first = await service.roll();
  const second = await service.roll();
  assert.deepEqual(repository.load().records, [second, first]);
  assert.equal(repository.load().revision, 2);
  assert.equal(map.get("veil.readings.v1"), "unchanged");
});
test("cancelled roll does not create a record", async () => {
  const { service, repository } = fixture();
  assert.equal(await service.roll(() => false), null);
  assert.equal(repository.load().revision, 0);
});
test("settings retain title, snapshot custom time, and reset time after rolling", async () => {
  const { service, repository } = fixture();
  const firstTime = "2026-09-20T05:30:00.000Z";
  await service.updateSettings("  我该留意什么  ", firstTime);
  assert.equal(repository.load().draftTitle, "我该留意什么");
  assert.equal(repository.load().draftReadingAt, firstTime);
  const first = await service.roll();
  assert.equal(repository.load().draftReadingAt, null);
  const secondTime = "2026-09-21T08:15:00.000Z";
  await service.updateSettings("新的问题", secondTime);
  const second = await service.roll();
  const state = repository.load();
  assert.equal(first.title, "我该留意什么");
  assert.equal(first.readingAt, firstTime);
  assert.equal(second.title, "新的问题");
  assert.equal(second.readingAt, secondTime);
  assert.equal(state.records[1].title, "我该留意什么");
  assert.equal(state.draftTitle, "新的问题");
  assert.equal(state.draftReadingAt, null);
});
test("version 1 dice records migrate in memory without overwriting raw data", () => {
  const { map, repository } = fixture();
  const { title: _title, readingAt: _readingAt, ...legacyRecord } = createRoll();
  const legacy = { version: 1, revision: 3, records: [legacyRecord] };
  const raw = JSON.stringify(legacy);
  map.set(DICE_STORAGE_KEY, raw);
  const migrated = repository.load();
  assert.equal(migrated.version, 3);
  assert.equal(migrated.draftTitle, "");
  assert.equal(migrated.draftReadingAt, null);
  assert.equal(migrated.records[0].title, "");
  assert.equal(migrated.records[0].readingAt, migrated.records[0].rolledAt);
  assert.equal(map.get(DICE_STORAGE_KEY), raw);
});
test("version 2 dice records gain a reading time without overwriting raw data", () => {
  const { map, repository } = fixture();
  const { readingAt: _readingAt, ...record } = createRoll();
  const legacy = {
    version: 2,
    revision: 4,
    draftTitle: "旧标题",
    records: [record],
  };
  const raw = JSON.stringify(legacy);
  map.set(DICE_STORAGE_KEY, raw);
  const migrated = repository.load();
  assert.equal(migrated.version, 3);
  assert.equal(migrated.draftTitle, "旧标题");
  assert.equal(migrated.records[0].readingAt, record.rolledAt);
  assert.equal(map.get(DICE_STORAGE_KEY), raw);
});
test("failed write leaves previous outcome intact and retry appends only once", async () => {
  const { service, repository, storage } = fixture();
  await service.roll();
  const before = repository.load();
  const save = storage.setItem;
  storage.setItem = () => {
    throw Error("quota");
  };
  await assert.rejects(service.roll(), /未保存/);
  assert.deepEqual(repository.load(), before);
  storage.setItem = save;
  await service.roll();
  assert.equal(repository.load().records.length, 2);
});
test("corrupt, future and invalid outcome data is never reset", () => {
  const { map, repository } = fixture();
  for (const raw of [
    "broken",
    JSON.stringify({ version: 4 }),
    JSON.stringify({
      version: 1,
      revision: 0,
      records: [{ ...createRoll(), values: { planet: 12, sign: 0, house: 0 } }],
    }),
  ]) {
    map.set(DICE_STORAGE_KEY, raw);
    assert.throws(() => repository.load(), /保留/);
    assert.equal(map.get(DICE_STORAGE_KEY), raw);
  }
});
test("stale revisions cannot overwrite newer dice records", async () => {
  const { service, repository } = fixture();
  const stale = repository.load();
  await service.roll();
  assert.throws(() => repository.save(stale, 0), /已更新/);
  assert.equal(repository.load().records.length, 1);
});
