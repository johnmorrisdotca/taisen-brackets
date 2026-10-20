import type { BackgroundInk } from "./family-backgrounds.ts";
import type { ThemeName } from "./types.ts";

/** The colours of one look. Each is the fallback of a CSS custom property of the same name: `--tb-ink` and so on. */
export interface Palette {
  bg: string;
  ink: string;
  muted: string;
  line: string;
  box: string;
  edge: string;
  win: string;
  gold: string;
  plain: string;
}

/** The looks. Every colour is the fallback for a custom property, so a page can restyle a drawing with `--tb-ink: …` and nothing else. */
export const THEMES: Readonly<Record<"light" | "dark" | "poster", Palette>> = Object.freeze({
  light: { bg: "#f4efe4", ink: "#1f2320", muted: "#62665f", line: "#8d9087", box: "#fbf8f1", edge: "#cfc7b3", win: "#b5452c", gold: "#845f06", plain: "#d9d3c2" },
  dark: { bg: "#141614", ink: "#ece8dc", muted: "#9aa095", line: "#6c7168", box: "#1e211d", edge: "#3b403a", win: "#e0705a", gold: "#e0b43b", plain: "#3b403a" },
  poster: { bg: "#0a1130", ink: "#f6f1e3", muted: "#a9b2d3", line: "#d9b24c", box: "#111b47", edge: "#8e7632", win: "#f0c64a", gold: "#f0c64a", plain: "#26336b" },
});

/** What the road look adds to a palette: the ring and the hairline round a mark, the pill behind a round's name, and the road's dots. Custom properties `--tb-mark-ring`, `--tb-mark-edge`, `--tb-panel` and `--tb-spine`. */
export interface RoadPalette {
  ring: string;
  edge: string;
  panel: string;
  spine: string;
}

export const ROAD_THEMES: Readonly<Record<"light" | "dark" | "poster", RoadPalette>> = Object.freeze({
  light: { ring: "#ffffff", edge: "rgba(0,0,0,.3)", panel: "#e7e3d6", spine: "#b9b39f" },
  dark: { ring: "#e9ece6", edge: "rgba(0,0,0,.6)", panel: "#252b28", spine: "#4a524d" },
  poster: { ring: "#f6f1e3", edge: "rgba(0,0,0,.5)", panel: "#1b2766", spine: "#d9b24c" },
});

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Hiragino Sans", "Yu Gothic UI", "Noto Sans CJK JP", Meiryo, sans-serif';

type Rule = readonly [selectors: readonly string[], body: string];

/** What a drawing's stylesheet needs besides the classic rules. */
export interface StyleParts {
  /** The bracket's road look: round marks with a wide ring, big bold scores, the loser quiet, pills for the round names. */
  road?: boolean;
  /** The road-to-the-final chart's rules. */
  chart?: boolean;
  /** The drawing has links: a hover and a focus ring. */
  links?: boolean;
  /** A team's path is highlighted: the other ties are quieter and the path is dotted. */
  follow?: boolean;
  /** A background with a light and a dark picture in one drawing: the one that does not fit the look is hidden. */
  bgAuto?: boolean;
  /** The rules of the layouts of their own (slots, shields, conference colours, header tiles, arrows, group cards). */
  layout?: boolean;
  /** A judo bracket: the white and blue side bars and the shido cards (`--tb-judo-white`, `--tb-judo-blue`, `--tb-shido`, `--tb-hansoku`). */
  judo?: boolean;
}

/** The colours of a judo contest: the white and the blue judogi, the yellow shido card and the red hansoku-make card. */
export const JUDO_COLORS = Object.freeze({ white: "#ffffff", blue: "#1f4fa8", shido: "#f0c000", hansoku: "#d3302a" });

/** The colours of the two halves (conferences) of the layouts that colour them, each with white letters on it: `--tb-conf-a` and `--tb-conf-b`. Both read 5 to 1 or more against white. */
export const CONFERENCE_COLORS: readonly [string, string] = Object.freeze(["#2457c5", "#b3261e"] as const);

