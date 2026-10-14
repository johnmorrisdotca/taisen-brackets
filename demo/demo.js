// The playground: choose a sport, an example, a language and how to draw it; the bracket (or the road to the final), its table and the call that makes it are redrawn.
import * as T from "./dist/index.js";
import { examples, SPORTS } from "./examples.js";
import { renderEmblem } from "./emblems.js";
import { FLAGS } from "./flags-data.js";
import { ROAD_FINAL, SERIES_EMBLEMS, roadFinalists, roadSeries } from "./road-data.js";

const ALL = examples(T);
const $ = (id) => document.getElementById(id);
const DEFAULTS = { size: "auto", theme: "auto", shape: "auto", look: "road", view: "bracket", estyle: "metal", scores: true, seeds: false, champion: true, third: true, labels: true, trophy: true, path: false, links: false };
const TOGGLES = ["scores", "seeds", "champion", "third", "labels", "trophy", "path", "links"];
const GROUPS = ["size", "theme", "shape", "look", "view", "estyle"];
/** The league's default emblem id for an example (`renderEmblem` is the trophy plug-in), or undefined for the made-up ones. */
const emblemOf = (example) => T.LEAGUE_EMBLEMS[example.sport === "wc" ? "worldcup" : example.sport];
const LANG_KEY = "taisen-brackets.locale";

const kept = () => { try { return localStorage.getItem(LANG_KEY); } catch { return null; } };
const keep = (code) => { try { localStorage.setItem(LANG_KEY, code); } catch { /* Not remembered; still switched. */ } };

const params = new URLSearchParams(location.search);
const first = ALL.find((e) => e.key === params.get("ex")) ?? ALL[0];
const own = (example) => ({ theme: example.theme ?? "auto", labels: example.options.roundLabels !== false });
const lang = [params.get("lang"), kept()].find((code) => T.LOCALE_CODES.includes(code)) ?? "en";
const state = { ex: first.key, lang, ...DEFAULTS, ...own(first) };
for (const key of GROUPS) if (params.has(key)) state[key] = params.get(key);
for (const key of TOGGLES) if (params.has(key)) state[key] = params.get(key) === "1";

const narrow = matchMedia("(max-width: 640px)");
const current = () => ALL.find((e) => e.key === state.ex);
const sizeNow = () => (state.size === "auto" ? (narrow.matches ? "phone" : "wide") : state.size);

/** The names of countries in the chosen language, from Intl.DisplayNames by the ISO code a team carries: no list is written. Clubs have no code and keep their names. */
const teamName = (team, locale) => (team.region ? T.countryName(team.region, locale) : undefined);
/** Round flags by country code: Hata's, made once by `pnpm flags` and loaded with the page. A drawing is a pure function of its options, so the renderer is a plain lookup. */
const flags = (code) => FLAGS[code];
/** Where a tie's box links to in the demo. */
const hrefOf = (tie) => `#tie-${tie.id}`;

/** The title a language gives an example: its own for the World Cups, and a name that needs none (NHL 2024) for the leagues. */
const titleOf = (example) => example.titles?.[state.lang] ?? (state.lang === "en" || !example.neutral ? example.options.title : example.neutral);

/** The options for the bracket: the example's own, then what the controls say. */
function optionsFor(example, size) {
  const options = { ...example.options, size, locale: state.lang, teamName, flags, look: state.look };
  const title = titleOf(example);
  if (title !== undefined) options.title = title;
  const subtitle = example.subtitles?.[state.lang];
  if (subtitle) options.subtitle = subtitle;
  if (state.theme !== "auto" || !example.theme) options.theme = state.theme;
  if (state.shape !== "auto") options.shape = state.shape;
  options.scores = state.scores;
  options.seeds = state.seeds;
  options.champion = state.champion;
  options.thirdPlace = state.third ? "below" : "hide";
  options.roundLabels = state.labels;
  const emblem = emblemOf(example);
  if (emblem && state.trophy) Object.assign(options, { emblems: renderEmblem, trophy: emblem, emblemStyle: state.estyle });
  if (state.path) options.highlightPath = T.layoutBracket(example.data).champion?.id;
  if (state.links) options.href = hrefOf;
  return options;
}

