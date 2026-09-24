/** A temporary card back above the table, independent of the clipped fan. */
export function createCardMotion(source) {
  const bounds = source.getBoundingClientRect();
  const width = source.offsetWidth,
    height = source.offsetHeight;
  const angle = parseFloat(source.style.getPropertyValue("--angle")) || 0;
  const origin = {
    left: bounds.x + bounds.width / 2 - width / 2,
    top: bounds.y + bounds.height / 2 - height / 2,
    width,
    height,
    angle,
  };
  const ghost = document.createElement("div");
  ghost.className = "drag-card";
  ghost.setAttribute("aria-hidden", "true");
  document.body.append(ghost);
  source.classList.add("is-extracted");
  let current = origin,
    animation,
    destroyed = false;
  const frame = (value) => ({
    left: `${value.left}px`,
    top: `${value.top}px`,
    width: `${value.width}px`,
    height: `${value.height}px`,
    transform: `rotate(${value.angle}deg)`,
  });
  function paint(value) {
    current = value;
    Object.assign(ghost.style, frame(value));
  }
  async function travel(destination, duration) {
    if (destroyed) return;
    const start = frame(current);
    paint(destination);
    animation = ghost.animate([start, frame(destination)], {
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : duration,
      easing: "cubic-bezier(.22,1,.36,1)",
    });
    try {
      await animation.finished;
    } catch {
      /* Route changes cancel the flight. */
    }
  }
  paint(origin);
  return {
    move(dx, dy, ready) {
      if (destroyed) return;
      paint({ ...origin, left: origin.left + dx, top: origin.top + dy });
      ghost.classList.toggle("is-ready", ready);
    },
    returnToSource: () => travel(origin, 220),
    async land(target) {
      const rect = target.getBoundingClientRect();
      await travel(
        {
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          angle: 0,
        },
        420,
      );
    },
    destroy() {
      destroyed = true;
      animation?.cancel();
      ghost.remove();
      source.classList.remove("is-extracted");
    },
  };
}
