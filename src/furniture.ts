// What the drawings that plan themselves (`groups`, `playin`) share with the tree: the title block and the big title tile over a half.
import type { DrawOptions } from "./types.ts";
import type { Voice } from "./locales.ts";
import { emWidth, esc, fit, num } from "./text.ts";

/** The width of a text set in bold: the package's generous estimate. */
export const bold = (text: string, size: number): number => emWidth(text) * size;

/** The height the title and the subtitle take, with the gap under them. */
export function titleHeight(o: DrawOptions): number {
  const poster = o.theme === "poster";
  return (o.title ? (poster ? 46 : 38) : 0) + (o.subtitle ? 24 : 0) + (o.title || o.subtitle ? 10 : 0);
}

/** The title and the subtitle, centred on the drawing. */
export function headingTexts(v: Voice, o: DrawOptions, width: number, pad: number): string[] {
  const poster = o.theme === "poster";
  const out: string[] = [];
  let y = pad + 24;
  if (o.title) {
    const text = poster ? v.upper(o.title) : o.title;
    out.push(`<text class="tb-title" x="${num(width / 2)}" y="${num(y)}" font-size="${poster ? 26 : 24}" font-weight="800" ${poster ? 'letter-spacing=".14em" ' : ""}text-anchor="middle">${esc(text)}</text>`);
    y += poster ? 24 : 22;
  }
  if (o.subtitle) out.push(`<text class="tb-sub" x="${num(width / 2)}" y="${num(y)}" font-size="14" text-anchor="middle">${esc(o.subtitle)}</text>`);
  return out;
}

/** The big title tile over a half (`headers`): its group's name in the colour of the half, `width` wide at most, centred on `cx`, its text on the baseline `y`. */
export function headTile(text: string, cx: number, width: number, y: number, conf: 0 | 1, coloured: boolean): string {
  const w = Math.min(Math.max(width, 140), 360);
  const size = 15;
  const shown = fit(text, size, w - 20, (t, sz) => bold(t, sz) * 1.06);
  return `<rect class="tb-head${coloured ? ` tb-c${conf}` : ""}" x="${num(cx - w / 2)}" y="${num(y - 17)}" width="${num(w)}" height="26" rx="7"/><text class="tb-head-t" x="${num(cx)}" y="${num(y + 1.5)}" font-size="${size}" font-weight="800" letter-spacing=".08em" text-anchor="middle">${esc(shown)}</text>`;
}
