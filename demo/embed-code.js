// The builder's choices and the code each way a page is made writes for them. Pure and free of imports, so the builder page loads it as it is and a test can run the code it writes against the package. The builder (builder.html) fills the family's embed panel from here.
export const PACKAGE = "@johnmorrisdotca/taisen-brackets";
export const SITE = "https://johnmorrisdotca.github.io/taisen-brackets/";

/** The builder's rows of choices: the number of teams and the options of `drawBracket`. */
export const CHOICES = {
  teams: { label: "Teams", values: ["4", "8", "16"], default: "8" },
  size: { label: "Size", values: ["wide", "square", "card", "phone"], default: "wide" },
  look: { label: "Look", values: ["classic", "road"], default: "road" },
  theme: { label: "Theme", values: ["auto", "light", "dark", "poster"], default: "light" },
  layout: { label: "Layout", values: ["tree", "rows", "shields", "update", "columns"], default: "tree" },
  background: { label: "Background", values: ["none", "midnight", "ice", "hardwood", "pitch", "turf"], default: "none" },
};

/** The options of `drawBracket` for the choices made. */
export function drawOptions(state) {
  const out = { size: state.size, look: state.look, theme: state.theme, layout: state.layout };
  if (state.background !== "none") out.background = state.background;
  if (state.look === "road") out.seeds = true;
  return out;
}

/** A tournament played out by a fixed rule: the result of a tie follows the last character of its id, so the page and the code agree. `T` is the package. */
export function tournament(T, count) {
  const teams = Array.from({ length: count }, (_, i) => ({ id: `T${i + 1}`, name: `Team ${i + 1}` }));
  const results = {};
  const withResults = (list) => list.map((m) => (results[m.id] ? { ...m, score: results[m.id] } : m));
  let matchups = T.singleElimination(teams).matchups;
  for (let round = 0; round < 6; round += 1) {
    matchups = T.advanceWinners(withResults(matchups));
    for (const m of matchups) if (typeof m.sides[0] === "string" && typeof m.sides[1] === "string" && !results[m.id]) results[m.id] = m.id.charCodeAt(m.id.length - 1) % 2 ? [2, 1] : [0, 1];
  }
  return { teams, results, matchups: T.advanceWinners(withResults(matchups)) };
}

const ties = "// `ties` is your list of games: [{ sides: [\"A\", \"B\"], score: [2, 1] }, ...]";

/**
 * The code for one of the ways a page is made. `call` is a whole working call (the package's own functions and a tournament played out); the others draw `ties`, your list of games.
 *
 * @param {string} kind `module`, `html`, `react`, `vue`, `angular` or `svelte`.
 * @param {{ teams: { name: string }[]; results: Record<string, number[]> }} played The tournament the call plays out.
 * @param {Record<string, unknown>} options The options of `drawBracket`.
 * @returns {string | undefined}
 */
export function embedCode(kind, played, options) {
  const json = JSON.stringify(options);
  switch (kind) {
    case "module":
      return `import { advanceWinners, drawBracket, singleElimination } from "${PACKAGE}";

const teams = ${JSON.stringify(played.teams.map((team) => team.name))}.map((name, i) => ({ id: \`T\${i + 1}\`, name }));
// The scores of the ties, by id; later ties fill in from the winners.
const results = ${JSON.stringify(played.results)};
const withResults = (list) => list.map((m) => (results[m.id] ? { ...m, score: results[m.id] } : m));

let matchups = singleElimination(teams).matchups;
for (let round = 0; round < 6; round += 1) matchups = advanceWinners(withResults(matchups));

const svg = drawBracket({ teams, matchups: withResults(matchups) }, ${JSON.stringify(options, null, 2)});
document.querySelector("#bracket").innerHTML = svg;`;
    case "html":
      return `<div id="bracket"></div>
<script type="module">
  import { drawBracket } from "https://cdn.jsdelivr.net/npm/${PACKAGE}@0/+esm";
  ${ties}
  document.querySelector("#bracket").innerHTML = drawBracket(ties, ${json});
</script>`;
    case "react":
      return `import { drawBracket } from "${PACKAGE}";

${ties}
export function Bracket({ ties }) {
  return <div dangerouslySetInnerHTML={{ __html: drawBracket(ties, ${json}) }} />;
}`;
    case "vue":
      return `<script setup>
import { computed } from "vue";
import { drawBracket } from "${PACKAGE}";

${ties}
const props = defineProps({ ties: { type: Array, required: true } });
const svg = computed(() => drawBracket(props.ties, ${json}));
</script>

<template>
  <div v-html="svg"></div>
</template>`;
    case "angular":
      return `import { Component, Input, inject } from "@angular/core";
import { DomSanitizer, type SafeHtml } from "@angular/platform-browser";
import { drawBracket, type Matchup } from "${PACKAGE}";

@Component({
  selector: "app-bracket",
  standalone: true,
  template: \`<div [innerHTML]="svg"></div>\`,
})
export class BracketComponent {
  private readonly sanitizer = inject(DomSanitizer);
  svg: SafeHtml = "";

  ${ties}
  @Input() set ties(ties: Matchup[]) {
    this.svg = this.sanitizer.bypassSecurityTrustHtml(drawBracket(ties, ${json}));
  }
}`;
    case "svelte":
      return `<script>
  import { drawBracket } from "${PACKAGE}";

  ${ties}
  let { ties } = $props();
</script>

{@html drawBracket(ties, ${json})}`;
    default:
      return undefined;
  }
}

/** The address of the embed page for the choices it reads (`look`, `theme` and `size`; it draws a sample knockout). */
export function frameQuery(state) {
  return new URLSearchParams({ look: state.look, theme: state.theme, size: state.size }).toString();
}

/** The `iframe` way. `width` and `height` are the drawn bracket's own, from its `viewBox`; `preview` writes the address as the page sees it. */
export function frameCode(state, width, height, preview) {
  const src = `${preview ? "" : SITE}embed.html?${frameQuery(state)}`.replaceAll("&", "&amp;");
  return `<iframe\n  src="${src}"\n  title="A knockout bracket"\n  width="${width}"\n  height="${height}"\n  loading="lazy"\n  style="border: 0"\n></iframe>`;
}
