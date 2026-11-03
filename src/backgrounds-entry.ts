import * as shared from "./family-backgrounds.ts";

// The family shares family-backgrounds.ts byte for byte (its hash is pinned in test/family-backgrounds.test.ts), so the documentation of what this entry exports is written here, over the shared declarations.

/**
 * The version of the backgrounds the family shares; a change to any picture changes it.
 *
 * @example
 * ```ts
 * import { FAMILY_BACKGROUNDS_VERSION } from "@johnmorrisdotca/taisen-brackets/backgrounds";
 *
 * console.log(FAMILY_BACKGROUNDS_VERSION);
 * ```
 */
export const FAMILY_BACKGROUNDS_VERSION = shared.FAMILY_BACKGROUNDS_VERSION;

/**
 * The names of the twenty-five poster backgrounds.
 *
 * @example
 * ```ts
 * import { BACKGROUND_PRESETS } from "@johnmorrisdotca/taisen-brackets/backgrounds";
 *
 * console.log(BACKGROUND_PRESETS.length, BACKGROUND_PRESETS[0]);
 * ```
 */
export const BACKGROUND_PRESETS = shared.BACKGROUND_PRESETS;

/**
 * The name of one of the poster backgrounds.
 *
 * @example
 * ```ts
 * import { backgroundSvg, type BackgroundPresetName } from "@johnmorrisdotca/taisen-brackets/backgrounds";
 *
 * const preset: BackgroundPresetName = "midnight";
 * console.log(backgroundSvg(preset, { width: 400, height: 300 }).body.length > 0);
 * ```
 */
export type BackgroundPresetName = shared.BackgroundPresetName;

/**
 * What a background is drawn for: its width and height, the theme, colours, angle, intensity and seed.
 *
 * @example
 * ```ts
 * import { backgroundSvg, type BackgroundSvgOptions } from "@johnmorrisdotca/taisen-brackets/backgrounds";
 *
 * const options: BackgroundSvgOptions = { width: 1200, height: 675, theme: "dark", seed: 3 };
 * console.log(backgroundSvg("aurora", options).ink.dark);
 * ```
 */
export type BackgroundSvgOptions = shared.BackgroundSvgOptions;

/**
 * The colours that read well over a background: text, lines, boxes, edges and its dominant colours.
 *
 * @example
 * ```ts
 * import { backgroundSvg, type BackgroundInk } from "@johnmorrisdotca/taisen-brackets/backgrounds";
 *
 * const ink: BackgroundInk = backgroundSvg("ice", { width: 400, height: 300, theme: "light" }).ink;
 * console.log(ink.dark, ink.text);
 * ```
 */
export type BackgroundInk = shared.BackgroundInk;

/**
 * A drawn background: the `defs` and the `body` to put in an SVG, and the ink that reads over it.
 *
 * @example
 * ```ts
 * import { backgroundSvg, type BackgroundSvg } from "@johnmorrisdotca/taisen-brackets/backgrounds";
 *
 * const picture: BackgroundSvg = backgroundSvg("pitch", { width: 400, height: 300 });
 * console.log(typeof picture.defs, picture.body.startsWith("<"));
 * ```
 */
export type BackgroundSvg = shared.BackgroundSvg;

/**
 * Reads a colour written as `#rgb`, `#rrggbb` or `rgb(…)`.
 *
 * @param text - The colour as text.
 * @returns The red, green and blue, 0 to 255; `null` when the text is not a colour.
 * @example
 * ```ts
 * import { parseColor } from "@johnmorrisdotca/taisen-brackets/backgrounds";
 *
 * console.log(parseColor("#2f5d4a"), parseColor("not a colour"));
 * ```
 */
export function parseColor(text: string): ReturnType<typeof shared.parseColor> {
  return shared.parseColor(text);
}

/**
 * Writes a colour as `#rrggbb`.
 *
 * @param c - The red, green and blue, 0 to 255.
 * @returns The colour in lower-case hexadecimal.
 * @example
 * ```ts
 * import { toHex } from "@johnmorrisdotca/taisen-brackets/backgrounds";
 *
 * console.log(toHex([47, 93, 74]));
 * ```
 */
export function toHex(c: Parameters<typeof shared.toHex>[0]): string {
  return shared.toHex(c);
}

/**
 * How light a colour is, from 0 (black) to 1 (white), as the WCAG contrast rules measure it.
 *
 * @param c - The red, green and blue, 0 to 255.
 * @returns The relative luminance.
 * @example
 * ```ts
 * import { luminance } from "@johnmorrisdotca/taisen-brackets/backgrounds";
 *
 * console.log(luminance([255, 255, 255]), luminance([0, 0, 0]));
 * ```
 */
export function luminance(c: Parameters<typeof shared.luminance>[0]): number {
  return shared.luminance(c);
}

/**
 * The contrast between two colours, from 1 (the same) to 21 (black on white).
 *
 * @param a - The first colour, as red, green and blue.
 * @param b - The second colour.
 * @returns The WCAG contrast ratio.
 * @example
 * ```ts
 * import { contrastRatio } from "@johnmorrisdotca/taisen-brackets/backgrounds";
 *
 * console.log(contrastRatio([255, 255, 255], [0, 0, 0]));
 * ```
 */
export function contrastRatio(a: Parameters<typeof shared.contrastRatio>[0], b: Parameters<typeof shared.contrastRatio>[1]): number {
  return shared.contrastRatio(a, b);
}

/**
 * Draws one of the poster backgrounds.
 *
 * @param preset - The background's name, from `BACKGROUND_PRESETS`.
 * @param options - The size, the theme and the tuning.
 * @returns The picture's parts and the ink that reads over it.
 * @example
 * ```ts
 * import { backgroundSvg } from "@johnmorrisdotca/taisen-brackets/backgrounds";
 *
 * const { body, ink } = backgroundSvg("midnight", { width: 1200, height: 675, theme: "dark" });
 * console.log(body.length > 0, ink.dark);
 * ```
 */
export function backgroundSvg(preset: BackgroundPresetName, options: BackgroundSvgOptions): BackgroundSvg {
  return shared.backgroundSvg(preset, options);
}
