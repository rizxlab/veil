import { icon } from "./icons.js";
export function shell(content, { showProfile = false } = {}) {
  return /* HTML */ `<header class="site-header">
      <a class="brand" href="#/" aria-label="Veil 首页"
        >${icon("mark", "brand-mark")}<span class="brand-word">Veil</span
        ><i class="brand-divider"></i><span class="brand-sub">未明</span></a
      ><nav class="header-actions" aria-label="个人与记录">
        <a class="history-link" href="#/history" aria-label="历史记录"
          >${icon("history")}<span>历史记录</span></a
        >${showProfile
          ? `<a class="profile-link" href="#/profile" aria-label="个人信息"
              >${icon("person")}<span>个人信息</span></a
            >`
          : ""}
      </nav>
    </header>
    ${content}
    <footer class="site-footer">
      <span>VEIL · A MOMENT WITH YOURSELF</span
      ><span class="footer-note">${icon("lock")}只属于你的片刻</span>
    </footer>`;
}
let timeout;
export function notify(message) {
  const el = document.querySelector("#notice");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(timeout);
  timeout = setTimeout(() => (el.hidden = true), 5000);
}
