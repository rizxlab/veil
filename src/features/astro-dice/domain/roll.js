import { randomInt } from "../../../shared/lib/random.js";
import { DICE } from "../data/faces.js";
export function createRoll(
  source = globalThis.crypto,
  rolledAt = new Date().toISOString(),
  title = "",
  readingAt = rolledAt,
) {
  return {
    id: globalThis.crypto.randomUUID(),
    rolledAt,
    readingAt,
    title,
    values: Object.fromEntries(
      DICE.map((die) => [die.id, randomInt(die.faces.length, source)]),
    ),
  };
}
export function validRoll(record) {
  return Boolean(
    record &&
    typeof record.id === "string" &&
    /^[a-f\d-]{36}$/i.test(record.id) &&
    typeof record.rolledAt === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(record.rolledAt) &&
    Number.isFinite(Date.parse(record.rolledAt)) &&
    typeof record.readingAt === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(record.readingAt) &&
    Number.isFinite(Date.parse(record.readingAt)) &&
    typeof record.title === "string" &&
    record.title.length <= 120 &&
    DICE.every(
      (die) =>
        Number.isInteger(record.values?.[die.id]) &&
        record.values[die.id] >= 0 &&
        record.values[die.id] < die.faces.length,
    ),
  );
}
