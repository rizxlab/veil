const faces = (names, symbols) =>
  names.map((name, index) => ({ name, symbol: symbols[index] + "\uFE0E" }));
// Product face set: ten celestial bodies plus the two lunar nodes.
export const DICE = [
  {
    id: "planet",
    label: "星体",
    faces: faces(
      [
        "太阳",
        "月亮",
        "水星",
        "金星",
        "火星",
        "木星",
        "土星",
        "天王星",
        "海王星",
        "冥王星",
        "北交点",
        "南交点",
      ],
      ["☉", "☽", "☿", "♀", "♂", "♃", "♄", "♅", "♆", "♇", "☊", "☋"],
    ),
  },
  {
    id: "sign",
    label: "星座",
    faces: faces(
      [
        "白羊座",
        "金牛座",
        "双子座",
        "巨蟹座",
        "狮子座",
        "处女座",
        "天秤座",
        "天蝎座",
        "射手座",
        "摩羯座",
        "水瓶座",
        "双鱼座",
      ],
      ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"],
    ),
  },
  {
    id: "house",
    label: "宫位",
    faces: Array.from({ length: 12 }, (_, i) => ({
      name: `第${["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"][i]}宫`,
      symbol: String(i + 1),
    })),
  },
];
export const resultFaces = (record) =>
  DICE.map((die) => die.faces[record.values[die.id]]);
