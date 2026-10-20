// The ranking lists section of the demo: a made-up provincial feed (demo/data/ranking-sample.js) drawn by `rankingList`. The state (which list, style, size, look, movement, columns, page) is in the address,
// under keys that start with `k`, and nowhere else.
import { RANKING_SAMPLE } from "./data/ranking-sample.js";

const DEFAULTS = { view: "list", list: "u18-men-60", style: "podium", size: "tv", theme: "auto", move: "arrow", cols: "auto", name: "surname-first", rank: "plain", rows: "all", page: "0", sort: "entry", meet: "all" };
const KEYS = Object.keys(DEFAULTS);
const PATTERN = new RegExp(`^k(${KEYS.join("|")})$`);
const ONE_OF = {
  view: ["list", "numbers", "entries", "matchup"], list: Object.keys(RANKING_SAMPLE.lists), style: ["podium", "featured", "list"], theme: ["auto", "light", "dark"], move: ["arrow", "row", "both", "none"], cols: ["auto", "1", "2"],
  name: ["surname-first", "given-first"], sort: ["entry", "ranking"], meet: ["all", "none"], rank: ["plain", "hash"], rows: ["all", "10", "5"],
};
const PER_PAGE = { all: 0, 10: 10, 5: 5 };

export function initRankings({ T, flags, lang, params, $ }) {
  const state = { ...DEFAULTS };
  for (const key of KEYS) {
    const value = params.get(`k${key}`);
    if (value === null) continue;
    if (key === "size" ? Object.keys(T.BOARD_SIZES).includes(value) : key === "page" ? /^\d{1,3}$/.test(value) : ONE_OF[key].includes(value)) state[key] = value;
  }
  const address = () => KEYS.filter((k) => state[k] !== DEFAULTS[k]).map((k) => [`k${k}`, state[k]]);
  const date = () => new Intl.DateTimeFormat(lang(), { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 9, 1)));
  const source = () => {
    const l = RANKING_SAMPLE.lists[state.list];
    return { category: T.rankingCategoryLabel(l.category, lang()), date: date(), source: RANKING_SAMPLE.source, entries: l.entries };
  };
  const options = () => {
    const per = PER_PAGE[state.rows];
    const pages = per ? Math.ceil(RANKING_SAMPLE.lists[state.list].entries.length / per) : 1;
    if (Number(state.page) >= pages) state.page = String(pages - 1);
    return {
      size: state.size, theme: state.theme, style: state.style, movement: state.move, ...(state.cols === "auto" ? {} : { columns: Number(state.cols) }), nameStyle: state.name, rankStyle: state.rank, precision: state.list === "u18-men-60" ? 2 : 0,
      ...(per ? { rows: per, page: Number(state.page) } : {}), locale: lang(), flags,
    };
  };

  const numbersSource = () => ({ date: date(), source: RANKING_SAMPLE.source, cards: RANKING_SAMPLE.numberOnes });
  const numbersOptions = () => ({ size: state.size, theme: state.theme, nameStyle: state.name, locale: lang(), flags });
  const entriesSource = () => ({ category: T.rankingCategoryLabel({ sex: "men", weight: "-66" }, lang()), date: RANKING_SAMPLE.entryList.event, source: RANKING_SAMPLE.source, entries: RANKING_SAMPLE.entryList.entries });
  const entriesOptions = () => ({ size: state.size, theme: state.theme, nameStyle: state.name, locale: lang(), flags, sort: state.sort });

  const matchupSource = () => ({ category: T.rankingCategoryLabel({ age: "U18", sex: "men", weight: "-60" }, lang()), date: RANKING_SAMPLE.matchup.event, source: RANKING_SAMPLE.source, a: RANKING_SAMPLE.matchup.a, b: RANKING_SAMPLE.matchup.b, meetings: state.meet === "none" ? [] : RANKING_SAMPLE.matchup.meetings });
  const matchupOptions = () => ({ size: state.size, theme: state.theme, nameStyle: state.name, precision: 2, locale: lang(), flags });

  let drawnIn = null;
  function draw() {
    drawnIn = lang();
    const stage = $("ranking-stage");
    const o = options();
    const view = state.view;
    if (view === "numbers") stage.innerHTML = T.rankingNumberOnes(numbersSource(), numbersOptions());
    else if (view === "entries") stage.innerHTML = T.rankingEntryList(entriesSource(), entriesOptions());
    else if (view === "matchup") stage.innerHTML = T.rankingMatchup(matchupSource(), matchupOptions());
    else stage.innerHTML = T.rankingList(source(), o);
    stage.dataset.size = state.size;
    for (const b of $("ranking-controls").querySelectorAll("[data-kkey]")) b.setAttribute("aria-pressed", String(state[b.dataset.kkey] === b.dataset.value));
    const per = state.view === "list" ? PER_PAGE[state.rows] : 0;
    const pages = per ? Math.ceil(RANKING_SAMPLE.lists[state.list].entries.length / per) : 1;
    for (const row of $("ranking-controls").querySelectorAll("[data-views]")) row.hidden = !row.dataset.views.split(" ").includes(state.view);
    $("ranking-page-row").hidden = !per;
    $("ranking-prev").disabled = Number(state.page) <= 0;
    $("ranking-next").disabled = Number(state.page) >= pages - 1;
    $("ranking-page-now").textContent = `${Number(state.page) + 1} / ${pages}`;
    const next = new URLSearchParams(location.search);
    for (const key of [...next.keys()]) if (PATTERN.test(key)) next.delete(key);
    for (const [key, value] of address()) next.set(key, value);
    history.replaceState(null, "", `?${next}${location.hash}`);
    if (state.view === "matchup") {
      const shown = { ...matchupSource(), meetings: state.meet === "none" ? [] : `@@${RANKING_SAMPLE.matchup.meetings.length} meetings: { date, event, round, winner: 0 | 1 | null, result }@@` };
      $("ranking-code").firstChild.textContent = `import { rankingMatchup } from "@johnmorrisdotca/taisen-brackets";\n\n// a and b are entries: { name: { surname, given }, club, flag, rank, points }\n// Hata's flags, loaded once: const loadedFlags = { "CA-BC": await flag("CA-BC", { shape: "round" }), ... }\nconst svg = rankingMatchup(${JSON.stringify(shown, null, 2).replace(/"@@(.*?)@@"/g, "[/* $1 */]")}, ${JSON.stringify({ ...matchupOptions(), flags: "@@(code) => loadedFlags[code]@@" }, null, 2).replace(/"@@(.*?)@@"/g, "$1")});\n`;
      return;
    }
    if (state.view !== "list") {
      const entry = state.view === "numbers";
      const shown = entry ? { ...numbersSource(), cards: `@@${RANKING_SAMPLE.numberOnes.length} cards: { category: "-60 kg", entry: { name, club, flag, points } }@@` } : { ...entriesSource(), entries: `@@${RANKING_SAMPLE.entryList.entries.length} entries: { name, code, flag, rank }@@` };
      const o2 = entry ? numbersOptions() : entriesOptions();
      $("ranking-code").firstChild.textContent = `import { ${entry ? "rankingNumberOnes" : "rankingEntryList"} } from "@johnmorrisdotca/taisen-brackets";\n\n// Hata's flags, loaded once: const loadedFlags = { "CA-BC": await flag("CA-BC", { shape: "round" }), ... }\nconst svg = ${entry ? "rankingNumberOnes" : "rankingEntryList"}(${JSON.stringify(shown, null, 2).replace(/"@@(.*?)@@"/g, "[/* $1 */]")}, ${JSON.stringify({ ...o2, flags: "@@(code) => loadedFlags[code]@@" }, null, 2).replace(/"@@(.*?)@@"/g, "$1")});\n`;
      return;
    }
    const l = RANKING_SAMPLE.lists[state.list];
    const shown = { ...source(), entries: `@@${l.entries.length} entries: { name, club, flag, points, change }@@` };
    $("ranking-code").firstChild.textContent = `import { rankingList, rankingCategoryLabel } from "@johnmorrisdotca/taisen-brackets";\n\n// An entry is { name: { surname, given }, club, flag: "CA-BC", points, change } (a champion: champion: true).\n// Hata's flags, loaded once: const loadedFlags = { "CA-BC": await flag("CA-BC", { shape: "round" }), ... }\nconst svg = rankingList(${JSON.stringify(shown, null, 2).replace(/"@@(.*?)@@"/g, "[/* $1 */]")}, ${JSON.stringify({ ...o, flags: "@@(code) => loadedFlags[code]@@" }, null, 2).replace(/"@@(.*?)@@"/g, "$1")});\n`;
  }

  const seg = (label, key, values, views = "list") => `<div class="fam-row" data-views="${views}"><span class="fam-label">${label}</span><div class="fam-seg" role="group" aria-label="${label}">${values.map(([v, t]) => `<button type="button" data-kkey="${key}" data-value="${v}" aria-pressed="${state[key] === v}">${t}</button>`).join("")}</div></div>`;
  $("ranking-controls").innerHTML = [
    seg("Show", "view", [["list", "Ranking list"], ["numbers", "Number ones"], ["entries", "Entry list"], ["matchup", "Head to head"]], "list numbers entries matchup"),
    seg("List", "list", [["u18-men-60", "U18 men -60 kg"], ["senior-women-57", "Senior women -57 kg (with a champion)"]]),
    seg("Style", "style", [["podium", "Podium"], ["featured", "Featured, two columns"], ["list", "Plain list"]]),
    seg("Size", "size", [["tv", "TV"], ["tablet", "Tablet"], ["tablet-tall", "Tablet, upright"], ["phone", "Phone"], ["square", "Square card"], ["portrait", "4:5 card"]], "list numbers entries matchup"),
    seg("Look", "theme", [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]], "list numbers entries matchup"),
    seg("Movement", "move", [["arrow", "Arrows"], ["row", "Row colours"], ["both", "Both"], ["none", "None"]]),
    seg("Columns", "cols", [["auto", "By style"], ["1", "One"], ["2", "Two"]]),
    seg("Name", "name", [["surname-first", "SURNAME Given"], ["given-first", "Given SURNAME"]], "list numbers entries matchup"),
    seg("Meetings", "meet", [["all", "Six meetings"], ["none", "None yet"]], "matchup"),
    seg("Order", "sort", [["entry", "As drawn"], ["ranking", "By ranking"]], "entries"),
    seg("Rank", "rank", [["plain", "10"], ["hash", "#10"]]),
    seg("Entries", "rows", [["all", "All that fit"], ["10", "10 a page"], ["5", "5 a page"]]),
    `<div class="fam-row" id="ranking-page-row" data-views="list"><span class="fam-label">Page</span><div class="fam-actions"><button type="button" class="fam-chip" id="ranking-prev">Previous</button><output id="ranking-page-now" aria-live="polite"></output><button type="button" class="fam-chip" id="ranking-next">Next</button></div></div>`,
  ].join("");
  $("ranking-controls").addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    if (b.dataset.kkey) {
      state[b.dataset.kkey] = b.dataset.value;
      // A change of list or page size starts at the first page.
      if (b.dataset.kkey === "list" || b.dataset.kkey === "rows") state.page = "0";
    } else if (b.id === "ranking-prev") state.page = String(Math.max(0, Number(state.page) - 1));
    else if (b.id === "ranking-next") state.page = String(Number(state.page) + 1);
    draw();
  });
  /** Draws again only if the language changed since the last drawing: the other controls of the page do not touch this section. */
  const refresh = () => { if (drawnIn !== lang()) draw(); };
  return { draw, refresh, address };
}
