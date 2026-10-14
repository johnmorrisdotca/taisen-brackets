// Measures a drawing from its markup: where each tie's box, marks and text are, where the round-name pills and the connector lines are, and whether any of them meet.
// Text is measured with the package's own width estimate (the same on every machine), so the test says what the drawing promises, not what one browser does.
import { emWidth } from "../src/text.ts";
import { parseXml, walk, type Node } from "./xml.ts";

export interface Box { x: number; y: number; w: number; h: number }
export interface Seg { x0: number; y0: number; x1: number; y1: number }

const n = (value: string | undefined, fallback = 0): number => (value === undefined || value === "" ? fallback : Number(value));
const has = (node: Node, cls: string): boolean => (node.attrs.class ?? "").split(/\s+/).includes(cls);
const f = (b: Box): string => `${b.x.toFixed(1)},${b.y.toFixed(1)} ${b.w.toFixed(1)}x${b.h.toFixed(1)}`;

/** The bounding box of a text: the estimated width of its content in its anchor's direction, a line's height around the baseline. */
export function textBox(t: Node): Box {
  const size = n(t.attrs["font-size"], 16);
  // A span with a size of its own (a shoot-out's score) is measured at that size.
  let own = t.text;
  let w = 0;
  for (const c of t.children) {
    own = own.replace(c.text, "");
    w += emWidth(c.text, true) * n(c.attrs["font-size"], size);
  }
  w = (w + emWidth(own, true) * size) * (t.attrs["letter-spacing"] ? 1.06 : 1);
  const x = n(t.attrs.x);
  const x0 = t.attrs["text-anchor"] === "end" ? x - w : t.attrs["text-anchor"] === "middle" ? x - w / 2 : x;
  return { x: x0, y: n(t.attrs.y) - size * 0.75, w, h: size };
}

/** The box a mark (a ring or an edge circle, or a square one) fills, with its stroke. */
export function markBox(m: Node): Box {
  const s = n(m.attrs["stroke-width"]) / 2;
  if (m.name === "circle") {
    const r = n(m.attrs.r);
    return { x: n(m.attrs.cx) - r - s, y: n(m.attrs.cy) - r - s, w: 2 * (r + s), h: 2 * (r + s) };
  }
  return { x: n(m.attrs.x) - s, y: n(m.attrs.y) - s, w: n(m.attrs.width) + 2 * s, h: n(m.attrs.height) + 2 * s };
}

export const rectOf = (r: Node): Box => ({ x: n(r.attrs.x), y: n(r.attrs.y), w: n(r.attrs.width), h: n(r.attrs.height) });
export const inside = (a: Box, b: Box, pad = 0): boolean => a.x >= b.x + pad - 1e-6 && a.y >= b.y + pad - 1e-6 && a.x + a.w <= b.x + b.w - pad + 1e-6 && a.y + a.h <= b.y + b.h - pad + 1e-6;
export const overlap = (a: Box, b: Box, gap = 0): boolean => a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;

/** The straight pieces of a path made of M, H, V and L commands (all a connector uses). */
export function segments(d: string): Seg[] {
  const out: Seg[] = [];
  let x = 0, y = 0;
  for (const m of d.matchAll(/([MHVL])\s*(-?[\d.]+)(?:[ ,]+(-?[\d.]+))?/g)) {
    const [, c, a, b] = m;
    const nx = c === "V" ? x : Number(a);
    const ny = c === "H" ? y : c === "V" ? Number(a) : Number(b);
    if (c !== "M") out.push({ x0: x, y0: y, x1: nx, y1: ny });
    x = nx;
    y = ny;
  }
  return out;
}

/** Whether an axis-aligned segment crosses or touches a box grown by `gap`. */
export function crosses(s: Seg, b: Box, gap = 0): boolean {
  const x0 = Math.min(s.x0, s.x1), x1 = Math.max(s.x0, s.x1), y0 = Math.min(s.y0, s.y1), y1 = Math.max(s.y0, s.y1);
  return x0 <= b.x + b.w + gap && x1 >= b.x - gap && y0 <= b.y + b.h + gap && y1 >= b.y - gap;
}