/** The options of the road to the final, for the same tournament. */
function roadOptionsFor(example, size) {
  const options = { size, locale: state.lang, teamName, flags, title: titleOf(example) };
  if (example.options.roundNames) options.roundNames = example.options.roundNames;
  if (state.theme !== "auto" || !example.theme) options.theme = state.theme;
  return options;
}

const defaultsFor = (example) => ({ ...DEFAULTS, ...own(example) });

function draw() {
  const example = current();
  const size = sizeNow();
  const road = state.view === "road";
  const options = road ? roadOptionsFor(example, size) : optionsFor(example, size);
  const stage = $("stage");
  const chart = road ? T.roadToFinal(example.data, options) : null;
  stage.innerHTML = road ? chart.draw() : T.drawBracket(example.data, options);
  stage.dataset.size = size;
  stage.dataset.lang = state.lang;
  stage.dataset.view = state.view;
  $("note").textContent = road ? `The road to the final, drawn from the same tournament as the bracket: the two sides of the final, the ties each played on the way, and the score between their flags. ${example.note}` : example.note;
  $("table").innerHTML = road ? chart.table() : T.bracketTable(example.data, { roundNames: options.roundNames, locale: state.lang, teamName });
  const shown = { ...options };
  delete shown.teamName;
  const withEmblem = typeof shown.emblems === "function";
  if (withEmblem) { shown.emblems = "@@renderEmblem@@"; shown.trophy = `@@LEAGUE_EMBLEMS.${example.sport === "wc" ? "worldcup" : example.sport}@@`; }
  if (shown.flags) shown.flags = "@@(code) => loadedFlags[code]@@";
  if (shown.href) shown.href = "@@(tie) => `#tie-${tie.id}`@@";
  if (shown.highlightPath !== undefined) shown.highlightPath = "@@champion.id@@";
  if (shown.roundNames) shown.roundNames = example.roundNamesCode ? `@@${example.roundNamesCode}@@` : shown.roundNames;
  const json = JSON.stringify(shown, null, 2).replace(/"@@(.*?)@@"/g, "$1");
  const withNames = json.replace(/\n}$/, ",\n  teamName: (team, locale) => team.region && countryName(team.region, locale)\n}");
  const emblemImport = withEmblem ? `import { renderEmblem } from "@johnmorrisdotca/dougu-sports/emblems";\n` : "";
  const flagLine = shown.flags ? `// Hata's round flags, loaded once: const loadedFlags = { AR: await flag("AR", { shape: "round" }), ... }\n` : "";
  const champion = shown.highlightPath ? `const champion = layoutBracket(${example.key}).champion;\n` : "";
  const call = road ? `roadToFinal(${example.key}, ${withNames}).draw()` : `drawBracket(${example.key}, ${withNames})`;
  $("code").firstChild.textContent = `import { ${road ? "roadToFinal" : "drawBracket"}, countryName${champion ? ", layoutBracket" : ""}, playoffFormat${withEmblem ? ", LEAGUE_EMBLEMS" : ""} } from "@johnmorrisdotca/taisen-brackets";\n${emblemImport}\n// ${example.key}: { teams, matchups }; each national team carries its ISO code as \`region\` and \`flag\`\n${flagLine}${champion}const svg = ${call};\n`;
  const sport = SPORTS.find((s) => s.key === example.sport);
  $("trophy-rows").hidden = $("trophy-chip").hidden = road || !emblemOf(example);
  for (const id of ["shape-row", "show-row"]) $(id).hidden = road;
  for (const group of [...GROUPS, "lang"]) for (const b of $(group).querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.value === state[group === "lang" ? "lang" : group]));
  for (const b of document.querySelectorAll("[data-toggle]")) b.setAttribute("aria-pressed", String(state[b.dataset.toggle]));
  for (const b of $("sport").querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.value === sport.key));
  const siblings = ALL.filter((e) => e.sport === example.sport);
  $("example").innerHTML = siblings.map((e) => `<button type="button" data-value="${e.key}" aria-pressed="${e.key === example.key}">${e.label}</button>`).join("");
  $("example-row").hidden = siblings.length < 2;
  for (const b of $("gallery").querySelectorAll("button")) b.setAttribute("aria-current", String(b.dataset.value === state.ex));
  const next = new URLSearchParams();
  next.set("ex", state.ex);
  const base = defaultsFor(example);
  for (const key of GROUPS) if (state[key] !== base[key]) next.set(key, state[key]);
  for (const key of TOGGLES) if (state[key] !== base[key]) next.set(key, state[key] ? "1" : "0");
  if (state.lang !== "en") next.set("lang", state.lang);
  history.replaceState(null, "", `?${next}`);
}

