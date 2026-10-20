// The medal table section of the demo: made-up medals (demo/data/medal-sample.js) added up by `tallyMedals` with the filter chosen, and drawn by `medalTable`. The state (sport, weight class,
// Games, sort, how many rows, size and look) is in the address, under keys that start with `m`, and nowhere else.
import { MEDAL_AWARDS, MEDAL_CATEGORIES, MEDAL_GAMES, MEDAL_SPORTS } from "./data/medal-sample.js";

const DEFAULTS = { sport: "all", cat: "all", games: "all", sort: "gold", top: "all", size: "tv", theme: "auto" };
const KEYS = Object.keys(DEFAULTS);
const PATTERN = new RegExp(`^m(${KEYS.join("|")})$`);

export function initMedals({ T, flags, lang, params, $ }) {
  const state = { ...DEFAULTS };
  const ok = {
    sport: (v) => v === "all" || MEDAL_SPORTS.includes(v), cat: (v) => v === "all" || Object.values(MEDAL_CATEGORIES).flat().includes(v), games: (v) => v === "all" || MEDAL_GAMES.includes(Number(v)),
    sort: (v) => ["gold", "total"].includes(v), top: (v) => ["all", "10", "5"].includes(v), size: (v) => Object.keys(T.BOARD_SIZES).includes(v), theme: (v) => ["auto", "light", "dark"].includes(v),
  };
  for (const key of KEYS) { const v = params.get(`m${key}`); if (v !== null && ok[key](v)) state[key] = v; }
  const address = () => KEYS.filter((k) => state[k] !== DEFAULTS[k]).map((k) => [`m${k}`, state[k]]);
  const filter = () => ({ ...(state.sport !== "all" ? { sport: state.sport } : {}), ...(state.cat !== "all" ? { category: state.cat } : {}), ...(state.games !== "all" ? { games: Number(state.games) } : {}) });
  const subtitle = () => [state.sport === "all" ? "Judo and wrestling" : state.sport[0].toUpperCase() + state.sport.slice(1), state.cat === "all" ? null : state.cat, state.games === "all" ? "all Games" : `Games of ${state.games}`].filter(Boolean).join(" · ");
  const options = () => ({ size: state.size, theme: state.theme, sort: state.sort, ...(state.top === "all" ? {} : { top: Number(state.top) }), locale: lang(), flags });

  let drawnIn = null;
  function draw() {
    drawnIn = lang();
    // A weight class belongs to one sport: a choice that does not fit the sport goes back to all.
    if (state.cat !== "all" && state.sport !== "all" && !MEDAL_CATEGORIES[state.sport].includes(state.cat)) state.cat = "all";
    const rows = T.tallyMedals(MEDAL_AWARDS, filter());
    const source = { subtitle: subtitle(), source: "Sample data, invented for the demo", rows };
    $("medal-stage").innerHTML = T.medalTable(source, options());
    $("medal-stage").dataset.size = state.size;
    for (const b of $("medal-controls").querySelectorAll("[data-mkey]")) b.setAttribute("aria-pressed", String(state[b.dataset.mkey] === b.dataset.value));
    for (const b of $("medal-controls").querySelectorAll("[data-cat-of]")) b.hidden = state.sport !== "all" && b.dataset.catOf !== state.sport;
    const next = new URLSearchParams(location.search);
    for (const key of [...next.keys()]) if (PATTERN.test(key)) next.delete(key);
    for (const [key, value] of address()) next.set(key, value);
    history.replaceState(null, "", `?${next}${location.hash}`);
    const f = JSON.stringify(filter());
    $("medal-code").firstChild.textContent = `import { medalTable, tallyMedals } from "@johnmorrisdotca/taisen-brackets";\n\n// awards: [{ name: "France", flag: "FR", medal: "gold", sport: "judo", category: "+100 kg", games: 2024 }, ...] (${MEDAL_AWARDS.length} medals here)\n// Hata's flags, loaded once: const loadedFlags = { FR: await flag("FR", { shape: "round" }), ... }\nconst rows = tallyMedals(awards, ${f});\nconst svg = medalTable({ subtitle: ${JSON.stringify(subtitle())}, rows }, ${JSON.stringify({ ...options(), flags: "@@(code) => loadedFlags[code]@@" }, null, 2).replace(/"@@(.*?)@@"/g, "$1")});\n`;
  }

  const seg = (label, key, values, extra = "") => `<div class="fam-row"${extra}><span class="fam-label">${label}</span><div class="fam-seg" role="group" aria-label="${label}">${values.map(([v, t, o = ""]) => `<button type="button" data-mkey="${key}" data-value="${v}"${o} aria-pressed="${state[key] === v}">${t}</button>`).join("")}</div></div>`;
  const cap = (t) => t[0].toUpperCase() + t.slice(1);
  $("medal-controls").innerHTML = [
    seg("Sport", "sport", [["all", "Both"], ...MEDAL_SPORTS.map((s) => [s, cap(s)])]),
    seg("Weight class", "cat", [["all", "All"], ...MEDAL_SPORTS.flatMap((s) => MEDAL_CATEGORIES[s].map((c) => [c, `${cap(s)} ${c}`, ` data-cat-of="${s}"`]))]),
    seg("Games", "games", [["all", "All time"], ...MEDAL_GAMES.map((g) => [String(g), String(g)])]),
    seg("Rank by", "sort", [["gold", "Gold first"], ["total", "Total medals"]]),
    seg("Rows", "top", [["all", "All that fit"], ["10", "Top 10"], ["5", "Top 5"]]),
    seg("Size", "size", [["tv", "TV"], ["tablet", "Tablet"], ["tablet-tall", "Tablet, upright"], ["phone", "Phone"], ["square", "Square card"], ["portrait", "4:5 card"]]),
    seg("Look", "theme", [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]]),
  ].join("");
  $("medal-controls").addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (!b?.dataset.mkey) return;
    state[b.dataset.mkey] = b.dataset.value;
    draw();
  });
  /** Draws again only if the language changed since the last drawing: the other controls of the page do not touch this section. */
  const refresh = () => { if (drawnIn !== lang()) draw(); };
  return { draw, refresh, address };
}
