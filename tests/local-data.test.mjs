import test from "node:test";
import assert from "node:assert/strict";
import { createLocalDataService } from "../src/infrastructure/storage/local-data-service.js";
import { STORAGE_KEY } from "../src/infrastructure/storage/reading-repository.js";
import { DICE_STORAGE_KEY } from "../src/infrastructure/storage/dice-repository.js";

const fixture = () => {
  const map = new Map([
    [STORAGE_KEY, "tarot"],
    [DICE_STORAGE_KEY, "dice"],
    ["unrelated", "keep"],
  ]);
  const storage = {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  };
  return { map, storage };
};

test("clearing local records removes tarot and dice but leaves unrelated data", () => {
  const { map, storage } = fixture();
  createLocalDataService(storage).clearAll();
  assert.equal(map.has(STORAGE_KEY), false);
  assert.equal(map.has(DICE_STORAGE_KEY), false);
  assert.equal(map.get("unrelated"), "keep");
});

test("a partial clear failure restores both original record collections", () => {
  const { map, storage } = fixture();
  const remove = storage.removeItem;
  let failed = false;
  storage.removeItem = (key) => {
    if (key === DICE_STORAGE_KEY && !failed) {
      failed = true;
      throw new Error("blocked");
    }
    return remove(key);
  };
  assert.throws(
    () => createLocalDataService(storage).clearAll(),
    /原有数据已尽力恢复/,
  );
  assert.equal(map.get(STORAGE_KEY), "tarot");
  assert.equal(map.get(DICE_STORAGE_KEY), "dice");
});
