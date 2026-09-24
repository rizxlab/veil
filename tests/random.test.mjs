import test from "node:test";
import assert from "node:assert/strict";
import { randomInt, shuffle } from "../src/shared/lib/random.js";
test("rejection sampling discards biased high uint32 values", () => {
  const values = [0xffffffff, 5];
  let calls = 0;
  const source = {
    getRandomValues(array) {
      array[0] = values[calls++];
    },
  };
  assert.equal(randomInt(78, source), 5);
  assert.equal(calls, 2);
});
test("Fisher–Yates can reach all six permutations of three cards", () => {
  const results = new Set();
  for (let first = 0; first < 3; first++)
    for (let second = 0; second < 2; second++) {
      const choices = [first, second];
      const input = ["a", "b", "c"];
      results.add(
        shuffle(input, {
          getRandomValues(a) {
            a[0] = choices.shift();
          },
        }).join(""),
      );
      assert.deepEqual(input, ["a", "b", "c"]);
    }
  assert.equal(results.size, 6);
});
test("invalid integer bounds are rejected", () => {
  for (const n of [0, -1, 1.5, NaN, Infinity])
    assert.throws(() => randomInt(n), RangeError);
});
