/** Decorative motion only; no random outcomes or persistence in this layer. */
export function createRollAnimation(root) {
  let animations = [];
  return {
    async play() {
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      animations = [...root.querySelectorAll(".astro-die")].map((die, i) =>
        die.animate(
          reduced
            ? [{ opacity: 0.4 }, { opacity: 1 }]
            : [
                { transform: "translate(0,0) rotate(0) scale(1)", offset: 0 },
                {
                  transform: `translate(${(i - 1) * 18}px,-65px) rotate(-100deg) scale(1.12)`,
                  offset: 0.24,
                },
                {
                  transform: `translate(${(1 - i) * 12}px,8px) rotate(150deg) scale(.94)`,
                  offset: 0.49,
                },
                {
                  transform: `translate(${(i - 1) * 8}px,-24px) rotate(280deg) scale(1.04)`,
                  offset: 0.66,
                },
                {
                  transform: "translate(0,3px) rotate(353deg) scale(.98)",
                  offset: 0.84,
                },
                {
                  transform: "translate(0,0) rotate(360deg) scale(1)",
                  offset: 1,
                },
              ],
          {
            duration: reduced ? 120 : 1350,
            delay: reduced ? 0 : i * 65,
            easing: "ease-in-out",
          },
        ),
      );
      await Promise.all(animations.map((a) => a.finished.catch(() => {})));
    },
    cancel() {
      animations.forEach((a) => a.cancel());
      animations = [];
    },
  };
}
