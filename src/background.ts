// The `background` option: a preset's name, a preset tuned, or the caller's own picture, turned into the SVG to draw under everything and the colours to draw over it.
// The drawing of the presets is `family-backgrounds.ts`, which is shared with the other packages of the family; this file only reads the option and writes the picture's frame.
import { BACKGROUND_PRESETS, backgroundSvg, type BackgroundInk, type BackgroundPresetName } from "./family-backgrounds.ts";
import { safeUrl } from "./marks.ts";
import type { BackgroundInks } from "./theme.ts";
import type { BackgroundImageOptions, BackgroundOptions, ThemeName } from "./types.ts";
import { esc, num } from "./text.ts";

export interface ResolvedBackground {
  /** For the drawing's `<defs>`. */
  defs: string;
  /** Drawn over the plain `.tb-bg` rectangle, under everything else. */
  body: string;
  /** The colours to draw over it: one for a look that is light or dark, both for `auto`. */
  inks: BackgroundInks;
  /** Both pictures are in the drawing and the stylesheet shows the one that fits. */
  auto: boolean;
}

const isPreset = (name: unknown): name is BackgroundPresetName => typeof name === "string" && (BACKGROUND_PRESETS as readonly string[]).includes(name);

/** Whether an option asks for more than the plain colour: a preset, a tuned preset or an image. */
export function hasBackground(option: unknown): boolean {
  return typeof option === "string" || (typeof option === "object" && option !== null);
}

const fail = (message: string): never => {
  throw new RangeError(`taisen-brackets: ${message}`);
};

/** The ink for a picture of the caller's own: a plain dark or pale ground, since the image under the veil is not known. */
function inkForImage(theme: "light" | "dark", id: string): BackgroundInk {
  const colors = theme === "dark" ? ["#12161c", "#12161c", "#c9d2e0", "#c9d2e0"] : ["#f4f4f1", "#f4f4f1", "#4a5568", "#4a5568"];
  return backgroundSvg("midnight", { width: 8, height: 8, theme, colors, id }).ink;
}

/**
 * Reads the `background` option for a drawing `width` by `height` in the look `theme`, with `prefix` for the ids. Returns `null` when the option is `true`, `false` or left out
 * (a plain colour, or none). An unknown preset, a bad colour list or an image address that is not http(s), relative or `data:image/…` throws a `RangeError`.
 */
export function resolveBackground(option: unknown, theme: ThemeName, width: number, height: number, prefix: string): ResolvedBackground | null {
  if (option === undefined || typeof option === "boolean" || option === null) return null;
  const spec: BackgroundOptions & Partial<BackgroundImageOptions> = typeof option === "string" ? { preset: option as BackgroundPresetName } : (option as BackgroundOptions & BackgroundImageOptions);
  if (typeof option !== "string" && typeof option !== "object") return fail(`background is a preset's name or an object, not ${typeof option}`);
  const image = spec.image;
  if (image === undefined && spec.preset !== undefined && !isPreset(spec.preset)) fail(`unknown background "${String(spec.preset)}": use one of ${BACKGROUND_PRESETS.join(", ")}`);
  if (spec.colors !== undefined && (!Array.isArray(spec.colors) || spec.colors.some((c) => typeof c !== "string"))) fail("background.colors is a list of colours as text");
  for (const key of ["angle", "intensity", "seed", "dim"] as const) if (spec[key] !== undefined && !Number.isFinite(spec[key])) fail(`background.${key} is a number`);
  // Which pictures to draw: the one the look is, or the one asked for; `auto` draws both.
  const want: ("light" | "dark")[] = spec.theme ? [spec.theme] : theme === "light" ? ["light"] : theme === "dark" || theme === "poster" || theme === "none" ? ["dark"] : ["light", "dark"];
  const auto = want.length === 2;
  const parts = want.map((t) => {
    const id = auto ? `${prefix}${t === "light" ? "l" : "d"}` : `${prefix}b`;
    if (image !== undefined) {
      if (typeof image !== "string" || !safeUrl(image)) return fail("background.image must be an http(s) address, a relative path or a data:image/ address");
      const dim = Math.min(1, Math.max(0, spec.dim ?? 0.5));
      const fitName = spec.fit === "contain" ? "meet" : "slice";
      return {
        t,
        defs: "",
        body: `<image href="${esc(image)}" x="0" y="0" width="${num(width)}" height="${num(height)}" preserveAspectRatio="xMidYMid ${fitName}"/><rect width="${num(width)}" height="${num(height)}" fill="${t === "dark" ? "#000" : "#fff"}" opacity="${num(dim)}"/>`,
        ink: inkForImage(t, id),
      };
    }
    const made = backgroundSvg(spec.preset ?? "midnight", { width, height, theme: t, colors: spec.colors, angle: spec.angle, intensity: spec.intensity, seed: spec.seed, id });
    return { t, ...made };
  });
  const inks: BackgroundInks = {};
  for (const p of parts) inks[p.t] = p.ink;
  return {
    defs: parts.map((p) => p.defs).join(""),
    body: auto ? parts.map((p) => `<g class="${p.t === "light" ? "tb-bgl" : "tb-bgd"}">${p.body}</g>`).join("") : parts[0].body,
    inks,
    auto,
  };
}
