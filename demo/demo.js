// The playground: choose a sport, an example, a language and how to draw it; the bracket (or the road to the final), its table and the call that makes it are redrawn.
import * as T from "./dist/index.js";
import { examples, SPORTS } from "./examples.js";
import { renderEmblem } from "./emblems.js";
import { FLAGS } from "./flags-data.js";
import { fillBracket } from "./play.js";
import { ROAD_CARDS } from "./road-data.js";
import { initRankings } from "./rankings.js";
import { initMedals } from "./medals.js";
import { initBoards } from "./boards.js";

const ALL = examples(T);
const $ = (id) => document.getElementById(id);
const DEFAULTS = { size: "auto", theme: "auto", shape: "auto", look: "road", view: "bracket", estyle: "metal", bg: "auto", layout: "tree", scores: true, seeds: false, champion: true, third: true, labels: true, trophy: true, path: false, links: false, codes: false, vs: false, headers: false, at: false };
const TOGGLES = ["scores", "seeds", "champion", "third", "labels", "trophy", "path", "links", "codes", "vs", "headers", "at"];
const GROUPS = ["size", "theme", "shape", "look", "view", "estyle", "layout"];
/** The layouts that show the seeds unless asked not to, and the names the buttons carry. */
const SEEDED = ["rows", "update", "series", "columns", "picture"];
const LAYOUT_NAMES = { tree: "Tree", rows: "Rows", shields: "Shields", update: "Update", columns: "Columns", playin: "Play-in", series: "Series", groups: "Groups", picture: "Picture" };
/** The examples whose tournament has no road to the final to draw. */
const NO_ROAD = new Set(["cupGroups", "softballGroups", "nba2024playin", "judo66"]);
/** The background each example opens with: the playing surface of its sport where there is one, else a poster background that suits it. "plain" is the look's flat colour. */
const BG_OF = { nhl2024: "ice", nhl1984: "aurora", nba2024: "hardwood", mlb2022: "infield", mlb2025: "infield", nfl2024: "turf", cfl2024: "sunburst", mls2024: "waves", poster: "stardust", wc2022: "pitch", wc1938: "ball-panels", generic32: "halftone", twoLegs: "confetti", nba2024playin: "hardwood", cupGroups: "midnight", softballGroups: "royal", judo66: "emerald" };
const bgKey = (example) => BG_OF[example.key] ?? "midnight";
/** The custom background's own settings, and the visitor's picture (a data address read in the browser; it never leaves the page). */
const custom = { preset: "midnight", colors: ["#0b1230", "#1b2160", "#7f8cff", "#c7ceff"], angle: 160, intensity: 0.6, seed: 1 };
const picture = { src: null, fit: "cover", dim: 0.5 };
/** The league's default emblem id for an example (`renderEmblem` is the trophy plug-in), or undefined for the made-up ones. */
const emblemOf = (example) => T.LEAGUE_EMBLEMS[example.sport === "wc" ? "worldcup" : example.sport];
const LANG_KEY = "taisen-brackets.locale";

const kept = () => { try { return localStorage.getItem(LANG_KEY); } catch { return null; } };
const keep = (code) => { try { localStorage.setItem(LANG_KEY, code); } catch { /* Not remembered; still switched. */ } };

