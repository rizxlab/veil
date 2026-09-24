import { DICE } from "../data/faces.js";
export function dieMarkup(die) {
  return `<div class="die-position die-${die.id}"><div class="astro-die" data-die="${die.id}" role="img" aria-label="${die.label}骰，等待投掷"><img src="/assets/dice/${die.id}.svg" width="160" height="172" alt=""><span class="die-symbol" aria-hidden="true">${die.faces[0].symbol}</span></div><span class="die-caption">${die.label}</span></div>`;
}
export function showDice(root, record) {
  for (const die of DICE) {
    const el = root.querySelector(`[data-die="${die.id}"]`);
    const face = die.faces[record.values[die.id]];
    el.querySelector(".die-symbol").textContent = face.symbol;
    el.setAttribute("aria-label", `${die.label}骰：${face.name}`);
  }
}
