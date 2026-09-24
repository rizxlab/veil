import test from "node:test";
import assert from "node:assert/strict";
import { DECK } from "../src/features/tarot/data/deck.js";
import { CARD_MEANINGS } from "../src/features/tarot/data/card-meanings.js";

test("every tarot card has a complete upright and reversed introduction", () => {
  assert.equal(CARD_MEANINGS.size, 78);
  for (const card of DECK) {
    const meaning = CARD_MEANINGS.get(card.id);
    assert.ok(meaning, `missing meaning for ${card.id}`);
    for (const field of ["number", "arcana", "overview", "upright", "reversed"])
      assert.equal(typeof meaning[field], "string");
    assert.ok(meaning.overview.length >= 20);
    assert.ok(meaning.upright.length >= 20);
    assert.ok(meaning.reversed.length >= 20);
  }
});
