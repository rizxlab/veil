import { createCardMotion } from "./card-motion.js";

/** Owns only the selected card's pointer. Rotation remains a separate gesture. */
export function mountCardDrag(
  root,
  { getSelected, isEnabled, onStart, onProgress, onEnd, onDrop },
) {
  const events = new AbortController();
  let pointer = null,
    originX = 0,
    originY = 0,
    dx = 0,
    dy = 0;
  let motion = null,
    slot = null,
    threshold = 44,
    moved = false,
    settling = false;
  let disposed = false,
    suppressUntil = 0;
  const ready = () => dx <= -threshold;
  function down(event) {
    if (
      event.button !== 0 ||
      !event.isPrimary ||
      pointer !== null ||
      settling ||
      !isEnabled()
    )
      return;
    const card = event.target.closest(".fan-card");
    if (!card || card !== getSelected()) return;
    event.stopImmediatePropagation();
    pointer = event.pointerId;
    slot = Number(card.dataset.slot);
    originX = event.clientX;
    originY = event.clientY;
    dx = dy = 0;
    moved = false;
    threshold = Math.max(44, card.offsetWidth * 0.6);
    onStart();
  }
  function move(event) {
    if (event.pointerId !== pointer) return;
    dx = event.clientX - originX;
    dy = event.clientY - originY;
    if (!moved && Math.hypot(dx, dy) < 6) return;
    event.preventDefault();
    if (!moved) {
      moved = true;
      root.setPointerCapture(pointer);
      motion = createCardMotion(getSelected());
    }
    motion.move(dx, dy, ready());
    onProgress(ready());
  }
  function release() {
    const id = pointer;
    pointer = null;
    if (id !== null && root.hasPointerCapture(id))
      root.releasePointerCapture(id);
  }
  async function returnCard() {
    settling = true;
    const returning = motion;
    await returning?.returnToSource();
    returning?.destroy();
    motion = null;
    settling = false;
    if (!disposed) onEnd();
  }
  function finish(event) {
    if (event.pointerId !== pointer) return;
    const commit = event.type === "pointerup" && moved && ready();
    release();
    if (!moved) {
      onEnd();
      return;
    }
    suppressUntil = performance.now() + 450;
    if (commit) {
      // The page now owns this ghost while persisting, landing and revealing.
      const flight = motion;
      motion = null;
      onEnd();
      onDrop(slot, flight);
    } else {
      void returnCard();
    }
  }
  function cancel() {
    if (pointer === null) return;
    release();
    if (moved) suppressUntil = performance.now() + 450;
    void returnCard();
  }
  root.addEventListener("pointerdown", down, {
    capture: true,
    signal: events.signal,
  });
  window.addEventListener("pointermove", move, {
    passive: false,
    signal: events.signal,
  });
  window.addEventListener("pointerup", finish, { signal: events.signal });
  window.addEventListener("pointercancel", finish, { signal: events.signal });
  window.addEventListener("blur", cancel, { signal: events.signal });
  window.addEventListener("resize", cancel, { signal: events.signal });
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") cancel();
    },
    { capture: true, signal: events.signal },
  );
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) cancel();
    },
    { signal: events.signal },
  );
  root.addEventListener(
    "contextmenu",
    (event) => {
      if (pointer !== null) event.preventDefault();
    },
    { signal: events.signal },
  );
  return {
    get active() {
      return pointer !== null || settling;
    },
    get wasDragged() {
      return performance.now() < suppressUntil;
    },
    destroy() {
      disposed = true;
      events.abort();
      release();
      motion?.destroy();
    },
  };
}