const params = new URLSearchParams(location.search);
const first = ALL.find((e) => e.key === params.get("ex")) ?? ALL.find((e) => e.key === "wc2022") ?? ALL[0];
const own = (example) => ({ theme: example.theme ?? "auto", labels: example.options.roundLabels !== false, seeds: example.key === "nhl2024" || SEEDED.includes(example.layouts[0]), layout: example.layouts[0] });
const lang = [params.get("lang"), kept()].find((code) => T.LOCALE_CODES.includes(code)) ?? "en";
const state = { ex: first.key, lang, ...DEFAULTS, ...own(first) };
for (const key of GROUPS) if (params.has(key)) state[key] = params.get(key);
for (const key of TOGGLES) if (params.has(key)) state[key] = params.get(key) === "1";
if (!first.layouts.includes(state.layout)) state.layout = first.layouts[0];
if (params.has("bg") && (["plain", "custom"].includes(params.get("bg")) || T.BACKGROUND_PRESETS.includes(params.get("bg")))) state.bg = params.get("bg");
if (params.get("bgp") && T.BACKGROUND_PRESETS.includes(params.get("bgp"))) custom.preset = params.get("bgp");
if (/^(#[0-9a-f]{6}-?){1,4}$/i.test(params.get("bgc") ?? "")) params.get("bgc").split("-").forEach((c, i) => { custom.colors[i] = c.startsWith("#") ? c : `#${c}`; });
for (const [name, key] of [["bga", "angle"], ["bgi", "intensity"], ["bgs", "seed"]]) if (Number.isFinite(Number(params.get(name))) && params.has(name)) custom[key] = Number(params.get(name));

const rankings = initRankings({ T, flags: (code) => FLAGS[code], lang: () => state.lang, params, $ });
const boards = initBoards({ T, lang: () => state.lang, params, $ });
const medals = initMedals({ T, flags: (code) => FLAGS[code], lang: () => state.lang, params, $ });
const narrow = matchMedia("(max-width: 640px)");
const current = () => ALL.find((e) => e.key === state.ex);
const sizeNow = () => (state.size === "auto" ? (narrow.matches ? "phone" : state.layout === "series" ? "card" : "wide") : state.size);

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
  if (state.layout !== "tree") options.layout = state.layout;
  if (state.headers) options.headers = true;
  if (state.at && state.layout === "columns") options.at = true;
  options.champion = state.champion;
  options.thirdPlace = state.third ? "below" : "hide";
  options.roundLabels = state.labels;
  const emblem = emblemOf(example);
  if (emblem && state.trophy) Object.assign(options, { emblems: renderEmblem, trophy: emblem, emblemStyle: state.estyle });
  if (state.path) options.highlightPath = T.layoutBracket(example.data).champion?.id;
  if (state.links) options.href = hrefOf;
  if (state.codes) options.codes = true;
  if (state.vs) options.vs = true;
  const background = backgroundFor(example);
  if (background !== undefined) options.background = background;
  return options;
}

/** The `background` option the controls say: the example's own, a preset, the custom one, the visitor's picture, or none for the look's plain colour. */
function backgroundFor(example) {
  if (state.bg === "plain") return undefined;
  if (state.bg === "custom") return { preset: custom.preset, colors: [...custom.colors], angle: custom.angle, intensity: custom.intensity, seed: custom.seed };
  if (state.bg === "image") return picture.src ? { image: picture.src, fit: picture.fit, dim: picture.dim } : bgKey(example);
  return state.bg === "auto" ? bgKey(example) : state.bg;
}

/** The options of the road to the final, for the same tournament. */
function roadOptionsFor(example, size) {
  const options = { size, locale: state.lang, teamName, flags, title: titleOf(example) };
  if (example.options.roundNames) options.roundNames = example.options.roundNames;
  if (state.theme !== "auto" || !example.theme) options.theme = state.theme;
  const background = backgroundFor(example);
  if (background !== undefined) options.background = background;
  return options;
}

const defaultsFor = (example) => ({ ...DEFAULTS, ...own(example) });

// ---- Play the games: the page opens on the finished bracket and it stays still. It fills in game by game while the mouse is over it (a tap on a phone starts it and a tap stops it) and stops when the pointer leaves, or with Play,
// Pause, Play again and the slider; a reader who prefers reduced motion is never played to unasked. An address that names a game opens at it: `?game=9&play=0`.
// A change to the options, the language or the layout redraws the bracket as it stands and leaves the games coming in.
const PLAYABLE = new Set(["nhl2024", "nhl1984", "nba2024", "mlb2022", "nfl2024", "cfl2024", "mls2024", "poster", "wc2022", "wc1938", "generic32"]);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
/** How long each game shows, in milliseconds: 900, or what `?gap=` says (the tests change it). */
const GAME_MS = Math.min(Math.max(Number(params.get("gap")) || 900, 150), 10000);
/** `hover` is true while the games are playing because the pointer is over the bracket (so that leaving stops them); Play and a tap clear it. */
const play = { ex: null, k: 0, total: 0, on: false, hover: false, fromAddress: params.has("game") };
const playable = () => PLAYABLE.has(state.ex) && state.view === "bracket" && state.layout !== "groups" && state.layout !== "playin";
/** The bracket as it stands after `play.k` games, or the whole of it when this one is not played out. */
const dataNow = (example) => (playable() ? fillBracket(T, example.data, play.k).data : example.data);
/** Called as a playable example is drawn: the first time for it (the page opening, or the visitor choosing it), the bracket is whole and still, and the games start from the first when it is played. */
function armPlay(example) {
  if (play.ex === state.ex) return;
  play.ex = state.ex;
  play.total = fillBracket(T, example.data, 0).total;
  if (play.fromAddress) {
    play.k = Math.min(Math.max(Number.parseInt(params.get("game") ?? "0", 10) || 0, 0), play.total);
    play.on = false;
    play.fromAddress = false;
  } else {
    play.on = false;
    play.k = play.total;
  }
  play.hover = false;
}
function syncPlay() {
  const on = playable();
  $("playbar").hidden = !on;
  if (!on) return;
  $("play").textContent = play.on ? "Pause" : "Play";
  $("stage").dataset.playing = String(play.on);
  $("play").setAttribute("aria-pressed", String(play.on));
  $("game").max = String(play.total);
  $("game").value = String(play.k);
  $("game-out").textContent = `${play.k} of ${play.total}`;
}
/** While it plays the address says nothing about it (a reload starts the games again); paused, it names the game. */
function playParams() {
  return playable() && !play.on && play.k < play.total ? [["play", "0"], ["game", String(play.k)]] : [];
}
function syncPlayUrl() {
  const next = new URLSearchParams(location.search);
  next.delete("play");
  next.delete("game");
  for (const [key, value] of playParams()) next.set(key, value);
  try { history.replaceState(null, "", `?${next}${location.hash}`); } catch { /* the address stays */ }
}
/** The height of the finished bracket over its width, so that the stage keeps room for it and nothing below moves as the champion and the trophy come in. */
let fullRatio = 0;
const ratioOf = (svg) => { const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg.slice(0, 600)); return m ? Number(m[2]) / Number(m[1]) : 0; };
function reserveStage() {
  const stage = $("stage");
  const svg = stage.querySelector("svg");
  if (!svg || !fullRatio || !playable()) { stage.style.minHeight = ""; return; }
  const style = getComputedStyle(stage);
  stage.style.minHeight = `${Math.ceil(svg.getBoundingClientRect().width * fullRatio + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom))}px`;
}
/** Only the bracket, as it stands, is drawn again. */
function paintBracket() {
  $("stage").innerHTML = T.drawBracket(dataNow(current()), optionsFor(current(), sizeNow()));
  reserveStage();
}
/** One more game. */
function tick() {
  if (!play.on || document.hidden || !playable()) return;
  play.k += 1;
  if (play.k >= play.total) play.on = false;
  paintBracket();
  syncPlay();
}
setInterval(tick, GAME_MS);
/** Starts the games (from the first when the bracket is whole) or holds them; `hover` says the pointer did it. */
function setPlaying(on, hover) {
  if (on && !play.on && play.k >= play.total) play.k = 0;
  play.on = on;
  play.hover = on && hover;
  paintBracket();
  syncPlay();
  syncPlayUrl();
}
$("play").addEventListener("click", () => setPlaying(!play.on, false));
// The mouse: the games run while the pointer is over the bracket. A touch or a pen: a tap on the bracket plays or pauses it (a mouse click does nothing, so a link on a box opens as it should).
const stageEl = $("stage");
let lastPointer = "mouse";
stageEl.addEventListener("pointerdown", (event) => { lastPointer = event.pointerType; });
stageEl.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse" && playable() && !reducedMotion.matches && !play.on) setPlaying(true, true); });
stageEl.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse" && play.hover && play.on) setPlaying(false, false); });
stageEl.addEventListener("click", (event) => {
  if (lastPointer === "mouse" || !playable() || event.target.closest?.("a")) return;
  setPlaying(!play.on, false);
});
$("restart").addEventListener("click", () => {
  play.k = 0;
  play.hover = false;
  play.on = true;
  paintBracket();
  syncPlay();
  syncPlayUrl();
});
$("game").addEventListener("input", () => {
  play.k = Number($("game").value);
  play.on = false;
  paintBracket();
  syncPlay();
  syncPlayUrl();
});