/** The colours a background says to draw in (`backgroundSvg`'s `ink`): what `styleFor` takes in place of a look's own palette. */
export interface BackgroundInks {
  light?: BackgroundInk;
  dark?: BackgroundInk;
}

/** A palette and a road palette from a background's ink. */
function fromInk(ink: BackgroundInk): [Palette, RoadPalette] {
  return [
    { bg: ink.base, ink: ink.text, muted: ink.muted, line: ink.line, box: ink.box, edge: ink.edge, win: ink.accent, gold: ink.accent, plain: ink.plain },
    { ring: ink.ring, edge: ink.dark ? "rgba(0,0,0,.55)" : "rgba(0,0,0,.35)", panel: ink.panel, spine: ink.spine },
  ];
}

/** The rules for one palette, each colour read from its custom property with the palette's value as the fallback. */
function rules(p: Palette, r: RoadPalette, poster: boolean, withFont: boolean, parts: StyleParts, side?: "light" | "dark"): Rule[] {
  const v = (name: keyof Palette) => `var(--tb-${name}, ${p[name]})`;
  const rv = (name: keyof RoadPalette, css: string) => `var(--tb-${css}, ${r[name]})`;
  const road = parts.road === true || parts.chart === true;
  const list: Rule[] = [
    [[".tb-bg"], `fill:${v("bg")}`],
    [[".tb-line"], `stroke:${v("line")};stroke-width:${poster ? 1.6 : 1.3};fill:none;stroke-opacity:${poster ? 0.95 : 0.8}`],
    [[".tb-box"], `fill:${v("box")};stroke:${v("edge")};stroke-width:1`],
    [[".tb-final .tb-box"], `stroke:${v("win")};stroke-width:2`],
    [[".tb-name", ".tb-score", ".tb-title"], `fill:${v("ink")}`],
    [[".tb-muted", ".tb-round", ".tb-sub"], `fill:${v("muted")}`],
    [[".tb-won .tb-name", ".tb-won .tb-score"], "font-weight:700"],
    [[".tb-lost .tb-name", ".tb-lost .tb-score", ".tb-lost .tb-mark"], "opacity:.55"],
    road
      ? [[".tb-ring"], `fill:none;stroke:${rv("ring", "mark-ring")}`]
      : [[".tb-ring"], `fill:none;stroke:${v("edge")};stroke-width:1`],
    ...(road ? [] : ([[[".tb-won .tb-ring"], `stroke:${v("win")};stroke-width:2`]] as Rule[])),
    [[".tb-plain"], `fill:${v("plain")}`],
    [[".tb-initials"], `fill:${v("ink")}`],
    [[".tb-half"], `fill:${v("ink")}`],
    [[".tb-gold"], `fill:${v("gold")}`],
    [[".tb-emblem"], `color:${v("ink")}`],
    road ? [[".tb-champ .tb-ring"], `stroke:${v("gold")}`] : [[".tb-champ .tb-ring"], `stroke:${v("gold")};stroke-width:3`],
    [[".tb-champ-label"], `fill:${v("gold")}`],
    [[".tb-halo"], `paint-order:stroke;stroke:${v("bg")};stroke-width:4px;stroke-linejoin:round`],
  ];
  if (road) {
    list.push(
      [[".tb-edge"], `fill:none;stroke:${rv("edge", "mark-edge")}`],
      [[".tb-lost .tb-ring-r", ".tb-lost .tb-edge"], "opacity:.55"],
      [[".tb-panel"], `fill:${rv("panel", "panel")}`],
      [[".tb-lab"], `fill:${v("ink")};font-weight:700`],
      [[".tb-spine"], `stroke:${rv("spine", "spine")};fill:none;stroke-linecap:round`],
      [[".tb-tagbox"], `fill:${rv("panel", "panel")}`],
      [[".tb-tag"], `fill:${v("ink")};font-weight:700`],
      [[".tb-code", ".tb-vs"], `fill:${v("muted")};font-weight:700`],
    );
  }
  if (parts.road === true) {
    list.push(
      [[".tb-name"], "font-weight:700"],
      [[".tb-score"], "font-weight:800"],
      [[".tb-lost .tb-score"], `fill:${v("muted")};opacity:1`],
      [[".tb-line"], `stroke-linecap:round;stroke-linejoin:round;stroke-width:${poster ? 2 : 1.8};stroke-opacity:.55`],
    );
  }
  if (parts.chart === true) {
    list.push(
      [[".tb-r-t"], `fill:${v("ink")};font-weight:800`],
      [[".tb-r-s", ".tb-r-e", ".tb-r-sub", ".tb-r-code", ".tb-r-vs", ".tb-r-dash"], `fill:${v("muted")};font-weight:700`],
      [[".tb-r-name", ".tb-r-n"], `fill:${v("ink")};font-weight:800`],
      [[".tb-r-n.tb-r-low"], `fill:${v("muted")}`],
      [[".tb-r-dim"], "opacity:.5"],
      [["text"], "font-variant-numeric:tabular-nums"],
    );
  }
  if (parts.layout === true) {
    const [ca, cb] = CONFERENCE_COLORS;
    list.push(
      [[".tb-slot"], `fill:${v("plain")};fill-opacity:.55;stroke:${v("edge")};stroke-width:1`],
      [[".tb-won .tb-slot"], `fill-opacity:.9;stroke:${v("win")};stroke-width:1.6`],
      [[".tb-lost .tb-slot"], "fill-opacity:.35"],
      [[".tb-emptybar"], `fill:${v("plain")};opacity:.8`],
      [[".tb-seed"], "font-variant-numeric:tabular-nums"],
      [[".tb-seedn"], `fill:${v("muted")};opacity:.85`],
      [[".tb-shield"], `fill:none;stroke:${v("edge")};stroke-width:1.4`],
      [[".tb-won .tb-shield"], `stroke:${v("win")};stroke-width:2.2`],
      [[".tb-shield.tb-empty"], `fill:${v("plain")};fill-opacity:.5`],
      [[".tb-vs", ".tb-code"], `fill:${v("muted")};font-weight:700`],
      [[".tb-c0 .tb-box"], `stroke:var(--tb-conf-a, ${ca});stroke-width:1.6`],
      [[".tb-c1 .tb-box"], `stroke:var(--tb-conf-b, ${cb});stroke-width:1.6`],
      [[".tb-atag"], `fill:${v("ink")}`],
      [[".tb-atag-t"], `fill:${v("bg")}`],
      [[".tb-c0 .tb-atag"], `fill:var(--tb-conf-a, ${ca})`],
      [[".tb-c1 .tb-atag"], `fill:var(--tb-conf-b, ${cb})`],
      [[".tb-c0 .tb-atag-t", ".tb-c1 .tb-atag-t"], "fill:#fff"],
      [[".tb-head"], `fill:${rv("panel", "panel")}`],
      [[".tb-head.tb-c0"], `fill:var(--tb-conf-a, ${ca})`],
      [[".tb-head.tb-c1"], `fill:var(--tb-conf-b, ${cb})`],
      [[".tb-head-t"], `fill:${v("ink")};font-weight:800`],
      [[".tb-head.tb-c0 + .tb-head-t", ".tb-head.tb-c1 + .tb-head-t"], "fill:#fff"],
      [[".tb-arrow"], `stroke:${v("line")};stroke-width:1.6;fill:none;stroke-linecap:round;stroke-linejoin:round`],
      [[".tb-arrow-loser"], "stroke-dasharray:5 4"],
      [[".tb-arrowhead"], `fill:${v("line")};stroke:none`],
      [[".tb-gcard"], `fill:${v("box")};stroke:${v("edge")};stroke-width:1`],
      [[".tb-gtile"], `fill:var(--tb-conf-a, ${ca})`],
      [[".tb-gtile-t"], "fill:#fff;font-weight:800"],
      [[".tb-ghead"], `fill:${v("muted")};font-weight:700`],
      [[".tb-gcell"], `fill:${v("ink")};font-variant-numeric:tabular-nums`],
      [[".tb-gcell-p"], "font-weight:800"],
      [[".tb-gname"], `fill:${v("ink")};font-weight:700`],
      [[".tb-qual"], `fill:${v("win")};fill-opacity:.16`],
      [[".tb-gsep"], `stroke:${v("edge")};stroke-width:1;stroke-opacity:.6`],
    );
  }
  if (parts.judo === true) {
    list.push(
      [[".tb-jw"], `fill:var(--tb-judo-white, ${JUDO_COLORS.white});stroke:${v("edge")};stroke-width:.8`],
      [[".tb-jb"], `fill:var(--tb-judo-blue, ${JUDO_COLORS.blue});stroke:${v("edge")};stroke-width:.8`],
      [[".tb-sh-y"], `fill:var(--tb-shido, ${JUDO_COLORS.shido});stroke:rgba(0,0,0,.35);stroke-width:.6`],
      [[".tb-sh-r"], `fill:var(--tb-hansoku, ${JUDO_COLORS.hansoku});stroke:rgba(0,0,0,.35);stroke-width:.6`],
    );
  }
  if (parts.follow === true) {
    list.push(
      [[".tb-tie"], "opacity:.4"],
      [[".tb-tie.tb-on-path"], "opacity:1"],
      [[".tb-on-path .tb-box"], `stroke:${v("win")};stroke-width:2.2`],
      [[".tb-line"], "stroke-opacity:.25"],
      [[".tb-line.tb-path"], `stroke:${v("win")};stroke-width:4.5;stroke-opacity:1;stroke-linecap:round;stroke-dasharray:.1 9`],
    );
  }
  if (parts.links === true) {
    list.push(
      [[".tb-link"], "cursor:pointer;outline:none"],
      [[".tb-link:hover .tb-box", ".tb-link:focus-visible .tb-box"], `stroke:${v("win")};stroke-width:2.5`],
      [[".tb-link:hover .tb-name", ".tb-link:focus-visible .tb-name"], "text-decoration:underline"],
      [[".tb-link:focus-visible"], `outline:2px solid ${v("win")};outline-offset:2px`],
    );
  }
  if (parts.bgAuto === true) list.push(side === "dark" ? [[".tb-bgl"], "display:none"] : [[".tb-bgd"], "display:none"]);
  if (parts.bgAuto === true && side === "dark") list.push([[".tb-bgd"], "display:inline"]);
  if (withFont) list.push([["text"], `font-family:var(--tb-font, ${FONT})`]);
  return list;
}

