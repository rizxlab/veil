export const TAROT_SKINS = Object.freeze([
  {
    id: "rws",
    name: "经典韦特",
    description: "Rider–Waite–Smith",
    preview: "/assets/tarot/rws/major-17.jpg",
    extension: "jpg",
  },
  {
    id: "marseille",
    name: "古典马赛",
    description: "Jean Noblet · 约 1650",
    preview: "/assets/tarot/marseille/major-17.jpg",
    extension: "jpg",
  },
]);

export function cardImage(cardId, skinId = "rws") {
  const skin = TAROT_SKINS.find((item) => item.id === skinId) || TAROT_SKINS[0];
  return `/assets/tarot/${skin.id}/${cardId}.${skin.extension}`;
}
