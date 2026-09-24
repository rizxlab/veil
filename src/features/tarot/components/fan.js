import { mountRotationGesture } from "./fan-gesture.js";
import { mountCardDrag } from "./card-drag.js";
/** The fan is presentation only: it knows slots, never card identities. */
export function mountFan(
  root,
  { count, onSelect, onDrop, onDragState, isEnabled = () => true },
) {
  const fan = root.querySelector(".fan-cards");
  let selected = null,
    offset = 0;
  const step = 4.3;
  const clamp = (value) =>
    Math.max(-Math.max(0, (count - 1) * step - 44), Math.min(44, value));
  const buttons = Array.from({ length: count }, (_, i) => {
    const button = document.createElement("button");
    button.className = "fan-card";
    button.type = "button";
    button.setAttribute("aria-label", `选择第 ${i + 1} 张背面牌`);
    button.setAttribute("aria-pressed", "false");
    button.dataset.slot = i;
    button.addEventListener("click", (event) => {
      if (
        !isEnabled() ||
        drag.active ||
        ((gesture.wasDragged || drag.wasDragged) && event.detail !== 0)
      ) {
        event.preventDefault();
        return;
      }
      select(i);
    });
    button.addEventListener("focus", () => {
      if (gesture.isPointerDown || drag.active) return;
      offset = clamp(-i * step);
      paint();
    });
    fan.append(button);
    return button;
  });
  function paint() {
    buttons.forEach((button, i) => {
      const angle = -24 + i * step + offset;
      button.style.setProperty("--angle", `${angle}deg`);
      button.style.setProperty("--lift", selected === i ? "-30px" : "0px");
      button.style.visibility =
        angle < -66 || angle > 66 ? "hidden" : "visible";
      // Roving tab stop exposes the fan without 78 keyboard stops.
      button.tabIndex =
        i === Math.min(count - 1, Math.max(0, Math.round(-offset / step)))
          ? 0
          : -1;
      button.setAttribute("aria-pressed", String(selected === i));
      button.classList.toggle("selected", selected === i);
      button.style.zIndex = String(selected === i ? count + 1 : count - i);
    });
  }
  function select(index) {
    selected = selected === index ? null : index;
    paint();
    onSelect(selected);
  }
  function key(event) {
    if (drag.active || !isEnabled()) return;
    if (
      ![
        "ArrowDown",
        "ArrowUp",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "Escape",
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    gesture.stop();
    if (event.key === "Escape") {
      selected = null;
      paint();
      onSelect(null);
      return;
    }
    const current = Number(document.activeElement?.dataset.slot || 0);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? count - 1
          : Math.max(
              0,
              Math.min(
                count - 1,
                current +
                  (["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1),
              ),
            );
    offset = clamp(-next * step);
    paint();
    buttons[next]?.focus();
  }
  const gesture = mountRotationGesture(root, {
    canStart: () => !drag.active && isEnabled(),
    onStart() {
      selected = null;
      onSelect(null);
    },
    onDelta(delta) {
      offset = clamp(offset + delta);
      paint();
    },
  });
  const drag = mountCardDrag(root, {
    getSelected: () => (selected === null ? null : buttons[selected]),
    isEnabled,
    onStart() {
      gesture.stop();
      onDragState(true, false);
    },
    onProgress(ready) {
      onDragState(true, ready);
    },
    onEnd() {
      onDragState(false, false);
    },
    onDrop,
  });
  root.addEventListener("keydown", key);
  paint();
  return {
    clear() {
      gesture.stop();
      selected = null;
      paint();
      onSelect(null);
    },
    destroy() {
      drag.destroy();
      gesture.destroy();
      root.removeEventListener("keydown", key);
    },
  };
}