function draw() {
  const example = current();
  if (playable()) armPlay(example);
  const size = sizeNow();
  const planned = state.layout === "groups" || state.layout === "playin";
  const road = state.view === "road" && !NO_ROAD.has(example.key);
  const options = road ? roadOptionsFor(example, size) : optionsFor(example, size);
  const stage = $("stage");
  const chart = road ? T.roadToFinal(example.data, options) : null;
  stage.innerHTML = road ? chart.draw() : T.drawBracket(dataNow(example), options);
  if (!road && playable()) fullRatio = play.k >= play.total ? ratioOf(stage.innerHTML) : ratioOf(T.drawBracket(example.data, options));
  reserveStage();
  stage.dataset.size = size;
  stage.dataset.lang = state.lang;
  stage.dataset.view = state.view;
  $("note").textContent = road ? `The road to the final, drawn from the same tournament as the bracket: the two sides of the final, the ties each played on the way, and the score between their flags. ${example.note}` : `${example.note}${playable() ? " Hover over the bracket to watch the games come in (tap it on a phone)." : ""}`;
  $("table").innerHTML = road ? chart.table() : T.bracketTable(example.data, { roundNames: options.roundNames, locale: state.lang, teamName });
  const shown = { ...options };
  delete shown.teamName;
  const withEmblem = typeof shown.emblems === "function";
  if (withEmblem) { shown.emblems = "@@renderEmblem@@"; shown.trophy = `@@LEAGUE_EMBLEMS.${example.sport === "wc" ? "worldcup" : example.sport}@@`; }
  if (shown.flags) shown.flags = "@@(code) => loadedFlags[code]@@";
  if (shown.href) shown.href = "@@(tie) => `#tie-${tie.id}`@@";
  if (shown.highlightPath !== undefined) shown.highlightPath = "@@champion.id@@";
  if (shown.roundNames) shown.roundNames = example.roundNamesCode ? `@@${example.roundNamesCode}@@` : shown.roundNames;
  // The visitor's own picture is a long data address: the call names it.
  if (shown.background?.image) shown.background = { ...shown.background, image: "@@pictureAsDataAddressOrUrl@@" };
  const json = JSON.stringify(shown, null, 2).replace(/"@@(.*?)@@"/g, "$1");
  const withNames = json.replace(/\n}$/, ",\n  teamName: (team, locale) => team.region && countryName(team.region, locale)\n}");
  const emblemImport = withEmblem ? `import { renderEmblem } from "@johnmorrisdotca/dougu-sports/emblems";\n` : "";
  const flagLine = shown.flags ? `// Hata's round flags, loaded once: const loadedFlags = { AR: await flag("AR", { shape: "round" }), ... }\n` : "";
  const champion = shown.highlightPath ? `const champion = layoutBracket(${example.key}).champion;\n` : "";
  const call = road ? `roadToFinal(${example.key}, ${withNames}).draw()` : `drawBracket(${example.key}, ${withNames})`;
  $("code").firstChild.textContent = `import { ${road ? "roadToFinal" : "drawBracket"}, countryName${champion ? ", layoutBracket" : ""}, playoffFormat${withEmblem ? ", LEAGUE_EMBLEMS" : ""} } from "@johnmorrisdotca/taisen-brackets";\n${emblemImport}\n// ${example.key}: { teams, matchups }; each national team carries its ISO code as \`region\` and \`flag\`\n${flagLine}${champion}const svg = ${call};\n`;
  const sport = SPORTS.find((s) => s.key === example.sport);
  $("trophy-rows").hidden = $("trophy-chip").hidden = road || planned || !emblemOf(example);
  for (const id of ["shape-row"]) $(id).hidden = road || state.layout !== "tree";
  $("show-row").hidden = road || planned;
  $("layout-row").hidden = road || example.layouts.length < 2;
  $("layout").innerHTML = example.layouts.map((l) => `<button type="button" data-value="${l}" aria-pressed="${l === state.layout}">${LAYOUT_NAMES[l]}</button>`).join("");
  $("headers-chip").hidden = !example.layouts.some((l) => l !== "groups" && l !== "playin") || planned;
  $("at-chip").hidden = state.layout !== "columns";
  $("view").parentElement.hidden = NO_ROAD.has(example.key);
  for (const group of [...GROUPS, "lang"]) for (const b of $(group).querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.value === state[group === "lang" ? "lang" : group]));
  for (const b of document.querySelectorAll("[data-toggle]")) b.setAttribute("aria-pressed", String(state[b.dataset.toggle]));
  for (const b of $("sport").querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.value === sport.key));
  const siblings = ALL.filter((e) => e.sport === example.sport);
  $("example").innerHTML = siblings.map((e) => `<button type="button" data-value="${e.key}" aria-pressed="${e.key === example.key}">${e.label}</button>`).join("");
  $("example-row").hidden = siblings.length < 2;
  for (const b of $("gallery").querySelectorAll("button")) b.setAttribute("aria-current", String(b.dataset.value === state.ex));
  syncBackground();
  const next = new URLSearchParams();
  next.set("ex", state.ex);
  const base = defaultsFor(example);
  for (const key of GROUPS) if (state[key] !== base[key]) next.set(key, state[key]);
  for (const key of TOGGLES) if (state[key] !== base[key]) next.set(key, state[key] ? "1" : "0");
  if (state.bg !== "auto" && state.bg !== "image") next.set("bg", state.bg);
  if (state.bg === "custom") {
    next.set("bgp", custom.preset);
    next.set("bgc", custom.colors.join("-"));
    next.set("bga", String(custom.angle));
    next.set("bgi", String(custom.intensity));
    next.set("bgs", String(custom.seed));
  }
  if (state.lang !== "en") next.set("lang", state.lang);
  for (const [key, value] of playParams()) next.set(key, value);
  for (const [key, value] of boardParams()) next.set(key, value);
  for (const [key, value] of queueParams()) next.set(key, value);
  for (const [key, value] of roadParams()) next.set(key, value);
  for (const [key, value] of rankings.address()) next.set(key, value);
  for (const [key, value] of medals.address()) next.set(key, value);
  for (const [key, value] of boards.address()) next.set(key, value);
  history.replaceState(null, "", `?${next}${location.hash}`);
  syncPlay();
  if (boardReady) { drawBoard(); drawQueue(); drawRoad(); rankings.refresh(); medals.refresh(); boards.refresh(); }
}

function choose(key) {
  const example = ALL.find((e) => e.key === key);
  // The style, the view and the background are the visitor's own choices and stay when another example opens.
  const stay = { look: state.look, view: state.view, bg: state.bg };
  const layout = example.layouts.includes(state.layout) ? state.layout : example.layouts[0];
  Object.assign(state, defaultsFor(example), stay, { ex: key, layout });
  state.seeds = example.key === "nhl2024" || SEEDED.includes(layout);
  draw();
}

