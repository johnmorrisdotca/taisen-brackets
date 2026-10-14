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

/** A number written without float noise: at most two decimals, no trailing zeros. */
export function num(n: number): string {
  if (!Number.isFinite(n)) throw new Error(`taisen-brackets: cannot draw ${n}`);
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? "0" : String(r);
}