/** Everything wrong with a drawing's geometry: marks outside their boxes or on each other or on text, text outside its box, pills on lines, boxes or each other. */
export function problems(svg: string, { pad = 1.5, namesOverLines = false }: { pad?: number; namesOverLines?: boolean } = {}): string[] {
  const root = parseXml(svg);
  const found: string[] = [];
  const view = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)!.slice(1).map(Number);
  const picture: Box = { x: 0, y: 0, w: view[0], h: view[1] };
  const all = walk(root);
  const ties = all.filter((t) => has(t, "tb-tie"));
  const boxes: Box[] = [];
  ties.forEach((tie, k) => {
    const nodes = walk(tie);
    const boxNode = nodes.find((x) => has(x, "tb-box"));
    if (!boxNode) { found.push(`tie ${k}: no box`); return; }
    const box = rectOf(boxNode);
    boxes.push(box);
    // The mark of a team: its edge hairline (the road look), else its ring, else its plain disc.
    const markNodes = nodes.filter((x) => (x.name === "circle" || x.name === "rect") && (has(x, "tb-edge") || (has(x, "tb-ring") && !has(x, "tb-ring-r")) || (has(x, "tb-plain") && x.name === "circle")));
    // A team's plain disc has an edge circle of its own: the same mark counted once.
    const marks: Box[] = [];
    for (const m of markNodes.map((x) => markBox(x))) if (!marks.some((o) => Math.abs(o.x - m.x) < 1.2 && Math.abs(o.y - m.y) < 1.2 && Math.abs(o.w - m.w) < 1.2)) marks.push(m);
    marks.forEach((m, i) => {
      if (!inside(m, box, pad)) found.push(`tie ${k}: a mark (${f(m)}) is not inside its box (${f(box)}) with ${pad}px`);
      marks.slice(i + 1).forEach((o) => { if (overlap(m, o, -0.5)) found.push(`tie ${k}: two marks overlap (${f(m)}, ${f(o)})`); });
    });
    const texts = nodes.filter((x) => x.name === "text" && !has(x, "tb-initials") && x.text.trim() !== "");
    texts.forEach((t) => {
      const b = textBox(t);
      if (!inside(b, box, 1)) found.push(`tie ${k}: the text "${t.text}" (${f(b)}) is not inside its box (${f(box)})`);
      marks.forEach((m) => { if (overlap(b, m, 0)) found.push(`tie ${k}: the text "${t.text}" (${f(b)}) is on a mark (${f(m)})`); });
    });
    texts.forEach((t, i) => texts.slice(i + 1).forEach((u) => {
      const a = textBox(t), b = textBox(u);
      if (overlap({ x: a.x + 0.5, y: a.y + 2, w: a.w - 1, h: a.h - 4 }, { x: b.x + 0.5, y: b.y + 2, w: b.w - 1, h: b.h - 4 })) found.push(`tie ${k}: the texts "${t.text}" and "${u.text}" overlap`);
    }));
  });
  // The champion's mark is not on any box.
  for (const g of all.filter((x) => has(x, "tb-champ"))) {
    for (const m of walk(g).filter((x) => has(x, "tb-edge") || (has(x, "tb-ring") && !has(x, "tb-ring-r")))) boxes.forEach((b) => { if (overlap(markBox(m), b, 0)) found.push("the champion's mark meets a box"); });
  }
  // Pills (the road look) or round names (the classic look).
  const pills: { b: Box; label: string }[] = [];
  for (const p of all.filter((x) => has(x, "tb-panel"))) pills.push({ b: rectOf(p), label: "pill" });
  for (const t of all.filter((x) => has(x, "tb-round"))) {
    const b = textBox(t);
    pills.push({ b: { x: b.x - 4, y: b.y, w: b.w + 8, h: b.h }, label: `name "${t.text}"` });
  }
  // A round's name is never cut: smaller, or on a second line, but whole.
  for (const t of all.filter((x) => has(x, "tb-lab") || has(x, "tb-round"))) if (t.text.includes("\u2026")) found.push(`the name of a round is cut: "${t.text}"`);
  // The rest of the text of the drawing (titles, group headings, the champion): the names of the rounds stand clear of it.
  const inTies = new Set(ties.flatMap((t) => walk(t)));
  const loose = all.filter((x) => x.name === "text" && !inTies.has(x) && !has(x, "tb-lab") && !has(x, "tb-round") && x.text.trim() !== "");
  const lines = all.filter((x) => x.name === "path" && has(x, "tb-line")).flatMap((x) => segments(x.attrs.d ?? ""));
  pills.forEach(({ b, label }, i) => {
    if (!inside(b, picture, 0)) found.push(`${label} (${f(b)}) is outside the picture`);
    if (!namesOverLines) for (const s of lines) if (crosses(s, b, 1)) found.push(`${label} (${f(b)}) meets a connector line (${s.x0},${s.y0})-(${s.x1},${s.y1})`);
    boxes.forEach((box) => { if (overlap(b, box, 0)) found.push(`${label} (${f(b)}) overlaps a box (${f(box)})`); });
    pills.slice(i + 1).forEach((o) => { if (overlap(b, o.b, 0)) found.push(`${label} (${f(b)}) overlaps another (${f(o.b)})`); });
    for (const t of loose) { const tb = textBox(t); if (overlap({ x: b.x, y: b.y + 1, w: b.w, h: b.h - 2 }, { x: tb.x, y: tb.y + 2, w: tb.w, h: tb.h - 4 })) found.push(`${label} (${f(b)}) overlaps the text "${t.text}" (${f(tb)})`); }
  });
  // The pill's own text is inside it.
  for (const t of all.filter((x) => has(x, "tb-lab"))) {
    const b = textBox(t);
    if (!pills.some((p) => p.label === "pill" && inside(b, p.b, 2))) found.push(`the pill text "${t.text}" (${f(b)}) does not sit inside a pill`);
  }
  for (const b of boxes) if (!inside(b, picture, 0)) found.push(`a box (${f(b)}) is outside the picture`);
  return [...new Set(found)];
}
