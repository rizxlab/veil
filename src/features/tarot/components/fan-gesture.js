/** Pointer/wheel rotation and inertia; no card identities or persistence. */
export function mountRotationGesture(
  root,
  { onStart, onDelta, canStart = () => true },
) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let pointer = null,
    lastX = 0,
    lastY = 0,
    lastTime = 0;
  let velocity = 0,
    frame = 0,
    moved = false,
    resetTimer;
  function tick() {
    velocity *= 0.92;
    onDelta(velocity);
    if (Math.abs(velocity) > 0.025) frame = requestAnimationFrame(tick);
  }
  function down(event) {
    if (event.button !== 0 || pointer !== null || !canStart()) return;
    cancelAnimationFrame(frame);
    clearTimeout(resetTimer);
    pointer = event.pointerId;
    moved = false;
    lastX = event.clientX;
    lastY = event.clientY;
    lastTime = performance.now();
    velocity = 0;
  }
  function move(event) {
    if (event.pointerId !== pointer) return;
    const dy = event.clientY - lastY,
      dx = event.clientX - lastX;
    if (!moved && Math.abs(dy) + Math.abs(dx) < 6) return;
    if (!moved) {
      moved = true;
      root.setPointerCapture(pointer);
      onStart();
    }
    const delta = (-dy - dx * 0.5) * 0.15;
    velocity = (delta * 16) / Math.max(8, performance.now() - lastTime);
    lastY = event.clientY;
    lastX = event.clientX;
    lastTime = performance.now();
    onDelta(delta);
  }
  function up(event) {
    if (event.pointerId !== pointer) return;
    if (root.hasPointerCapture(pointer)) root.releasePointerCapture(pointer);
    pointer = null;
    if (event.type !== "pointercancel" && moved && !reduced)
      frame = requestAnimationFrame(tick);
    resetTimer = setTimeout(() => (moved = false), 0);
  }
  function wheel(event) {
    event.preventDefault();
    if (!canStart()) return;
    cancelAnimationFrame(frame);
    onStart();
    onDelta(-(event.deltaY + event.deltaX) * 0.09);
  }
  root.addEventListener("pointerdown", down);
  root.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
  root.addEventListener("wheel", wheel, { passive: false });
  return {
    get isPointerDown() {
      return pointer !== null;
    },
    get wasDragged() {
      return moved;
    },
    stop() {
      cancelAnimationFrame(frame);
    },
    destroy() {
      cancelAnimationFrame(frame);
      clearTimeout(resetTimer);
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      root.removeEventListener("wheel", wheel);
    },
  };
}
