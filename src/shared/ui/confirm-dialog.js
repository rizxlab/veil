import { escapeHtml } from "../lib/html.js";

export function askConfirmation({
  title,
  message,
  confirmLabel,
  destructive = false,
}) {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "tarot-prompt";
    dialog.innerHTML = /* HTML */ `
      <form method="dialog" class="tarot-prompt-panel">
        <span class="tarot-prompt-mark">✧</span>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(message)}</p>
        <div>
          <button value="cancel" class="button">取消</button>
          <button value="confirm" class="button primary ${destructive ? "is-danger" : ""}" autofocus>${escapeHtml(confirmLabel)}</button>
        </div>
      </form>`;
    document.body.append(dialog);
    let answered = false;
    const finish = (value) => {
      if (answered) return;
      answered = true;
      dialog.remove();
      resolve(value);
    };
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close("cancel");
    });
    dialog.addEventListener("close", () =>
      finish(dialog.returnValue === "confirm"),
    );
    dialog.addEventListener("cancel", () => finish(false));
    dialog.showModal();
  });
}