function gallery() {
  $("gallery").innerHTML = ALL.map((e) => {
    const emblem = emblemOf(e);
    const svg = T.drawBracket(e.data, { ...e.options, ...(emblem && { emblems: renderEmblem, trophy: emblem }), ...(e.layouts[0] !== "tree" && { layout: e.layouts[0] }), look: "road", flags, size: "wide", id: `g-${e.key}`, locale: state.lang, teamName, title: titleOf(e), subtitle: e.subtitles?.[state.lang] ?? e.options.subtitle, background: bgKey(e), seeds: e.key === "nhl2024" });
    return `<li><button type="button" data-value="${e.key}" aria-label="${e.title}"><span class="shot" aria-hidden="true">${svg.replace(' role="img"', "")}</span><b>${SPORTS.find((s) => s.key === e.sport).label}: ${e.label}</b></button></li>`;
  }).join("");
}

/** Each layout on a sport that suits it, with a background that suits both: [example, layout, background]. */
const LAYOUT_TILES = [["wc2022", "tree", "pitch"], ["nhl2024", "rows", "ice"], ["nhl2024", "update", "aurora"], ["wc2022", "shields", "floodlights"], ["nfl2024", "columns", "turf"], ["nba2024playin", "playin", "hardwood"], ["nba2024", "series", "carbon"], ["cupGroups", "groups", "midnight"], ["softballGroups", "groups", "royal"], ["mlb2025", "picture", "infield"]];
function layoutGallery() {
  $("layout-gallery").innerHTML = LAYOUT_TILES.map(([key, layout, bg]) => {
    const e = ALL.find((x) => x.key === key);
    const emblem = emblemOf(e);
    const svg = T.drawBracket(e.data, { ...e.options, ...(emblem && { emblems: renderEmblem, trophy: emblem }), layout, look: "road", flags, size: layout === "series" ? "card" : "wide", id: `l-${key}-${layout}`, locale: state.lang, teamName, title: titleOf(e), subtitle: e.subtitles?.[state.lang] ?? e.options.subtitle, background: bg, seeds: SEEDED.includes(layout) || key === "nhl2024" });
    return `<li><button type="button" data-value="${key}" data-layout="${layout}" data-bg="${bg}" aria-label="${LAYOUT_NAMES[layout]}: ${e.title}"><span class="shot" aria-hidden="true">${svg.replace(' role="img"', "")}</span><b>${LAYOUT_NAMES[layout]}: ${SPORTS.find((s) => s.key === e.sport).label} ${e.label}</b></button></li>`;
  }).join("");
}
$("layout-gallery").addEventListener("click", (event) => {
  const b = event.target.closest("button");
  if (!b) return;
  choose(b.dataset.value);
  state.layout = b.dataset.layout;
  state.bg = b.dataset.bg;
  state.seeds = b.dataset.value === "nhl2024" || SEEDED.includes(state.layout);
  draw();
  $("stage").scrollIntoView({ behavior: "smooth", block: "start" });
});

/** The road to the final of three real tournaments (the World Cups of 2022 and 2026, with Hata's round flags, and the 2024 Stanley Cup playoffs, each team its initials on its colour): a card, the wide card, a phone in the dark and a square, each with its table. */
function roadCards() {
  const common = { locale: state.lang, teamName, flags };
  $("road-cards").innerHTML = ROAD_CARDS.map((card) => {
    const example = ALL.find((e) => e.key === card.example);
    const chart = T.roadToFinal(example.data, { ...common, size: card.size, background: card.background, endnote: card.endnote, ...(card.theme && { theme: card.theme }), title: titleOf(example), ...(example.options.roundNames && { roundNames: example.options.roundNames }), id: `road-${card.key}` });
    return `<figure data-road="${card.key}">${chart.draw()}<details data-testid="road-table-${card.key}"><summary>Table</summary><div class="table-wrap">${chart.table()}</div></details></figure>`;
  }).join("");
}

$("sport").innerHTML = SPORTS.map((s) => `<button type="button" data-value="${s.key}">${s.label}</button>`).join("");
$("sport").addEventListener("click", (event) => { const b = event.target.closest("button"); if (b) choose(ALL.find((e) => e.sport === b.dataset.value).key); });
$("example").addEventListener("click", (event) => { const b = event.target.closest("button"); if (b) choose(b.dataset.value); });
for (const group of GROUPS) {
  $(group).addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    state[group] = b.dataset.value;
    if (group === "layout") state.seeds = current().key === "nhl2024" || SEEDED.includes(state.layout);
    draw();
  });
}
$("lang").addEventListener("click", (event) => {
  const b = event.target.closest("button");
  if (!b) return;
  state.lang = b.dataset.value;
  keep(state.lang);
  gallery();
  layoutGallery();
  roadCards();
  if (bgBuilt) backgroundGallery();
  draw();
});
$("toggles").addEventListener("click", (event) => { const b = event.target.closest("[data-toggle]"); if (b) { state[b.dataset.toggle] = !state[b.dataset.toggle]; draw(); } });
narrow.addEventListener("change", () => { if (state.size === "auto") draw(); });
$("gallery").addEventListener("click", (event) => { const b = event.target.closest("button"); if (b) { choose(b.dataset.value); $("stage").scrollIntoView({ behavior: "smooth", block: "start" }); } });

// ---------------------------------------------------------------------------------------------- the background picker

/** The example each background is shown on in the gallery of all twenty-five: the sport it suits, else one chosen to vary the sports. */
const BG_SPORTS = { midnight: "nhl2024", crimson: "mls2024", royal: "wc2022", emerald: "cfl2024", pitch: "wc2022", ice: "nhl2024", hardwood: "nba2024", infield: "mlb2022", turf: "nfl2024", "ball-panels": "wc1938", swirl: "nba2024", waves: "mls2024", glow: "poster", floodlights: "wc2022", confetti: "twoLegs", carbon: "nfl2024", aurora: "nhl1984", sunburst: "cfl2024", chevrons: "mlb2022", halftone: "generic32", argyle: "nhl1984", contour: "wc1938", stardust: "poster", mesh: "nba2024", spotlight: "wc2022" };
/** The variant of the pictures on the buttons: the one the drawing's look is. */
const thumbTheme = () => (state.theme === "light" ? "light" : state.theme === "dark" || state.theme === "poster" ? "dark" : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
let swatchTheme = null;

function swatches() {
  const theme = thumbTheme();
  swatchTheme = theme;
  const thumb = (name) => {
    const made = T.backgroundSvg(name, { width: 96, height: 56, theme, id: `sw-${name}` });
    return `<svg viewBox="0 0 96 56" aria-hidden="true" focusable="false"><defs>${made.defs}</defs><rect width="96" height="56" fill="${made.ink.base}"/>${made.body}</svg>`;
  };
  const plain = (value, label) => `<button type="button" class="swatch swatch-text" data-value="${value}"><span>${label}</span></button>`;
  $("bg").innerHTML = [plain("auto", "Own"), plain("plain", "Plain"), ...T.BACKGROUND_PRESETS.map((name) => `<button type="button" class="swatch" data-value="${name}" aria-label="${name}">${thumb(name)}<span>${name}</span></button>`), plain("custom", "Custom"), plain("image", "Image")].join("");
}

/** The picker follows the state: which button is pressed, which extra controls show, and the pictures in the look's variant. */
function syncBackground() {
  if (swatchTheme !== thumbTheme()) swatches();
  for (const b of $("bg").querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.value === state.bg));
  $("bg-custom").hidden = state.bg !== "custom";
  $("bg-image").hidden = state.bg !== "image";
}

