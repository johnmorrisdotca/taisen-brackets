// Made-up data for the demo's "Road to the final" section, and for the tests and the docs of `roadToFinal` and of the round mark: sixteen nations that do not exist, each with a
// simple geometric flag drawn here in code (bands, a diamond, a disc, a chevron: no real national flag, emblem or colour scheme is copied), and two sets of results. The same
// call always gives the same data.

const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20">${inner}</svg>`;
const bands = (colours, across) => colours.map((c, i) => (across ? `<rect y="${(i * 20) / colours.length}" width="30" height="${20 / colours.length + 0.1}" fill="${c}"/>` : `<rect x="${(i * 30) / colours.length}" width="${30 / colours.length + 0.1}" height="20" fill="${c}"/>`)).join("");

/** A flag made of shapes in plain colours: `bands` across or `columns`, a `diamond` with a dot, a `disc`, a `diagonal` split, `quarters` and a `chevron`. */
export const FLAGS = {
  bands: (...colours) => svg(bands(colours, true)),
  columns: (...colours) => svg(bands(colours, false)),
  diamond: (ground, shape, dot) => svg(`<rect width="30" height="20" fill="${ground}"/><path d="M15 2L27 10L15 18L3 10Z" fill="${shape}"/><circle cx="15" cy="10" r="3.4" fill="${dot}"/>`),
  disc: (ground, dot) => svg(`<rect width="30" height="20" fill="${ground}"/><circle cx="15" cy="10" r="5.5" fill="${dot}"/>`),
  diagonal: (a, b) => svg(`<rect width="30" height="20" fill="${a}"/><path d="M0 20L30 0V20Z" fill="${b}"/>`),
  quarters: (a, b) => svg(`<rect width="30" height="20" fill="${a}"/><rect width="15" height="10" fill="${b}"/><rect x="15" y="10" width="15" height="10" fill="${b}"/>`),
  chevron: (ground, shape) => svg(`<rect width="30" height="20" fill="${ground}"/><path d="M0 0L16 10L0 20Z" fill="${shape}"/>`),
};

/** Sixteen nations that do not exist: name, name in Japanese, three letters, colour and flag. */
export const NATIONS = {
  aurelia: { name: "Aurelia", ja: "アウレリア", abbr: "AUR", color: "#0f7a7a", flag: FLAGS.diamond("#0f7a7a", "#f4f0e4", "#e07a1f") },
  calvara: { name: "Calvara", ja: "カルヴァラ", abbr: "CAL", color: "#6b2d5c", flag: FLAGS.columns("#6b2d5c", "#f2c230", "#14233f") },
  borea: { name: "Borea", ja: "ボレア", abbr: "BOR", color: "#8a2d4b", flag: FLAGS.bands("#8a2d4b", "#e8e2cf", "#2f7a67") },
  dornmark: { name: "Dornmark", ja: "ドルンマルク", abbr: "DOR", color: "#c2410c", flag: FLAGS.diagonal("#c2410c", "#14233f") },
  estria: { name: "Estria", ja: "エストリア", abbr: "EST", color: "#3a2d6b", flag: FLAGS.disc("#e8e2cf", "#3a2d6b") },
  fenlund: { name: "Fenlund", ja: "フェンルンド", abbr: "FEN", color: "#1f6b3c", flag: FLAGS.quarters("#1f6b3c", "#f2c230") },
  garrovia: { name: "Garrovia", ja: "ガロビア", abbr: "GAR", color: "#14233f", flag: FLAGS.chevron("#14233f", "#f2a900") },
  helmara: { name: "Helmara", ja: "ヘルマラ", abbr: "HEL", color: "#7a2a8c", flag: FLAGS.bands("#f2c230", "#7a2a8c", "#f2c230") },
  isenmark: { name: "Isenmark", ja: "イーゼンマルク", abbr: "ISE", color: "#3a2d6b", flag: FLAGS.columns("#3a2d6b", "#f4f0e4", "#3a2d6b") },
  kestrel: { name: "Kestrel Isles", ja: "ケストレル諸島", abbr: "KES", color: "#14233f", flag: FLAGS.diamond("#14233f", "#e8e2cf", "#c2410c") },
  lumeria: { name: "Lumeria", ja: "ルメリア", abbr: "LUM", color: "#14233f", flag: FLAGS.disc("#14233f", "#f2c230") },
  norvane: { name: "Norvane", ja: "ノルバーン", abbr: "NRV", color: "#1f6b3c", flag: FLAGS.diagonal("#1f6b3c", "#f4f0e4") },
  ostvale: { name: "Ostvale", ja: "オストベイル", abbr: "OST", color: "#c8102e", flag: FLAGS.bands("#c8102e", "#14233f", "#c8102e") },
  pellasia: { name: "Pellasia", ja: "ペラシア", abbr: "PEL", color: "#1f5fa8", flag: FLAGS.quarters("#1f5fa8", "#f4f0e4") },
  rovana: { name: "Rovana", ja: "ロバナ", abbr: "ROV", color: "#1f6b3c", flag: FLAGS.chevron("#f2c230", "#1f6b3c") },
  valdor: { name: "Valdor", ja: "バルドール", abbr: "VAL", color: "#c2410c", flag: FLAGS.columns("#c2410c", "#f4f0e4", "#c2410c") },
};