const write = (scope: string, list: readonly Rule[], before = "") => list.map(([sel, body]) => `${sel.map((x) => `${before}${scope} ${x}`).join(",")}{${body}}`).join("\n");

/**
 * The `<style>` text of a drawing. `auto` is the light look and, under `prefers-color-scheme: dark` or a page that says
 * `data-theme="dark"` on `<html>`, the dark one; `light`, `dark` and `poster` are one look always. Every colour can be
 * set from the page with a `--tb-*` custom property. `parts` adds the rules the road look, the road chart, links and a highlighted path need.
 */
export function styleFor(scope: string, theme: Exclude<ThemeName, "none">, parts: StyleParts = {}, inks: BackgroundInks = {}): string {
  // A look takes the ink of the picture drawn for it; a picture asked for in the other variant (`background.theme`) gives its ink to both.
  const only = inks.light ?? inks.dark;
  const [lp, lr] = (inks.light ?? only) ? fromInk((inks.light ?? only)!) : [THEMES.light, ROAD_THEMES.light];
  const [dp, dr] = (inks.dark ?? only) ? fromInk((inks.dark ?? only)!) : [THEMES.dark, ROAD_THEMES.dark];
  if (theme === "light") return write(scope, rules(lp, lr, false, true, parts, "light"));
  if (theme === "dark") return write(scope, rules(dp, dr, false, true, parts, "dark"));
  if (theme === "poster") return write(scope, only ? rules(dp, dr, true, true, parts, "dark") : rules(THEMES.poster, ROAD_THEMES.poster, true, true, parts, "dark"));
  const dark = rules(dp, dr, false, false, parts, "dark");
  return [
    write(scope, rules(lp, lr, false, true, parts, "light")),
    `@media (prefers-color-scheme: dark){\n${write(scope, dark, ':root:not([data-theme="light"]) ')}\n}`,
    write(scope, dark, ':root[data-theme="dark"] '),
  ].join("\n");
}