function customControls() {
  $("bg-preset").innerHTML = T.BACKGROUND_PRESETS.map((name) => `<option value="${name}">${name}</option>`).join("");
  const sync = () => {
    $("bg-preset").value = custom.preset;
    custom.colors.forEach((c, i) => { $(`bg-c${i}`).value = c; });
    $("bg-angle").value = custom.angle;
    $("bg-intensity").value = custom.intensity;
    $("bg-seed").value = custom.seed;
  };
  sync();
  $("bg-preset").addEventListener("change", () => { custom.preset = $("bg-preset").value; draw(); });
  for (let i = 0; i < 4; i += 1) $(`bg-c${i}`).addEventListener("input", () => { custom.colors[i] = $(`bg-c${i}`).value; draw(); });
  $("bg-angle").addEventListener("input", () => { custom.angle = Number($("bg-angle").value); draw(); });
  $("bg-intensity").addEventListener("input", () => { custom.intensity = Number($("bg-intensity").value); draw(); });
  $("bg-seed").addEventListener("input", () => { custom.seed = Math.max(1, Math.floor(Number($("bg-seed").value) || 1)); draw(); });
  $("bg-fit").addEventListener("change", () => { picture.fit = $("bg-fit").value; draw(); });
  $("bg-dim").addEventListener("input", () => { picture.dim = Number($("bg-dim").value); draw(); });
  // A picture is read in this browser and used as a data address: it is not uploaded anywhere.
  $("bg-file").addEventListener("change", () => {
    const file = $("bg-file").files?.[0];
    if (!file) return;
    $("bg-file-note").textContent = "";
    if (!file.type.startsWith("image/") || file.size > 6_000_000) { $("bg-file-note").textContent = "Choose an image of 6 MB or less."; return; }
    const reader = new FileReader();
    reader.addEventListener("load", () => { picture.src = String(reader.result); $("bg-file-note").textContent = `${file.name}, read here and not uploaded.`; draw(); });
    reader.readAsDataURL(file);
  });
}

$("bg").addEventListener("click", (event) => {
  const b = event.target.closest("button");
  if (!b) return;
  state.bg = b.dataset.value;
  draw();
});

/** All twenty-five backgrounds, each on a bracket of the sport it suits. Built when the section comes into view: it is a lot of drawing. */
function backgroundGallery() {
  $("bg-gallery").innerHTML = T.BACKGROUND_PRESETS.map((name) => {
    const e = ALL.find((x) => x.key === BG_SPORTS[name]);
    const emblem = emblemOf(e);
    const svg = T.drawBracket(e.data, { ...e.options, ...(emblem && { emblems: renderEmblem, trophy: emblem }), look: "road", flags, size: "wide", id: `bg-${name}`, locale: state.lang, teamName, title: titleOf(e), subtitle: e.subtitles?.[state.lang] ?? e.options.subtitle, background: name, seeds: e.key === "nhl2024" });
    return `<li><button type="button" data-value="${name}" data-example="${e.key}" aria-label="${name}"><span class="shot" aria-hidden="true">${svg.replace(' role="img"', "")}</span><b>${name}: ${SPORTS.find((s) => s.key === e.sport).label}</b></button></li>`;
  }).join("");
}
let bgBuilt = false;
const buildBackgroundGallery = () => { if (!bgBuilt) { bgBuilt = true; backgroundGallery(); } };
$("bg-gallery").addEventListener("click", (event) => {
  const b = event.target.closest("button");
  if (!b) return;
  choose(b.dataset.example);
  state.bg = b.dataset.value;
  draw();
  $("stage").scrollIntoView({ behavior: "smooth", block: "start" });
});
if (typeof IntersectionObserver === "function") {
  const watcher = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { buildBackgroundGallery(); watcher.disconnect(); } }, { rootMargin: "400px" });
  watcher.observe($("bg-gallery"));
} else buildBackgroundGallery();
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => syncBackground());

