import test from "node:test";
import assert from "node:assert/strict";
import { mountRotationGesture } from "../src/features/tarot/components/fan-gesture.js";
test("touch jitter stays a tap, real drags suppress delayed clicks, next tap resets suppression", async () => {
  const previous = Object.fromEntries(
    [
      "window",
      "matchMedia",
      "requestAnimationFrame",
      "cancelAnimationFrame",
    ].map((k) => [k, globalThis[k]]),
  );
  const root = new EventTarget();
  const win = new EventTarget();
  let captured = null,
    starts = 0;
  const deltas = [];
  Object.assign(root, {
    setPointerCapture: (id) => (captured = id),
    hasPointerCapture: (id) => captured === id,
    releasePointerCapture: () => (captured = null),
  });
  Object.assign(globalThis, {
    window: win,
    matchMedia: () => ({ matches: true }),
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
  });
  const send = (target, type, x, y) => {
    const e = new Event(type);
    Object.assign(e, {
      pointerId: 1,
      pointerType: "touch",
      button: 0,
      clientX: x,
      clientY: y,
    });
    target.dispatchEvent(e);
  };
  let gesture;
  try {
    gesture = mountRotationGesture(root, {
      onStart: () => starts++,
      onDelta: (d) => deltas.push(d),
    });
    send(root, "pointerdown", 100, 100);
    send(root, "pointermove", 104, 105);
    send(win, "pointerup", 104, 105);
    assert.equal(starts, 0);
    assert.deepEqual(deltas, []);
    assert.equal(gesture.wasDragged, false);
    send(root, "pointerdown", 100, 100);
    send(root, "pointermove", 100, 125);
    send(win, "pointerup", 100, 125);
    assert.equal(starts, 1);
    assert.ok(deltas.length);
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(gesture.wasDragged, true);
    send(root, "pointerdown", 100, 100);
    send(win, "pointerup", 100, 100);
    assert.equal(gesture.wasDragged, false);
    send(root, "pointerdown", 100, 100);
    send(root, "pointermove", 100, 120);
    send(win, "pointercancel", 100, 120);
    assert.equal(gesture.wasDragged, true);
    assert.equal(gesture.isPointerDown, false);
  } finally {
    gesture?.destroy();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});
