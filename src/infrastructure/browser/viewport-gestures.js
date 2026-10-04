/** iOS fallback for browsers that allow pinch despite viewport/touch-action. */
export function installViewportGestures(target = document) {
  const options = { capture: true, passive: false };
  const preventPinch = (event) => {
    if (event.touches.length > 1 && event.cancelable) event.preventDefault();
  };
  const preventGesture = (event) => {
    // Safari also exposes these events for desktop trackpads; leave those alone.
    if (target.defaultView?.navigator.maxTouchPoints > 0 && event.cancelable)
      event.preventDefault();
  };
  for (const type of ["touchstart", "touchmove"])
    target.addEventListener(type, preventPinch, options);
  for (const type of ["gesturestart", "gesturechange"])
    target.addEventListener(type, preventGesture, options);
  return () => {
    for (const type of ["touchstart", "touchmove"])
      target.removeEventListener(type, preventPinch, options);
    for (const type of ["gesturestart", "gesturechange"])
      target.removeEventListener(type, preventGesture, options);
  };
}
