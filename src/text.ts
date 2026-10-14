/** Text helpers: escaping, an estimate of how wide a line is, and trimming it to fit. Pure, no DOM, no font files. */

/** Escapes text for an XML or HTML text node or an attribute value. */
export function esc(text: string | number): string {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const NARROW = new Set("iIjlt1.,:;!|'`()[]/ ");
const WIDE = new Set("mwMW@%");

/**
 * About how wide a line is at a font size, in the same units. An estimate from character classes (a system sans):
 * the same on every machine, so that a drawing is the same string everywhere. It can be a few percent off a real font.
 */
export function textWidth(text: string, size: number): number {
  let em = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x2e80) em += 1;
    else if (NARROW.has(ch)) em += 0.3;
    else if (WIDE.has(ch)) em += 0.86;
    else if (ch >= "A" && ch <= "Z") em += 0.66;
    else if (ch >= "0" && ch <= "9") em += 0.56;
    else em += 0.54;
  }
  return em * size;
}

/** The text cut to fit a width, with an ellipsis where it was cut. */
export function fit(text: string, size: number, width: number): string {
  if (textWidth(text, size) <= width) return text;
  const chars = [...text];
  while (chars.length > 1 && textWidth(`${chars.join("")}…`, size) > width) chars.pop();
  return chars.length <= 1 && textWidth(text, size) > width * 2 ? "…" : `${chars.join("").trimEnd()}…`;
}

/** A short name for a small box: the initials of a name of several words ("NYR"), else its first three letters; capitals. */
export function abbreviate(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = (word: string) => [...word].filter((c) => /\p{L}/u.test(c));
  const made = words.length > 1 ? words.map((w) => letters(w)[0] ?? "").join("").slice(0, 3) : letters(words[0] ?? "").slice(0, 3).join("");
  return (made || name.slice(0, 3)).toUpperCase();
}

/** A small, stable hash of a string as lowercase base 36, for ids that depend on the content and nothing else. */
export function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

const NARROW_B = new Set("iIjl!|.,:;'`");

/** An estimate of the width of a string set in a bold face, in ems; full-width characters are one em. A little generous, so that a name stays inside its place whichever font the page falls back to. */
export function emWidth(text: string, bold = true): number {
  let width = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x2e80) width += 1.02;
    else if (ch === " ") width += 0.3;
    else if (NARROW_B.has(ch)) width += 0.34;
    else if (WIDE.has(ch)) width += 0.92;
    else if (ch >= "0" && ch <= "9") width += 0.62;
    else if (ch >= "A" && ch <= "Z") width += 0.7;
    else if (ch === "-" || ch === "–" || ch === "—") width += 0.45;
    else width += 0.58;
  }
  return bold ? width * 1.04 : width;
}

/** The text in capitals when it has Latin letters; any other text is left as it is. */
export function capitals(text: string): string {
  return /[a-z]/i.test(text) ? text.toLocaleUpperCase("en") : text;
}

/** The lines a name is set in, the font size that fits them, and the width and height they take. */
export interface FittedLines {
  lines: string[];
  size: number;
  width: number;
  height: number;
}

const LINE_HEIGHT = 1.1;

/** A name in the biggest size that fits a box, on one line or, at a space, on two (two only when that is clearly bigger). */
export function fitLines(name: string, maxWidth: number, maxHeight: number, maxSize: number): FittedLines {
  const w1 = emWidth(name);
  const size1 = Math.max(0.1, Math.min(maxSize, maxHeight / LINE_HEIGHT, w1 === 0 ? maxSize : maxWidth / w1));
  const single: FittedLines = { lines: [name], size: size1, width: w1 * size1, height: size1 * LINE_HEIGHT };
  let two: FittedLines | undefined;
  const words = name.split(" ");
  for (let i = 1; i < words.length; i += 1) {
    const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
    const w = Math.max(emWidth(a), emWidth(b));
    const size = Math.max(0.1, Math.min(maxSize, maxHeight / (2 * LINE_HEIGHT), w === 0 ? maxSize : maxWidth / w));
    if (two === undefined || size > two.size) two = { lines: [a, b], size, width: w * size, height: 2 * size * LINE_HEIGHT };
  }
  return two !== undefined && two.size > single.size * 1.18 ? two : single;
}

/** A number written without float noise: at most two decimals, no trailing zeros. */
export function num(n: number): string {
  if (!Number.isFinite(n)) throw new Error(`taisen-brackets: cannot draw ${n}`);
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? "0" : String(r);
}
