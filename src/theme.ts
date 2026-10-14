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
  light: { bg: "#f4efe4", ink: "#1f2320", muted: "#6b6f68", line: "#8d9087", box: "#fbf8f1", edge: "#cfc7b3", win: "#b5452c", gold: "#b58a14", plain: "#d9d3c2" },
  dark: { bg: "#141614", ink: "#ece8dc", muted: "#9aa095", line: "#6c7168", box: "#1e211d", edge: "#3b403a", win: "#e0705a", gold: "#e0b43b", plain: "#3b403a" },
  poster: { bg: "#0a1130", ink: "#f6f1e3", muted: "#a9b2d3", line: "#d9b24c", box: "#111b47", edge: "#8e7632", win: "#f0c64a", gold: "#f0c64a", plain: "#26336b" },
});

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

type Rule = readonly [selectors: readonly string[], body: string];

/** The rules for one palette, each colour read from its custom property with the palette's value as the fallback. */
function rules(p: Palette, poster: boolean, withFont: boolean): Rule[] {
  const v = (name: keyof Palette) => `var(--tb-${name}, ${p[name]})`;
  const list: Rule[] = [
    [[".tb-bg"], `fill:${v("bg")}`],
    [[".tb-line"], `stroke:${v("line")};stroke-width:${poster ? 1.6 : 1.3};fill:none;stroke-opacity:${poster ? 0.95 : 0.8}`],
    [[".tb-box"], `fill:${v("box")};stroke:${v("edge")};stroke-width:1`],
    [[".tb-final .tb-box"], `stroke:${v("win")};stroke-width:2`],
    [[".tb-name", ".tb-score", ".tb-title"], `fill:${v("ink")}`],
    [[".tb-muted", ".tb-round", ".tb-sub"], `fill:${v("muted")}`],
    [[".tb-won .tb-name", ".tb-won .tb-score"], "font-weight:700"],
    [[".tb-lost .tb-name", ".tb-lost .tb-score", ".tb-lost .tb-mark"], "opacity:.55"],
    [[".tb-ring"], `fill:none;stroke:${v("edge")};stroke-width:1`],
    [[".tb-won .tb-ring"], `stroke:${v("win")};stroke-width:2`],
    [[".tb-plain"], `fill:${v("plain")}`],
    [[".tb-initials"], `fill:${v("ink")}`],
    [[".tb-half"], `fill:${v("ink")}`],
    [[".tb-gold"], `fill:${v("gold")}`],
    [[".tb-champ .tb-ring"], `stroke:${v("gold")};stroke-width:3`],
    [[".tb-champ-label"], `fill:${v("gold")}`],
    [[".tb-halo"], `paint-order:stroke;stroke:${v("bg")};stroke-width:4px;stroke-linejoin:round`],
  ];
  if (withFont) list.push([["text"], `font-family:var(--tb-font, ${FONT})`]);
  return list;
}

const write = (scope: string, list: readonly Rule[], before = "") => list.map(([sel, body]) => `${sel.map((x) => `${before}${scope} ${x}`).join(",")}{${body}}`).join("\n");

/**
 * The `<style>` text of a drawing. `auto` is the light look and, under `prefers-color-scheme: dark` or a page that says
 * `data-theme="dark"` on `<html>`, the dark one; `light`, `dark` and `poster` are one look always. Every colour can be
 * set from the page with a `--tb-*` custom property.
 */
export function styleFor(scope: string, theme: Exclude<ThemeName, "none">): string {
  if (theme === "light") return write(scope, rules(THEMES.light, false, true));
  if (theme === "dark") return write(scope, rules(THEMES.dark, false, true));
  if (theme === "poster") return write(scope, rules(THEMES.poster, true, true));
  const dark = rules(THEMES.dark, false, false);
  return [
    write(scope, rules(THEMES.light, false, true)),
    `@media (prefers-color-scheme: dark){\n${write(scope, dark, ':root:not([data-theme="light"]) ')}\n}`,
    write(scope, dark, ':root[data-theme="dark"] '),
  ].join("\n");
}