// ---- The judo scoreboard: the state is in the address, nothing is stored or sent.
const BOARD_DEFAULTS = { style: "board", size: "tv", theme: "auto", swap: false, gs: false, fin: false, w: [0, 1, 0, 1], b: [0, 0, 2, 2], clock: "2:14", osa: { side: 0, seconds: 12 } };
const board = { ...BOARD_DEFAULTS, w: [...BOARD_DEFAULTS.w], b: [...BOARD_DEFAULTS.b], osa: { ...BOARD_DEFAULTS.osa } };
let boardReady = false;
const BOARD_LIMITS = [1, 2, 20, 3];
const BOARD_NAMES = ["Ippon", "Waza-ari", "Yuko", "Shido"];
const ints = (text, n) => { const a = String(text ?? "").split(",").map(Number); return a.length === n && a.every((x, i) => Number.isInteger(x) && x >= 0 && x <= BOARD_LIMITS[i]) ? a : null; };
for (const key of ["style", "size", "theme"]) if (params.has(`b${key}`)) board[key] = params.get(`b${key}`);
if (!["board", "flip"].includes(board.style)) board.style = BOARD_DEFAULTS.style;
if (!Object.keys(T.JUDO_BOARD_SIZES).includes(board.size)) board.size = BOARD_DEFAULTS.size;
if (!["auto", "light", "dark"].includes(board.theme)) board.theme = BOARD_DEFAULTS.theme;
for (const key of ["swap", "gs", "fin"]) if (params.has(`b${key}`)) board[key] = params.get(`b${key}`) === "1";
board.w = ints(params.get("bw"), 4) ?? board.w;
board.b = ints(params.get("bb"), 4) ?? board.b;
if (params.has("bclock") && /^\d{1,2}:[0-5]\d$/.test(params.get("bclock"))) board.clock = params.get("bclock");
if (params.has("bosa")) {
  const m = /^([01]):(\d{1,2})$/.exec(params.get("bosa"));
  board.osa = m ? { side: Number(m[1]), seconds: Math.min(Number(m[2]), 20) } : null;
}
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
/** The address parameters of the board state that differ from the defaults. */
function boardParams() {
  const out = [];
  for (const key of ["style", "size", "theme"]) if (board[key] !== BOARD_DEFAULTS[key]) out.push([`b${key}`, board[key]]);
  for (const key of ["swap", "gs", "fin"]) if (board[key] !== BOARD_DEFAULTS[key]) out.push([`b${key}`, board[key] ? "1" : "0"]);
  if (!sameList(board.w, BOARD_DEFAULTS.w)) out.push(["bw", board.w.join(",")]);
  if (!sameList(board.b, BOARD_DEFAULTS.b)) out.push(["bb", board.b.join(",")]);
  if (board.clock !== BOARD_DEFAULTS.clock) out.push(["bclock", board.clock]);
  const o = board.osa, d = BOARD_DEFAULTS.osa;
  if ((o === null) !== false || (o && (o.side !== d.side || o.seconds !== d.seconds))) out.push(["bosa", o ? `${o.side}:${o.seconds}` : "none"]);
  return out;
}
const sideOfList = (list) => ({ ...(list[0] ? { ippon: true } : {}), wazaAri: list[1], yuko: list[2], shido: list[3] });
function boardContest() {
  return {
    white: { name: "Daiki Hoshino", code: "JPN", flag: "JP", coach: "Yuki Mori" },
    blue: { name: "Mathis Roussel", code: "FRA", flag: "FR", coach: "Alain Lefort" },
    sides: [sideOfList(board.w), sideOfList(board.b)],
    clock: board.clock, goldenScore: board.gs, finished: board.fin,
    ...(board.osa ? { osaekomi: board.osa } : {}),
    weight: T.judoCategoryLabel({ sex: "men", weight: "-66" }, state.lang), round: T.roundName(2), mat: 1, contest: "G-24",
  };
}
const boardOptions = () => ({ size: board.size, style: board.style, theme: board.theme, swap: board.swap, flags, locale: state.lang });
function boardControls() {
  const seg = (id, label, key, values) => `<div class="fam-row"><span class="fam-label">${label}</span><div class="fam-seg" role="group" aria-label="${label}" id="${id}">${values.map(([v, t]) => `<button type="button" data-value="${v}" data-key="${key}" aria-pressed="${board[key] === v}">${t}</button>`).join("")}</div></div>`;
  const counters = (list, side, title) => `<div class="fam-row"><span class="fam-label">${title}</span><div class="counters" id="board-${side}">${BOARD_NAMES.map((n, i) => `<span class="counter" data-side="${side}" data-i="${i}"><span class="name">${n}</span>${i === 0 ? `<button type="button" data-step="1" aria-pressed="${list[0] === 1}" aria-label="${title}: ippon on or off">${list[0] ? "On" : "Off"}</button>` : `<button type="button" data-step="-1" aria-label="${title}: fewer ${n.toLowerCase()}">−</button><output aria-live="polite">${list[i]}</output><button type="button" data-step="1" aria-label="${title}: more ${n.toLowerCase()}">+</button>`}</span>`).join("")}</div></div>`;
  $("board-controls").innerHTML = [
    seg("board-style", "Style", "style", [["board", "Board"], ["flip", "Flip cards"]]),
    seg("board-size", "Size", "size", [["tv", "TV"], ["tablet", "Tablet"], ["tablet-tall", "Tablet, upright"]]),
    seg("board-theme", "Look", "theme", [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]]),
    counters(board.w, "w", "White"),
    counters(board.b, "b", "Blue"),
    `<div class="fam-row"><span class="fam-label">Clock</span><div class="counters"><label class="board-field">Time <input type="text" id="board-clock" inputmode="numeric" value="${board.clock}" aria-describedby="board-note" /></label><label class="board-field">Osaekomi <select id="board-osa-side"><option value="none">none</option><option value="0">white holds</option><option value="1">blue holds</option></select></label><label class="board-field">Seconds <input type="range" id="board-osa-sec" min="0" max="20" step="1" /></label></div></div>`,
    `<div class="fam-row"><span class="fam-label">Show</span><div class="fam-actions"><button type="button" class="fam-chip" data-bflag="gs" aria-pressed="${board.gs}">Golden score</button><button type="button" class="fam-chip" data-bflag="fin" aria-pressed="${board.fin}">Contest finished</button><button type="button" class="fam-chip" data-bflag="swap" aria-pressed="${board.swap}">Blue first</button></div></div>`,
  ].join("");
}
function drawBoard() {
  const stage = $("board-stage");
  let svg;
  try {
    svg = T.judoScoreboard(boardContest(), boardOptions());
    $("board-note").textContent = "";
  } catch (error) {
    $("board-note").textContent = `That state cannot happen in judo: ${error.message.replace(/^taisen-brackets: /, "")}`;
    return;
  }
  stage.innerHTML = svg;
  stage.dataset.size = board.size;
  for (const b of $("board-controls").querySelectorAll("[data-key]")) b.setAttribute("aria-pressed", String(board[b.dataset.key] === b.dataset.value));
  for (const b of $("board-controls").querySelectorAll("[data-bflag]")) b.setAttribute("aria-pressed", String(board[b.dataset.bflag]));
  for (const side of ["w", "b"]) for (const c of $(`board-${side}`).querySelectorAll(".counter")) {
    const i = Number(c.dataset.i), list = board[side];
    if (i === 0) { const btn = c.querySelector("button"); btn.textContent = list[0] ? "On" : "Off"; btn.setAttribute("aria-pressed", String(list[0] === 1)); } else c.querySelector("output").textContent = String(list[i]);
  }
  $("board-osa-side").value = board.osa ? String(board.osa.side) : "none";
  $("board-osa-sec").value = String(board.osa?.seconds ?? 0);
  $("board-osa-sec").disabled = !board.osa;
  const next = new URLSearchParams(location.search);
  for (const key of [...next.keys()]) if (/^b(style|size|theme|swap|gs|fin|w|b|clock|osa)$/.test(key)) next.delete(key);
  for (const [key, value] of boardParams()) next.set(key, value);
  for (const [key, value] of queueParams()) next.set(key, value);
  for (const [key, value] of roadParams()) next.set(key, value);
  history.replaceState(null, "", `?${next}${location.hash}`);
  $("board-code").firstChild.textContent = `import { judoScoreboard } from "@johnmorrisdotca/taisen-brackets";\n\n// Hata's round flags, loaded once: const loadedFlags = { JP: await flag("JP", { shape: "round" }), ... }\nconst svg = judoScoreboard(${JSON.stringify(boardContest(), null, 2)}, ${JSON.stringify({ ...boardOptions(), flags: "@@(code) => loadedFlags[code]@@" }, null, 2).replace(/"@@(.*?)@@"/g, "$1")});\n`;
}
function boardEvents() {
  $("board-controls").addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    if (b.dataset.key) board[b.dataset.key] = b.dataset.value;
    else if (b.dataset.bflag) board[b.dataset.bflag] = !board[b.dataset.bflag];
    else if (b.dataset.step) {
      const c = b.closest(".counter"), side = c.dataset.side, i = Number(c.dataset.i);
      const list = board[side];
      list[i] = i === 0 ? 1 - list[0] : Math.min(BOARD_LIMITS[i], Math.max(0, list[i] + Number(b.dataset.step)));
      // Only one side can score ippon or a second waza-ari: the other side's is cleared, so the state stays one the rules allow.
      const other = board[side === "w" ? "b" : "w"];
      if (i === 0 && list[0] === 1) other[0] = 0;
      if (i === 1 && list[1] === 2 && other[1] === 2) other[1] = 1;
    }
    drawBoard();
  });
  $("board-clock").addEventListener("input", () => { const v = $("board-clock").value.trim(); if (/^\d{1,2}:[0-5]\d$/.test(v)) { board.clock = v; drawBoard(); } });
  $("board-osa-side").addEventListener("change", () => { const v = $("board-osa-side").value; board.osa = v === "none" ? null : { side: Number(v), seconds: board.osa?.seconds ?? 8 }; drawBoard(); });
  $("board-osa-sec").addEventListener("input", () => { if (board.osa) { board.osa = { ...board.osa, seconds: Number($("board-osa-sec").value) }; drawBoard(); } });
}

