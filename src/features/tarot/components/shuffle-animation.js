/** Visual shuffle only; this module never reads card identities or changes order. */
export function createShuffleAnimation(root) {
  const room = root.closest(".reading-room");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const layer = document.createElement("div");
  layer.className = "shuffle-layer";
  layer.setAttribute("aria-hidden", "true");
  room.append(layer);
  let destroyed = false;
  const running = new Set();
  const ghosts = [];
  const originalOpacity = root.style.opacity;

  function visibleCards() {
    const area = room.getBoundingClientRect();
    return Array.from(root.querySelectorAll(".fan-card"))
      .filter((card) => {
        const rect = card.getBoundingClientRect();
        return (
          getComputedStyle(card).visibility !== "hidden" &&
          rect.right > area.left &&
          rect.left < area.right &&
          rect.bottom > area.top &&
          rect.top < area.bottom
        );
      })
      .map((card) => {
        const rect = card.getBoundingClientRect();
        return {
          x: rect.x + rect.width / 2 - area.x,
          y: rect.y + rect.height / 2 - area.y,
          width: card.offsetWidth,
          height: card.offsetHeight,
          angle: parseFloat(card.style.getPropertyValue("--angle")) || 0,
        };
      });
  }
  const originals = visibleCards();
  const width = originals[0]?.width || 80;
  const height = originals[0]?.height || 136;
  const stackX = room.clientWidth - width / 2 - width * 0.3 - 16;
  const stackY = room.clientHeight / 2;
  const position = (index) => ({
    x: stackX + index * 0.35,
    y: stackY - index * 0.28,
    width,
    height,
    angle: 0,
  });
  const frame = (p) => ({
    transform: `translate(${p.x - p.width / 2}px, ${p.y - p.height / 2}px) rotate(${p.angle}deg)`,
    opacity: p.opacity ?? 1,
  });
  function add(p) {
    const el = document.createElement("div");
    el.className = "shuffle-card";
    el.style.zIndex = String(100 - ghosts.length);
    el.style.width = `${p.width}px`;
    el.style.height = `${p.height}px`;
    Object.assign(el.style, frame(p));
    layer.append(el);
    ghosts.push(el);
    return el;
  }
  async function animate(el, frames, duration, delay = 0) {
    if (destroyed) return;
    const animation = el.animate(frames, {
      duration,
      delay,
      fill: "forwards",
      easing: "cubic-bezier(.22,1,.36,1)",
    });
    running.add(animation);
    try {
      await animation.finished;
    } catch {
      /* Disposal cancels the visual without touching saved data. */
    }
    if (!destroyed) Object.assign(el.style, frames.at(-1));
    animation.cancel();
    running.delete(animation);
  }
  return {
    async gatherAndCut() {
      root.dataset.shufflePhase = "gather";
      if (reduced) return;
      originals.forEach(add);
      root.style.opacity = "0";
      await Promise.all(
        ghosts.map((el, i) =>
          animate(el, [frame(originals[i]), frame(position(i))], 250, i * 4),
        ),
      );
      if (destroyed) return;
      root.dataset.shufflePhase = "cut";
      for (let cut = 0; cut < 3 && !destroyed; cut++) {
        await Promise.all(
          ghosts.map((el, i) => {
            const p = position(i),
              direction = (i + cut) % 2 ? 1 : -1;
            return animate(
              el,
              [
                frame(p),
                frame({
                  ...p,
                  x: p.x + direction * width * 0.28,
                  y: p.y - direction * 8,
                  angle: direction * 7,
                }),
                frame(p),
              ],
              180,
              (i % 3) * 9,
            );
          }),
        );
      }
    },
    async expand() {
      if (destroyed) return;
      root.dataset.shufflePhase = "expand";
      if (reduced) {
        await animate(root, [{ opacity: 0.65 }, { opacity: 1 }], 100);
        return;
      }
      const targets = visibleCards();
      while (ghosts.length < targets.length) add(position(ghosts.length));
      await Promise.all(
        ghosts.map((el, i) =>
          animate(
            el,
            [
              frame(position(i)),
              frame(targets[i] || { ...position(i), opacity: 0 }),
            ],
            280,
            i * 3,
          ),
        ),
      );
    },
    destroy() {
      destroyed = true;
      running.forEach((animation) => animation.cancel());
      running.clear();
      root.style.opacity = originalOpacity;
      delete root.dataset.shufflePhase;
      layer.remove();
    },
  };
}