function choose(key) {
  const example = ALL.find((e) => e.key === key);
  // The style and the view are the visitor's own choices and stay when another example opens.
  const stay = { look: state.look, view: state.view };
  Object.assign(state, defaultsFor(example), stay, { ex: key });
  draw();
}

function gallery() {
  $("gallery").innerHTML = ALL.map((e) => {
    const emblem = emblemOf(e);
    const svg = T.drawBracket(e.data, { ...e.options, ...(emblem && { emblems: renderEmblem, trophy: emblem }), look: "road", flags, size: "wide", id: `g-${e.key}`, locale: state.lang, teamName, title: titleOf(e), subtitle: e.subtitles?.[state.lang] ?? e.options.subtitle });
    return `<li><button type="button" data-value="${e.key}" aria-label="${e.title}"><span class="shot" aria-hidden="true">${svg.replace(' role="img"', "")}</span><b>${SPORTS.find((s) => s.key === e.sport).label}: ${e.label}</b></button></li>`;
  }).join("");
}

/** The road to the final of made-up nations (a card, the wide card, a phone in the dark) and of a made-up play-off series, each with its table. */
function roadCards() {
  const rounds = T.LOCALES[state.lang].rounds;
  const series = { "first-round": rounds["First Round"] ?? "First round", "second-round": rounds["Second Round"] ?? "Second round", "conference-final": rounds["Conference Finals"] ?? "Conference final", final: rounds.Final ?? "Cup final" };
  const common = { locale: state.lang, teamName };
  const cards = [
    ["card", roadToFinalOf(roadFinalists(), { ...common, title: "Northern Cup 2030", final: ROAD_FINAL, endnote: "Made-up results", id: "road-card" })],
    ["wide", roadToFinalOf(roadFinalists(), { ...common, title: "Northern Cup 2030", size: "wide", id: "road-wide" })],
    ["phone", roadToFinalOf(roadFinalists(), { ...common, title: "Northern Cup 2030", final: ROAD_FINAL, size: "phone", theme: "dark", id: "road-phone" })],
    ["series", roadToFinalOf(roadSeries(SERIES_EMBLEMS), { ...common, title: "Cup play-offs", labels: series, size: "square", final: { score: "4-2", note: "Game 6" }, id: "road-series" })],
  ];
  $("road-cards").innerHTML = cards.map(([key, chart]) => `<figure data-road="${key}">${chart.draw()}<details data-testid="road-table-${key}"><summary>Table</summary><div class="table-wrap">${chart.table()}</div></details></figure>`).join("");
}
const roadToFinalOf = (finalists, options) => T.roadToFinal(finalists, options);

$("sport").innerHTML = SPORTS.map((s) => `<button type="button" data-value="${s.key}">${s.label}</button>`).join("");
$("sport").addEventListener("click", (event) => { const b = event.target.closest("button"); if (b) choose(ALL.find((e) => e.sport === b.dataset.value).key); });
$("example").addEventListener("click", (event) => { const b = event.target.closest("button"); if (b) choose(b.dataset.value); });
for (const group of GROUPS) {
  $(group).addEventListener("click", (event) => { const b = event.target.closest("button"); if (b) { state[group] = b.dataset.value; draw(); } });
}
$("lang").addEventListener("click", (event) => {
  const b = event.target.closest("button");
  if (!b) return;
  state.lang = b.dataset.value;
  keep(state.lang);
  gallery();
  roadCards();
  draw();
});
$("toggles").addEventListener("click", (event) => { const b = event.target.closest("[data-toggle]"); if (b) { state[b.dataset.toggle] = !state[b.dataset.toggle]; draw(); } });
narrow.addEventListener("change", () => { if (state.size === "auto") draw(); });
$("gallery").addEventListener("click", (event) => { const b = event.target.closest("button"); if (b) { choose(b.dataset.value); $("stage").scrollIntoView({ behavior: "smooth", block: "start" }); } });

gallery();
roadCards();
draw();
