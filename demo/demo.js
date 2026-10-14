// The playground: choose a sport, an example, a language and how to draw it; the bracket (or the road to the final), its table and the call that makes it are redrawn.
import * as T from "./dist/index.js";
import { examples, SPORTS } from "./examples.js";
import { renderEmblem } from "./emblems.js";
import { FLAGS } from "./flags-data.js";
import { ROAD_FINAL, SERIES_EMBLEMS, roadFinalists, roadSeries } from "./road-data.js";

const ALL = examples(T);
const $ = (id) => document.getElementById(id);
const DEFAULTS = { size: "auto", theme: "auto", shape: "auto", look: "road", view: "bracket", estyle: "metal", bg: "auto", scores: true, seeds: false, champion: true, third: true, labels: true, trophy: true, path: false, links: false, codes: false, vs: false };
const TOGGLES = ["scores", "seeds", "champion", "third", "labels", "trophy", "path", "links", "codes", "vs"];
const GROUPS = ["size", "theme", "shape", "look", "view", "estyle"];
/** The background each example opens with: the playing surface of its sport where there is one, else a poster background that suits it. "plain" is the look's flat colour. */
const BG_OF = { nhl2024: "ice", nhl1984: "aurora", nba2024: "hardwood", mlb2022: "infield", nfl2024: "turf", cfl2024: "sunburst", mls2024: "waves", poster: "stardust", wc2022: "pitch", wc1938: "ball-panels", generic32: "halftone", twoLegs: "confetti" };
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
const first = ALL.find((e) => e.key === params.get("ex")) ?? ALL[0];
const own = (example) => ({ theme: example.theme ?? "auto", labels: example.options.roundLabels !== false, seeds: example.key === "nhl2024" });
const lang = [params.get("lang"), kept()].find((code) => T.LOCALE_CODES.includes(code)) ?? "en";
const state = { ex: first.key, lang, ...DEFAULTS, ...own(first) };
for (const key of GROUPS) if (params.has(key)) state[key] = params.get(key);
for (const key of TOGGLES) if (params.has(key)) state[key] = params.get(key) === "1";
if (params.has("bg") && (["plain", "custom"].includes(params.get("bg")) || T.BACKGROUND_PRESETS.includes(params.get("bg")))) state.bg = params.get("bg");
if (params.get("bgp") && T.BACKGROUND_PRESETS.includes(params.get("bgp"))) custom.preset = params.get("bgp");
if (/^(#[0-9a-f]{6}-?){1,4}$/i.test(params.get("bgc") ?? "")) params.get("bgc").split("-").forEach((c, i) => { custom.colors[i] = c.startsWith("#") ? c : `#${c}`; });
for (const [name, key] of [["bga", "angle"], ["bgi", "intensity"], ["bgs", "seed"]]) if (Number.isFinite(Number(params.get(name))) && params.has(name)) custom[key] = Number(params.get(name));

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
  $("trophy-rows").hidden = $("trophy-chip").hidden = road || !emblemOf(example);
  for (const id of ["shape-row", "show-row"]) $(id).hidden = road;
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
  history.replaceState(null, "", `?${next}`);
}

function choose(key) {
  const example = ALL.find((e) => e.key === key);
  // The style, the view and the background are the visitor's own choices and stay when another example opens.
  const stay = { look: state.look, view: state.view, bg: state.bg };
  Object.assign(state, defaultsFor(example), stay, { ex: key });
  draw();
}

function gallery() {
  $("gallery").innerHTML = ALL.map((e) => {
    const emblem = emblemOf(e);
    const svg = T.drawBracket(e.data, { ...e.options, ...(emblem && { emblems: renderEmblem, trophy: emblem }), look: "road", flags, size: "wide", id: `g-${e.key}`, locale: state.lang, teamName, title: titleOf(e), subtitle: e.subtitles?.[state.lang] ?? e.options.subtitle, background: bgKey(e), seeds: e.key === "nhl2024" });
    return `<li><button type="button" data-value="${e.key}" aria-label="${e.title}"><span class="shot" aria-hidden="true">${svg.replace(' role="img"', "")}</span><b>${SPORTS.find((s) => s.key === e.sport).label}: ${e.label}</b></button></li>`;
  }).join("");
}

/** The road to the final of made-up nations (a card, the wide card, a phone in the dark) and of a made-up play-off series, each with its table. */
function roadCards() {
  const rounds = T.LOCALES[state.lang].rounds;
  const series = { "first-round": rounds["First Round"] ?? "First round", "second-round": rounds["Second Round"] ?? "Second round", "conference-final": rounds["Conference Finals"] ?? "Conference final", final: rounds.Final ?? "Cup final" };
  const common = { locale: state.lang, teamName };
  const cards = [
    ["card", roadToFinalOf(roadFinalists(), { ...common, title: "Northern Cup 2030", final: ROAD_FINAL, endnote: "Made-up results", id: "road-card", background: "royal" })],
    ["wide", roadToFinalOf(roadFinalists(), { ...common, title: "Northern Cup 2030", size: "wide", id: "road-wide", background: "floodlights" })],
    ["phone", roadToFinalOf(roadFinalists(), { ...common, title: "Northern Cup 2030", final: ROAD_FINAL, size: "phone", theme: "dark", id: "road-phone", background: "aurora" })],
    ["series", roadToFinalOf(roadSeries(SERIES_EMBLEMS), { ...common, title: "Cup play-offs", labels: series, size: "square", final: { score: "4-2", note: "Game 6" }, id: "road-series", background: "carbon" })],
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

swatches();
customControls();
gallery();
roadCards();
draw();
