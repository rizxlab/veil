import test from "node:test";
import assert from "node:assert/strict";
import { installViewportGestures } from "../src/infrastructure/browser/viewport-gestures.js";
function fixture(points) {
  const target = new EventTarget();
  target.defaultView = { navigator: { maxTouchPoints: points } };
  const cleanup = installViewportGestures(target);
  const send = (type, count = 1, cancelable = true) => {
    const event = new Event(type, { cancelable });
    event.touches = Array(count).fill({});
    target.dispatchEvent(event);
    return event.defaultPrevented;
  };
  return { send, cleanup };
}
test("viewport blocks multi-touch without blocking single-finger scrolling or clicks", () => {
  const {send, cleanup} = fixture(5);
  try {
    for (const type of ["touchstart", "touchmove"]) {
      assert.equal(send(type, 1), false);
      assert.equal(send(type, 2), true);
      assert.equal(send(type, 3), true);
      assert.equal(send(type, 2, false), false);
    }
    assert.equal(send("click"), false);
    assert.equal(send("gesturestart"), true);
    assert.equal(send("gesturechange"), true);
  } finally { cleanup(); }
  assert.equal(send("touchmove", 2), false);
  assert.equal(send("gesturechange"), false);
});
test("desktop Safari trackpad gestures are not intercepted", () => {
  const {send, cleanup} = fixture(0);
  try { assert.equal(send("gesturestart"), false); assert.equal(send("gesturechange"), false); }
  finally { cleanup(); }
});