// ---- The contest card and the mat queue board: the state (which screen, how many mats) is in the address.
const QUEUE_DEFAULTS = { view: "queue", mats: 2, size: "tv", theme: "auto", swap: false };
const queue = { ...QUEUE_DEFAULTS };
if (["queue", "card"].includes(params.get("qview"))) queue.view = params.get("qview");
if (/^[1-6]$/.test(params.get("qmats") ?? "")) queue.mats = Number(params.get("qmats"));
if (Object.keys(T.JUDO_BOARD_SIZES).includes(params.get("qsize"))) queue.size = params.get("qsize");
if (["auto", "light", "dark"].includes(params.get("qtheme"))) queue.theme = params.get("qtheme");
if (params.get("qswap") === "1") queue.swap = true;
function queueParams() {
  return Object.entries({ qview: queue.view, qmats: queue.mats, qsize: queue.size, qtheme: queue.theme, qswap: queue.swap ? 1 : 0 })
    .filter(([key, value]) => String(value) !== String({ qview: QUEUE_DEFAULTS.view, qmats: QUEUE_DEFAULTS.mats, qsize: QUEUE_DEFAULTS.size, qtheme: QUEUE_DEFAULTS.theme, qswap: 0 }[key]))
    .map(([key, value]) => [key, String(value)]);
}
/** The invented athletes of the demo's judo tournament, with their codes. */
const SAMPLE = [
  ["Daiki Hoshino", "JPN", "JP"], ["Mathis Roussel", "FRA", "FR"], ["Levan Mtchedlishvili", "GEO", "GE"], ["Min-jae Seong", "KOR", "KR"], ["Rafael Tavares", "BRA", "BR"], ["Jasur Rakhimov", "UZB", "UZ"],
  ["Tomás Zaldívar", "CUB", "CU"], ["Joris van Dijk", "NED", "NL"], ["Emil Hartmann", "GER", "DE"], ["Alonso Caballero", "ESP", "ES"], ["Gianluca Ferraro", "ITA", "IT"], ["Elnur Qasimov", "AZE", "AZ"],
  ["Temuulen Batsaikhan", "MGL", "MN"], ["Owen Callahan", "CAN", "CA"], ["Marcus Whitfield", "USA", "US"], ["Balázs Kertész", "HUN", "HU"],
].map(([name, code, flag]) => ({ name, code, flag }));
/** The contests of mat `m` of `n`: numbers G-1, G-2… interleaved across the mats, athletes taken round the list. */
const queueMat = (m, n) => ({ mat: m, contests: Array.from({ length: 8 }, (_, i) => ({ number: `G-${i * n + m}`, white: SAMPLE[(m * 3 + i * 2) % 16], blue: SAMPLE[(m * 3 + i * 2 + 5) % 16] })) });
function drawQueue() {
  const mats = Array.from({ length: queue.mats }, (_, i) => queueMat(i + 1, queue.mats));
  const options = { size: queue.size, theme: queue.theme, swap: queue.swap, flags, locale: state.lang };
  const card = { white: SAMPLE[0], blue: SAMPLE[1], weight: T.judoCategoryLabel({ sex: "men", weight: "-66" }, state.lang), round: T.roundName(2), mat: 1, contest: "G-1" };
  $("queue-stage").innerHTML = queue.view === "card" ? T.judoContestCard(card, options) : T.judoMatQueue(mats, options);
  $("queue-stage").dataset.size = queue.size;
  for (const b of $("queue-controls").querySelectorAll("[data-qkey]")) b.setAttribute("aria-pressed", String(String(queue[b.dataset.qkey]) === b.dataset.value));
  $("queue-controls").querySelector("[data-qflag]").setAttribute("aria-pressed", String(queue.swap));
  $("queue-controls").querySelector("#queue-mats-row").hidden = queue.view === "card";
  const next = new URLSearchParams(location.search);
  for (const key of [...next.keys()]) if (/^q(view|mats|size|theme|swap)$/.test(key)) next.delete(key);
  for (const [key, value] of queueParams()) next.set(key, value);
  for (const [key, value] of roadParams()) next.set(key, value);
  history.replaceState(null, "", `?${next}${location.hash}`);
  const shown = queue.view === "card" ? `judoContestCard(${JSON.stringify(card, null, 2)}` : `judoMatQueue(${JSON.stringify(mats.map((m) => ({ ...m, contests: `@@${m.contests.length} contests: { number, white, blue }@@` })), null, 2).replace(/"@@(.*?)@@"/g, "[/* $1 */]")}`;
  $("queue-code").firstChild.textContent = `import { ${queue.view === "card" ? "judoContestCard" : "judoMatQueue"} } from "@johnmorrisdotca/taisen-brackets";\n\n// An athlete is { name, code, flag }; Hata's round flags are loaded once.\nconst svg = ${shown}, ${JSON.stringify({ ...options, flags: "@@(code) => loadedFlags[code]@@" }, null, 2).replace(/"@@(.*?)@@"/g, "$1")});\n`;
}
function queueControls() {
  const seg = (label, key, values) => `<div class="fam-row"><span class="fam-label">${label}</span><div class="fam-seg" role="group" aria-label="${label}">${values.map(([v, t]) => `<button type="button" data-qkey="${key}" data-value="${v}" aria-pressed="${String(queue[key]) === String(v)}">${t}</button>`).join("")}</div></div>`;
  $("queue-controls").innerHTML = [
    seg("Screen", "view", [["queue", "Mat queue"], ["card", "Contest card"]]),
    `<div id="queue-mats-row">${seg("Mats", "mats", [1, 2, 3, 4, 5, 6].map((n) => [n, String(n)]))}</div>`,
    seg("Size", "size", [["tv", "TV"], ["tablet", "Tablet"], ["tablet-tall", "Tablet, upright"]]),
    seg("Look", "theme", [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]]),
    `<div class="fam-row"><span class="fam-label">Show</span><div class="fam-actions"><button type="button" class="fam-chip" data-qflag="swap" aria-pressed="${queue.swap}">Blue first</button></div></div>`,
  ].join("");
  $("queue-controls").addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    if (b.dataset.qkey) queue[b.dataset.qkey] = b.dataset.qkey === "mats" ? Number(b.dataset.value) : b.dataset.value;
    else if (b.dataset.qflag) queue.swap = !queue.swap;
    drawQueue();
  });
}

