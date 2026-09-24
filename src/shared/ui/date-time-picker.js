import { escapeHtml } from "../lib/html.js";

const pad = (value) => String(value).padStart(2, "0");

const localDateTimeValue = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const dateLabel = (date) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);

const timeLabel = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const sameDay = (left, right) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const timeOptions = (count) =>
  Array.from(
    { length: count },
    (_, value) => `<option value="${value}">${pad(value)}</option>`,
  ).join("");

export function dateTimePickerMarkup({ id, name, value }) {
  const date = new Date(value);
  return /* HTML */ `<div class="reading-time" data-date-time-picker>
    <input type="hidden" name="${escapeHtml(name)}" value="${localDateTimeValue(date)}" />
    <button type="button" class="reading-datetime-trigger" data-calendar-toggle aria-expanded="false" aria-controls="${escapeHtml(id)}-popover">
      <span class="reading-time-mark" aria-hidden="true">✦</span>
      <span><small>日期与时间</small><strong><span data-date-label>${dateLabel(date)}</span><i>·</i><span data-time-label>${timeLabel(date)}</span></strong></span>
      <em>修改</em>
    </button>
    <div id="${escapeHtml(id)}-popover" class="reading-datetime-popover" role="dialog" aria-labelledby="${escapeHtml(id)}-popover-title" hidden>
      <div class="reading-datetime-summary">
        <span><small>已选择</small><strong id="${escapeHtml(id)}-popover-title" data-popover-date-label>${dateLabel(date)}</strong></span>
        <b data-popover-time-label>${timeLabel(date)}</b>
      </div>
      <div class="reading-calendar-heading">
        <button type="button" data-month-delta="-1" aria-label="上一个月">‹</button>
        <strong class="reading-calendar-month"></strong>
        <button type="button" data-month-delta="1" aria-label="下一个月">›</button>
      </div>
      <div class="reading-calendar-week" aria-hidden="true"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
      <div class="reading-calendar-days"></div>
      <div class="reading-datetime-footer">
        <div class="reading-clock-fields" aria-label="选择时间">
          <label><span>小时</span><select data-reading-hour>${timeOptions(24)}</select></label>
          <i>:</i>
          <label><span>分钟</span><select data-reading-minute>${timeOptions(60)}</select></label>
        </div>
        <div class="reading-datetime-actions">
          <button type="button" class="reading-now" data-reading-now>现在</button>
          <button type="button" class="reading-datetime-done" data-reading-done>完成</button>
        </div>
      </div>
    </div>
  </div>`;
}

export function mountDateTimePicker(root, initialValue) {
  let selected = new Date(initialValue);
  let calendarMonth = new Date(
    selected.getFullYear(),
    selected.getMonth(),
    1,
  );
  const controller = new AbortController();
  const toggle = root.querySelector("[data-calendar-toggle]");
  const popover = root.querySelector(".reading-datetime-popover");

  const setOpen = (open, restoreFocus = false) => {
    popover.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (restoreFocus) toggle.focus();
  };

  const render = () => {
    root.querySelector('input[type="hidden"]').value = localDateTimeValue(selected);
    root.querySelector("[data-date-label]").textContent = dateLabel(selected);
    root.querySelector("[data-time-label]").textContent = timeLabel(selected);
    root.querySelector("[data-popover-date-label]").textContent =
      dateLabel(selected);
    root.querySelector("[data-popover-time-label]").textContent =
      timeLabel(selected);
    root.querySelector("[data-reading-hour]").value = String(selected.getHours());
    root.querySelector("[data-reading-minute]").value = String(
      selected.getMinutes(),
    );
    root.querySelector(".reading-calendar-month").textContent =
      `${calendarMonth.getFullYear()} 年 ${calendarMonth.getMonth() + 1} 月`;
    const first = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1,
    );
    const gridStart = new Date(first);
    gridStart.setDate(1 - first.getDay());
    const today = new Date();
    root.querySelector(".reading-calendar-days").innerHTML = Array.from(
      { length: 42 },
      (_, index) => {
        const day = new Date(gridStart);
        day.setDate(gridStart.getDate() + index);
        const outside = day.getMonth() !== calendarMonth.getMonth();
        return `<button type="button" data-calendar-date="${day.getFullYear()}-${day.getMonth()}-${day.getDate()}" class="${outside ? "is-outside" : ""} ${sameDay(day, today) ? "is-today" : ""} ${sameDay(day, selected) ? "is-selected" : ""}" aria-label="${dateLabel(day)}" aria-pressed="${sameDay(day, selected)}">${day.getDate()}</button>`;
      },
    ).join("");
  };

  root.addEventListener(
    "click",
    (event) => {
      const toggle = event.target.closest("[data-calendar-toggle]");
      if (toggle) {
        setOpen(popover.hidden);
      }
      const monthButton = event.target.closest("[data-month-delta]");
      if (monthButton) {
        calendarMonth = new Date(
          calendarMonth.getFullYear(),
          calendarMonth.getMonth() + Number(monthButton.dataset.monthDelta),
          1,
        );
        render();
      }
      const dateButton = event.target.closest("[data-calendar-date]");
      if (dateButton) {
        const [year, month, day] = dateButton.dataset.calendarDate
          .split("-")
          .map(Number);
        selected.setFullYear(year, month, day);
        calendarMonth = new Date(year, month, 1);
        render();
      }
      if (event.target.closest("[data-reading-now]")) {
        selected = new Date();
        calendarMonth = new Date(
          selected.getFullYear(),
          selected.getMonth(),
          1,
        );
        render();
      }
      if (event.target.closest("[data-reading-done]")) setOpen(false, true);
    },
    { signal: controller.signal },
  );
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (!popover.hidden && !root.contains(event.target)) setOpen(false);
    },
    { signal: controller.signal, capture: true },
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && !popover.hidden) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false, true);
      }
    },
    { signal: controller.signal, capture: true },
  );
  root.closest("dialog")?.addEventListener(
    "cancel",
    (event) => {
      if (!popover.hidden) {
        event.preventDefault();
        setOpen(false, true);
      }
    },
    { signal: controller.signal },
  );
  root.addEventListener(
    "change",
    (event) => {
      if (event.target.matches("[data-reading-hour]"))
        selected.setHours(Number(event.target.value));
      if (event.target.matches("[data-reading-minute]"))
        selected.setMinutes(Number(event.target.value));
      render();
    },
    { signal: controller.signal },
  );
  render();
  return {
    value: () => selected.toISOString(),
    destroy: () => controller.abort(),
  };
}
