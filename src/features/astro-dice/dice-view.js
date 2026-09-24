import { DICE } from "./data/faces.js";
import { dieMarkup } from "./components/die.js";
import { icon } from "../../shared/ui/icons.js";
export function renderDice() {
  return `<main id="main" class="dice-page" tabindex="-1" aria-label="星骰桌面">
    <nav class="dice-navigation"><div class="dice-title-row"><h1 id="dice-title">星骰</h1><button class="dice-title-settings" id="open-dice-settings" aria-label="打开星骰设置" title="星骰设置">${icon("settings")}</button></div><span class="dice-page-label">ASTRO DICE</span></nav>
    <section class="dice-table" aria-label="三枚十二面星骰"><div class="dice-arrangement">${DICE.map(dieMarkup).join("")}</div></section>
    <section class="dice-result" aria-live="polite" aria-atomic="true"><p id="dice-result-heading">星体 · 星座 · 宫位</p><div id="dice-result-values"><span class="dice-invitation">三枚星骰，一次相遇。</span></div></section>
    <div class="dice-controls"><p id="dice-status" role="status">轻触开始，掷出此刻的星象</p><button id="roll-dice" class="button primary"><span>投掷</span></button></div>
  </main>`;
}
