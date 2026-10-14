// The playground: choose a sport, an example, a language and how to draw it; the bracket, its table and the call that makes it are redrawn.
import * as T from "./dist/index.js";
import { examples, SPORTS } from "./examples.js";
import { renderEmblem } from "./emblems.js";

const ALL = examples(T);
const $ = (id) => document.getElementById(id);
const DEFAULTS = { size: "auto", theme: "auto", shape: "auto", estyle: "metal", scores: true, seeds: false, champion: true, third: true, labels: true, trophy: true };
const TOGGLES = ["scores", "seeds", "champion", "third", "labels", "trophy"];
const GROUPS = ["size", "theme", "shape", "estyle"];
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

/** The options for the drawing: the example's own, then what the controls say. */
function optionsFor(example, size) {
  const options = { ...example.options, size, locale: state.lang, teamName };
  // A title is the caller's text, so the demo gives each language its own for the World Cups, and a name that needs none (NHL 2024) for the leagues.
  const title = example.titles?.[state.lang] ?? (state.lang === "en" || !example.neutral ? options.title : example.neutral);
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
  return options;
}

const defaultsFor = (example) => ({ ...DEFAULTS, ...own(example) });

function draw() {
  const example = current();
  const size = sizeNow();
  const options = optionsFor(example, size);
  const stage = $("stage");
  stage.innerHTML = T.drawBracket(example.data, options);
  stage.dataset.size = size;
  stage.dataset.lang = state.lang;
  $("note").textContent = example.note;
  $("table").innerHTML = T.bracketTable(example.data, { roundNames: options.roundNames, locale: state.lang, teamName });
  const shown = { ...options };
  delete shown.teamName;
  const withEmblem = typeof shown.emblems === "function";
  if (withEmblem) { shown.emblems = "@@renderEmblem@@"; shown.trophy = `@@LEAGUE_EMBLEMS.${example.sport === "wc" ? "worldcup" : example.sport}@@`; }
  if (shown.roundNames) shown.roundNames = example.roundNamesCode ? `@@${example.roundNamesCode}@@` : shown.roundNames;
  const json = JSON.stringify(shown, null, 2).replace(/"@@(.*?)@@"/g, "$1");
  const withNames = json.replace(/\n}$/, ",\n  teamName: (team, locale) => team.region && countryName(team.region, locale)\n}");
  const emblemImport = withEmblem ? `import { renderEmblem } from "@johnmorrisdotca/dougu-sports/emblems";\n` : "";
  $("code").firstChild.textContent = `import { drawBracket, countryName, playoffFormat${withEmblem ? ", LEAGUE_EMBLEMS" : ""} } from "@johnmorrisdotca/taisen-brackets";\n${emblemImport}\n// ${example.key}: { teams, matchups }; each national team carries its ISO code as \`region\`\nconst svg = drawBracket(${example.key}, ${withNames});\n`;
  const sport = SPORTS.find((s) => s.key === example.sport);
  $("trophy-rows").hidden = $("trophy-chip").hidden = !emblemOf(example);
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
  Object.assign(state, defaultsFor(example), { ex: key });
  draw();
}

function gallery() {
  $("gallery").innerHTML = ALL.map((e) => {
    const emblem = emblemOf(e);
    const svg = T.drawBracket(e.data, { ...e.options, ...(emblem && { emblems: renderEmblem, trophy: emblem }), size: "wide", id: `g-${e.key}`, locale: state.lang, teamName, title: e.titles?.[state.lang] ?? (state.lang === "en" || !e.neutral ? e.options.title : e.neutral), subtitle: e.subtitles?.[state.lang] ?? e.options.subtitle });
    return `<li><button type="button" data-value="${e.key}" aria-label="${e.title}"><span class="shot" aria-hidden="true">${svg.replace(' role="img"', "")}</span><b>${SPORTS.find((s) => s.key === e.sport).label}: ${e.label}</b></button></li>`;
  }).join("");
}

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
  draw();
});
$("toggles").addEventListener("click", (event) => { const b = event.target.closest("[data-toggle]"); if (b) { state[b.dataset.toggle] = !state[b.dataset.toggle]; draw(); } });
narrow.addEventListener("change", () => { if (state.size === "auto") draw(); });
$("gallery").addEventListener("click", (event) => { const b = event.target.closest("button"); if (b) { choose(b.dataset.value); $("stage").scrollIntoView({ behavior: "smooth", block: "start" }); } });

gallery();
draw();
