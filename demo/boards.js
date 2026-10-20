// The broadcast boards section of the demo: made-up results (demo/data/results-sample.js) drawn by `resultsBoard`, in the manner of a television graphic. The state (which example, look, rank style,
// icon, width and capitals) is in the address, under keys that start with `g`, and nowhere else.
import { RESULTS_SAMPLE } from "./data/results-sample.js";
import { FLAGS, FLAGS_RECT } from "./flags-data.js";

const DEFAULTS = { ex: "apparatus", look: "blue", rank: "box", icon: "medal", width: "1280", caps: "0" };
const KEYS = Object.keys(DEFAULTS);
const PATTERN = new RegExp(`^g(${KEYS.join("|")})$`);
const EXAMPLES = [["apparatus", "Gymnastics apparatus final"], ["allAround", "All-around"], ["swimming", "Swimming final, record badge"], ["athletics", "Athletics 100 m"], ["skating", "Speed skating"]];
const ONE_OF = { ex: EXAMPLES.map(([k]) => k), look: ["blue", "night", "paper"], rank: ["box", "medal", "plain"], icon: ["medal", "stopwatch", "none"], width: ["1280", "960", "720"], caps: ["0", "1"] };
/** The flags the boards draw: 4:3 where a board asks for `rect`, round otherwise (Hata's, made once by `pnpm flags`). */
const flags = (code, request) => (request.shape === "rect" ? FLAGS_RECT[code] : FLAGS[code]);
// A plain rank is a white numeral and wants no box; the example that is drawn that way opens with it.
const OWN_RANK = { allAround: "plain" };

export function initBoards({ T, lang, params, $ }) {
  const state = { ...DEFAULTS };
  for (const key of KEYS) { const v = params.get(`g${key}`); if (v !== null && ONE_OF[key].includes(v)) state[key] = v; }
  if (params.get("gex") && !params.get("grank") && OWN_RANK[state.ex]) state.rank = OWN_RANK[state.ex];
  const address = () => KEYS.filter((k) => state[k] !== DEFAULTS[k]).map((k) => [`g${k}`, state[k]]);
  const options = () => ({ width: Number(state.width), look: state.look, rankStyle: state.rank, icon: state.icon, ...(state.caps === "1" ? { nameCase: "upper" } : {}), locale: lang(), flags });

  function draw() {
    drawnIn = lang();
    const source = RESULTS_SAMPLE[state.ex];
    const o = options();
    $("boards-stage").innerHTML = T.resultsBoard(source, o);
    for (const b of $("boards-controls").querySelectorAll("[data-gkey]")) b.setAttribute("aria-pressed", String(state[b.dataset.gkey] === b.dataset.value));
    const size = T.resultsBoardSize(source.rows.length, { width: o.width });
    $("boards-size").textContent = `${size.width} by ${size.height}`;
    const next = new URLSearchParams(location.search);
    for (const key of [...next.keys()]) if (PATTERN.test(key)) next.delete(key);
    for (const [key, value] of address()) next.set(key, value);
    history.replaceState(null, "", `?${next}${location.hash}`);
    $("boards-code").firstChild.textContent = `import { resultsBoard, resultsBoardSize } from "@johnmorrisdotca/taisen-brackets";\n\n// Hata's flags, loaded once, asked for as 4:3: const loadedFlags = { US: await flag("US", { shape: "4:3" }), ... }\nconst source = ${JSON.stringify({ ...source, rows: `@@${source.rows.length} rows: { rank, code, flag, name, values, record }@@` }, null, 2).replace(/"@@(.*?)@@"/g, "[/* $1 */]")};\nconst svg = resultsBoard(source, ${JSON.stringify({ ...o, flags: "@@(code) => loadedFlags[code]@@" }, null, 2).replace(/"@@(.*?)@@"/g, "$1")});\nconst { width, height } = resultsBoardSize(${source.rows.length}, { width: ${o.width} }); // ${size.width} by ${size.height}\n`;
  }
  let drawnIn = null;
  const refresh = () => { if (drawnIn !== lang()) draw(); };

  const seg = (label, key, values) => `<div class="fam-row"><span class="fam-label">${label}</span><div class="fam-seg" role="group" aria-label="${label}">${values.map(([v, t]) => `<button type="button" data-gkey="${key}" data-value="${v}" aria-pressed="${state[key] === v}">${t}</button>`).join("")}</div></div>`;
  $("boards-controls").innerHTML = [
    seg("Example", "ex", EXAMPLES),
    seg("Look", "look", [["blue", "Blue"], ["night", "Night"], ["paper", "Paper"]]),
    seg("Rank", "rank", [["box", "Red box"], ["medal", "Medal boxes"], ["plain", "Plain"]]),
    seg("Icon", "icon", [["medal", "Medal"], ["stopwatch", "Stopwatch"], ["none", "None"]]),
    seg("Width", "width", [["1280", "1280"], ["960", "960"], ["720", "720"]]),
    seg("Names", "caps", [["0", "As given"], ["1", "Capitals"]]),
  ].join("");
  $("boards-controls").addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (!b?.dataset.gkey) return;
    state[b.dataset.gkey] = b.dataset.value;
    // An example that is drawn with plain ranks (the all-around) takes them with it; leaving it, the box comes back unless one was chosen.
    if (b.dataset.gkey === "ex") state.rank = OWN_RANK[b.dataset.value] ?? (state.rank === "plain" ? "box" : state.rank);
    draw();
  });
  return { draw, refresh, address };
}
