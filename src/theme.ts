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
}

/** The rules for one palette, each colour read from its custom property with the palette's value as the fallback. */
function rules(p: Palette, r: RoadPalette, poster: boolean, withFont: boolean, parts: StyleParts): Rule[] {
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
  if (withFont) list.push([["text"], `font-family:var(--tb-font, ${FONT})`]);
  return list;
}

const write = (scope: string, list: readonly Rule[], before = "") => list.map(([sel, body]) => `${sel.map((x) => `${before}${scope} ${x}`).join(",")}{${body}}`).join("\n");

/**
 * The `<style>` text of a drawing. `auto` is the light look and, under `prefers-color-scheme: dark` or a page that says
 * `data-theme="dark"` on `<html>`, the dark one; `light`, `dark` and `poster` are one look always. Every colour can be
 * set from the page with a `--tb-*` custom property. `parts` adds the rules the road look, the road chart, links and a highlighted path need.
 */
export function styleFor(scope: string, theme: Exclude<ThemeName, "none">, parts: StyleParts = {}): string {
  if (theme === "light") return write(scope, rules(THEMES.light, ROAD_THEMES.light, false, true, parts));
  if (theme === "dark") return write(scope, rules(THEMES.dark, ROAD_THEMES.dark, false, true, parts));
  if (theme === "poster") return write(scope, rules(THEMES.poster, ROAD_THEMES.poster, true, true, parts));
  const dark = rules(THEMES.dark, ROAD_THEMES.dark, false, false, parts);
  return [
    write(scope, rules(THEMES.light, ROAD_THEMES.light, false, true, parts)),
    `@media (prefers-color-scheme: dark){\n${write(scope, dark, ':root:not([data-theme="light"]) ')}\n}`,
    write(scope, dark, ':root[data-theme="dark"] '),
  ].join("\n");
}