/** A nation as a team: its name (and its name in Japanese, which a drawing in that language uses), its three letters, its colour, and its flag as the mark. */
export function nation(key, extra = {}) {
  const n = NATIONS[key];
  return { name: n.name, names: { ja: n.ja }, abbr: n.abbr, color: n.color, mark: n.flag, ...extra };
}

/** The two finalists of a made-up tournament with the matches on their way (a 48-team format: the group stage and four knockout rounds). */
export function roadFinalists() {
  const t = (key) => nation(key);
  const aurelia = {
    ...nation("aurelia"),
    group: [
      { opponent: t("isenmark"), score: [2, 0] },
      { opponent: t("kestrel"), score: [1, 1] },
      { opponent: t("lumeria"), score: [3, 0] },
    ],
    path: [
      { round: "round-of-32", opponent: t("pellasia"), score: [3, 0] },
      { round: "round-of-16", opponent: t("fenlund"), score: [2, 1] },
      { round: "quarter-final", opponent: t("garrovia"), score: [1, 1], decidedBy: "pens", pens: [5, 4] },
      { round: "semi-final", opponent: t("norvane"), score: [2, 1], decidedBy: "aet" },
    ],
  };
  const calvara = {
    ...nation("calvara"),
    group: [
      { opponent: t("estria"), score: [4, 1] },
      { opponent: t("rovana"), score: [0, 1] },
      { opponent: t("borea"), score: [2, 2] },
    ],
    path: [
      { round: "round-of-32", opponent: t("ostvale"), score: [2, 0] },
      { round: "round-of-16", opponent: t("dornmark"), score: [1, 0] },
      { round: "quarter-final", opponent: t("helmara"), score: [2, 2], decidedBy: "pens", pens: [3, 2] },
      { round: "semi-final", opponent: t("valdor"), score: [3, 1] },
    ],
  };
  return [aurelia, calvara];
}

/** The final of that tournament, level after extra time and won on penalties. */
export const ROAD_FINAL = Object.freeze({ score: [2, 2], decidedBy: "pens", pens: [4, 3] });

/** A play-off series instead of a knockout: a best-of-seven in each of three rounds, written as the games won (`4-2`) with a note under it. Two made-up hockey clubs, with emblems. */
export function roadSeries(emblems) {
  const gulls = { name: "Harbour City Gulls", abbr: "HCG", color: "#1f5fa8", mark: emblems.gull };
  const owls = { name: "Northern Owls", abbr: "NOW", color: "#3a2d6b", mark: emblems.owl };
  const club = (name, abbr, color, key) => ({ name, abbr, color, ...(emblems[key] === undefined ? {} : { mark: emblems[key] }) });
  return [
    {
      ...gulls,
      path: [
        { round: "first-round", opponent: club("Metro Bolts", "MTB", "#c2410c", "bolt"), score: "4-1", note: "Game 5" },
        { round: "second-round", opponent: club("Summit Peaks", "SMT", "#14233f", "peak"), score: "4-3", note: "Game 7" },
        { round: "conference-final", opponent: club("Valley Stars", "VAL", "#c8102e", "star"), score: "4-2", note: "Game 6" },
      ],
    },
    {
      ...owls,
      path: [
        { round: "first-round", opponent: club("Coastal Pines", "CPN", "#1f6b3c", "pine"), score: "4-0", note: "Game 4" },
        { round: "second-round", opponent: club("Lakeshore Anchors", "LSA", "#0f7a7a", "anchor"), score: "4-2", note: "Game 6" },
        { round: "conference-final", opponent: club("Prairie Ridge Bison", "PRB", "#b5452c", "bison"), score: "4-3", note: "Game 7" },
      ],
    },
  ];
}

/** Eight small made-up emblems, one for each club of the series: a white disc with a blue bird drawn a little differently for each. */
export const SERIES_EMBLEMS = Object.fromEntries(
  ["gull", "owl", "bolt", "peak", "star", "pine", "anchor", "bison"].map((key, i) => [key, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#fff"/><path d="M${10 + i * 5} 56Q32 18 50 50Q68 18 88 56Q68 46 50 72Q32 46 ${10 + i * 5} 56Z" fill="#1f5fa8"/></svg>`]),
);

/** The names of those rounds. */
export const SERIES_LABELS = Object.freeze({ "first-round": "First round", "second-round": "Second round", "conference-final": "Conference final", final: "Cup final" });

/** The names of those rounds in Japanese. */
export const SERIES_LABELS_JA = Object.freeze({ "first-round": "1回戦", "second-round": "2回戦", "conference-final": "カンファレンス決勝", final: "カップ決勝" });