// ---- The road-to-the-final panel of a judoka: the athlete, size, look and colour are in the address.
const ROAD_DEFAULTS = { athlete: "J01", size: "tv", theme: "auto", side: "blue", order: "latest" };
const roadState = { ...ROAD_DEFAULTS };
const JUDO_DATA = () => ALL.find((e) => e.key === "judo66").data;
if (JUDO_DATA().teams.some((t) => t.id === params.get("rathlete"))) roadState.athlete = params.get("rathlete");
if (Object.keys(T.JUDO_BOARD_SIZES).includes(params.get("rsize"))) roadState.size = params.get("rsize");
if (["auto", "light", "dark"].includes(params.get("rtheme"))) roadState.theme = params.get("rtheme");
if (["white", "blue"].includes(params.get("rside"))) roadState.side = params.get("rside");
if (["latest", "first"].includes(params.get("rorder"))) roadState.order = params.get("rorder");
function roadParams() {
  return Object.keys(ROAD_DEFAULTS).filter((k) => roadState[k] !== ROAD_DEFAULTS[k]).map((k) => [`r${k}`, roadState[k]]);
}
const COACHES = { J01: "Yuki Mori", J02: "Alain Lefort" };
function drawRoad() {
  const data = JUDO_DATA();
  const team = data.teams.find((t) => t.id === roadState.athlete);
  const athlete = { name: team.name, code: team.code, flag: team.flag, ...(COACHES[team.id] ? { coach: COACHES[team.id] } : {}) };
  const wins = T.judoWins(data, team.id, { locale: state.lang });
  const options = { size: roadState.size, theme: roadState.theme, side: roadState.side, order: roadState.order, flags, locale: state.lang, weight: T.judoCategoryLabel({ sex: "men", weight: "-66" }, state.lang) };
  $("judoroad-stage").innerHTML = T.judoRoadPanel({ athlete, wins }, options);
  $("judoroad-stage").dataset.size = roadState.size;
  for (const b of $("judoroad-controls").querySelectorAll("[data-rkey]")) b.setAttribute("aria-pressed", String(roadState[b.dataset.rkey] === b.dataset.value));
  $("road-athlete").value = roadState.athlete;
  const next = new URLSearchParams(location.search);
  for (const key of [...next.keys()]) if (/^r(athlete|size|theme|side|order)$/.test(key)) next.delete(key);
  for (const [key, value] of roadParams()) next.set(key, value);
  history.replaceState(null, "", `?${next}${location.hash}`);
  $("judoroad-code").firstChild.textContent = `import { judoWins, judoRoadPanel } from "@johnmorrisdotca/taisen-brackets";\n\n// judo66: { teams, matchups }, the bracket above; each team carries { name, code, flag }\nconst wins = judoWins(judo66, ${JSON.stringify(team.id)}, { locale: ${JSON.stringify(state.lang)} });\nconst svg = judoRoadPanel(${JSON.stringify({ athlete }, null, 2).replace(/\n}$/, ",\n  wins\n}")}, ${JSON.stringify({ ...options, flags: "@@(code) => loadedFlags[code]@@" }, null, 2).replace(/"@@(.*?)@@"/g, "$1")});\n`;
}
function roadControls() {
  const seg = (label, key, values) => `<div class="fam-row"><span class="fam-label">${label}</span><div class="fam-seg" role="group" aria-label="${label}">${values.map(([v, t]) => `<button type="button" data-rkey="${key}" data-value="${v}" aria-pressed="${roadState[key] === v}">${t}</button>`).join("")}</div></div>`;
  $("judoroad-controls").innerHTML = [
    `<div class="fam-row"><span class="fam-label">Athlete</span><label class="board-field"><select id="road-athlete" aria-label="Athlete">${JUDO_DATA().teams.map((t) => `<option value="${t.id}">${t.seed}. ${t.name} (${t.code})</option>`).join("")}</select></label></div>`,
    seg("Size", "size", [["tv", "TV"], ["tablet", "Tablet"], ["tablet-tall", "Tablet, upright"]]),
    seg("Look", "theme", [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]]),
    seg("Block", "side", [["blue", "Blue"], ["white", "White"]]),
    seg("Order", "order", [["latest", "Latest first"], ["first", "Oldest first"]]),
  ].join("");
  $("judoroad-controls").addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (!b?.dataset.rkey) return;
    roadState[b.dataset.rkey] = b.dataset.value;
    drawRoad();
  });
  $("judoroad-controls").addEventListener("change", (event) => {
    if (event.target.id === "road-athlete") { roadState.athlete = event.target.value; drawRoad(); }
  });
}

swatches();
customControls();
gallery();
layoutGallery();
roadCards();
draw();
boardControls();
boardEvents();
boardReady = true;
drawBoard();
queueControls();
drawQueue();
roadControls();
drawRoad();
rankings.draw();
medals.draw();
boards.draw();
