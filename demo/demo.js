// The playground: choose an example and how to draw it; the bracket, its table and the call that makes it are redrawn.
import * as T from "./dist/index.js";
import { examples } from "./examples.js";

const ALL = examples(T);
const $ = (id) => document.getElementById(id);
const DEFAULTS = { size: "auto", theme: "auto", shape: "auto", scores: true, seeds: false, champion: true, third: true, labels: true };

const params = new URLSearchParams(location.search);
const first = ALL.find((e) => e.key === params.get("ex")) ?? ALL[0];
const own = (example) => ({ theme: example.theme ?? "auto", labels: example.options.roundLabels !== false });
const state = { ex: first.key, ...DEFAULTS, ...own(first) };
for (const key of ["size", "theme", "shape"]) if (params.has(key)) state[key] = params.get(key);
for (const key of ["scores", "seeds", "champion", "third", "labels"]) if (params.has(key)) state[key] = params.get(key) === "1";

const narrow = matchMedia("(max-width: 640px)");
const current = () => ALL.find((e) => e.key === state.ex);
const sizeNow = () => (state.size === "auto" ? (narrow.matches ? "phone" : "wide") : state.size);

/** The options for the drawing: the example's own, then what the controls say. */
function optionsFor(example, size) {
  const options = { ...example.options, size };
  if (state.theme !== "auto" || !example.theme) options.theme = state.theme;
  if (state.shape !== "auto") options.shape = state.shape;
  options.scores = state.scores;
  options.seeds = state.seeds;
  options.champion = state.champion;
  options.thirdPlace = state.third ? "below" : "hide";
  options.roundLabels = state.labels;
  return options;
}

function draw() {
  const example = current();
  const size = sizeNow();
  const options = optionsFor(example, size);
  $("stage").innerHTML = T.drawBracket(example.data, options);
  $("stage").dataset.size = size;
  $("note").textContent = example.note;
  $("table").innerHTML = T.bracketTable(example.data, { roundNames: options.roundNames });
  const shown = { ...options };
  if (shown.roundNames) shown.roundNames = example.roundNamesCode ? `@@${example.roundNamesCode}@@` : shown.roundNames;
  const json = JSON.stringify(shown, null, 2).replace(/"@@(.*)@@"/, "$1");
  $("code").firstChild.textContent = `import { drawBracket, playoffFormat } from "@johnmorrisdotca/taisen-brackets";\n\n// ${example.key}: { teams, matchups }\nconst svg = drawBracket(${example.key}, ${json});\n`;
  for (const group of ["size", "theme", "shape"]) for (const b of $(group).querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.value === state[group]));
  for (const b of document.querySelectorAll("[data-toggle]")) b.setAttribute("aria-pressed", String(state[b.dataset.toggle]));
  for (const b of $("example").querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.value === state.ex));
  for (const b of $("gallery").querySelectorAll("button")) b.setAttribute("aria-current", String(b.dataset.value === state.ex));
  const next = new URLSearchParams();
  next.set("ex", state.ex);
  for (const key of ["size", "theme", "shape"]) if (state[key] !== { ...DEFAULTS, ...own(example) }[key]) next.set(key, state[key]);
  for (const key of ["scores", "seeds", "champion", "third", "labels"]) if (state[key] !== { ...DEFAULTS, ...own(example) }[key]) next.set(key, state[key] ? "1" : "0");
  history.replaceState(null, "", `?${next}`);
}

function choose(key) {
  const example = ALL.find((e) => e.key === key);
  Object.assign(state, DEFAULTS, own(example), { ex: key });
  draw();
}

$("example").innerHTML = ALL.map((e) => `<button type="button" data-value="${e.key}">${e.label}</button>`).join("");
$("example").addEventListener("click", (event) => { const b = event.target.closest("button"); if (b) choose(b.dataset.value); });
for (const group of ["size", "theme", "shape"]) {
  $(group).addEventListener("click", (event) => { const b = event.target.closest("button"); if (b) { state[group] = b.dataset.value; draw(); } });
}
$("toggles").addEventListener("click", (event) => { const b = event.target.closest("[data-toggle]"); if (b) { state[b.dataset.toggle] = !state[b.dataset.toggle]; draw(); } });
narrow.addEventListener("change", () => { if (state.size === "auto") draw(); });

$("gallery").innerHTML = ALL.map((e) => {
  const svg = T.drawBracket(e.data, { ...e.options, size: "wide", id: `g-${e.key}` });
  return `<li><button type="button" data-value="${e.key}" aria-label="Open ${e.title}"><span class="shot" aria-hidden="true">${svg.replace(' role="img"', "")}</span><b>${e.label}</b></button></li>`;
}).join("");
$("gallery").addEventListener("click", (event) => { const b = event.target.closest("button"); if (b) { choose(b.dataset.value); $("stage").scrollIntoView({ behavior: "smooth", block: "start" }); } });

draw();
