// The `groups` layout: the group stage as one card a group, each with a title tile and a row a team (its mark, its name, its record or its points), the places that go through marked.
// The input is what the tree keeps outside itself: the round-robin games (`round: 0`) and the teams' `group`.
import type { BracketInput, BracketLayout, DrawOptions, Matchup, Size, SideId, Team } from "./types.ts";
import { layoutBracket } from "./layout.ts";
import { fill, voiceOf, type Voice } from "./locales.ts";
import { abbrOf } from "./matchup.ts";
import { drawMark, type MarkContext } from "./marks.ts";
import { bold, headingTexts, titleHeight } from "./furniture.ts";
import { esc, fit, num } from "./text.ts";

/** One team's line of a group's table. */
export interface GroupRow {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  /** Goals for minus goals against. */
  diff: number;
  /** Three for a win, one for a draw. */
  points: number;
}

/** One group: its name in the language and its teams, the best first. */
export interface GroupTable {
  /** The group's key: the teams' `group`, or a letter made for a group the teams do not name. */
  key: string;
  /** "Group A" in the language, or the teams' own `group` where it is a name and not a letter. */
  name: string;
  rows: GroupRow[];
}

const isLayout = (x: unknown): x is BracketLayout => typeof x === "object" && x !== null && "ties" in x && "sides" in x && "rounds" in x;

/**
 * The tables of the group stage: one for each group, from the round-robin games (`round: 0`) of the ties. A team's group is its `group`; teams with none take the group of the teams they
 * played (the games make groups of the teams they join), and a group the teams do not name is lettered A, B, C. Rows are in order of points, then goal difference, then goals scored, then
 * name (`standings: "record"` orders by wins, then fewest losses).
 */
export function groupStandings(input: BracketLayout | readonly Matchup[] | BracketInput, options: Pick<DrawOptions, "locale" | "words" | "teamName" | "standings"> = {}): GroupTable[] {
  const v = voiceOf(options);
  const layout = isLayout(input) ? input : layoutBracket(input);
  return tablesOf(layout, options.standings ?? "points", v);
}

function tablesOf(layout: BracketLayout, mode: "points" | "record", v: Voice): GroupTable[] {
  const games = layout.robin.map((i) => layout.ties[i]).filter((t) => t.sides[0] !== null && t.sides[1] !== null);
  // The games join teams into groups.
  const parent = new Map<SideId, SideId>();
  const find = (a: SideId): SideId => { let r = a; while (parent.get(r) !== r) r = parent.get(r)!; return r; };
  for (const t of games) for (const s of t.sides) if (s && !parent.has(s.id)) parent.set(s.id, s.id);
  for (const t of games) parent.set(find(t.sides[0]!.id), find(t.sides[1]!.id));
  const named = new Map<SideId, string>();
  for (const t of layout.teams) if (typeof t.group === "string" && t.group !== "") named.set(t.id, t.group);
  // A joined set of teams takes the group its teams name (the most common one).
  const joined = new Map<SideId, Map<string, number>>();
  for (const id of parent.keys()) {
    const g = named.get(id);
    if (!g) continue;
    const root = find(id);
    const counts = joined.get(root) ?? new Map<string, number>();
    counts.set(g, (counts.get(g) ?? 0) + 1);
    joined.set(root, counts);
  }
  const keyOf = (team: Team): string | null => {
    const own = named.get(team.id);
    if (own) return own;
    if (!parent.has(team.id)) return null;
    const counts = joined.get(find(team.id));
    if (counts) return [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0];
    return `#${String(find(team.id))}`;
  };
  const byKey = new Map<string, Team[]>();
  for (const team of layout.teams) {
    const key = keyOf(team);
    if (key === null) continue;
    byKey.set(key, [...(byKey.get(key) ?? []), team]);
  }
  const order = [...byKey.keys()].sort((a, b) => (a.startsWith("#") !== b.startsWith("#") ? (a.startsWith("#") ? 1 : -1) : a.localeCompare(b, "en", { numeric: true })));
  let lettered = 0;
  return order.map((key) => {
    const members = byKey.get(key)!;
    const ids = new Set(members.map((t) => t.id));
    const rows: GroupRow[] = members.map((team) => ({ team, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, diff: 0, points: 0 }));
    const rowOf = new Map(rows.map((r) => [r.team.id, r]));
    for (const t of games) {
      if (!ids.has(t.sides[0]!.id) || !ids.has(t.sides[1]!.id) || t.result.score === null) continue;
      const [a, b] = t.result.score;
      const ra = rowOf.get(t.sides[0]!.id)!, rb = rowOf.get(t.sides[1]!.id)!;
      for (const [r, f, g] of [[ra, a, b], [rb, b, a]] as const) {
        r.played++; r.goalsFor += f; r.goalsAgainst += g;
        if (f > g) { r.won++; r.points += 3; } else if (f < g) r.lost++; else { r.drawn++; r.points += 1; }
      }
    }
    for (const r of rows) r.diff = r.goalsFor - r.goalsAgainst;
    const byName = (x: GroupRow, y: GroupRow) => (x.team.name < y.team.name ? -1 : x.team.name > y.team.name ? 1 : 0);
    rows.sort(mode === "record" ? (x, y) => y.won - x.won || x.lost - y.lost || byName(x, y) : (x, y) => y.points - x.points || y.diff - x.diff || y.goalsFor - x.goalsFor || byName(x, y));
    const letter = String.fromCharCode(65 + lettered);
    const auto = key.startsWith("#");
    if (auto) lettered++;
    const name = auto ? fill(v.words.groupName, { n: letter }) : /^[A-Za-z0-9]$/.test(key) ? fill(v.words.groupName, { n: key.toUpperCase() }) : key;
    return { key: auto ? letter : key, name, rows };
  });
}

/** The table of the groups as HTML, for a reader the drawing does not serve: one `<table>` a group, its caption the group's name, a row a team. */
export function groupsTable(input: BracketLayout | readonly Matchup[] | BracketInput, options: Pick<DrawOptions, "locale" | "words" | "teamName" | "standings"> & { className?: string } = {}): string {
  const v = voiceOf(options);
  const w = v.words;
  const mode = options.standings ?? "points";
  const layout = isLayout(input) ? input : layoutBracket(input);
  const heads = mode === "points" ? [w.colPlayed, w.colWon, w.colDrawn, w.colLost, w.colDiff, w.colPoints] : [w.colWon, w.colLost];
  return tablesOf(layout, mode, v).map((g) => [
    `<table class="${esc(options.className ?? "tb-table")}" lang="${esc(v.locale.code)}">`,
    `<caption>${esc(g.name)}</caption>`,
    `<thead><tr><th scope="col">${esc(w.columnTie)}</th>${heads.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead>`,
    `<tbody>${g.rows.map((r) => `<tr><th scope="row">${esc(v.team(r.team))}</th>${cells(r, mode, v).map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>`,
    "</table>",
  ].join("\n")).join("\n");
}

const signed = (n: number, v: Voice): string => (n > 0 ? `+${v.number(n)}` : v.number(n));
const cells = (r: GroupRow, mode: "points" | "record", v: Voice): string[] =>
  mode === "points" ? [v.number(r.played), v.number(r.won), v.number(r.drawn), v.number(r.lost), signed(r.diff, v), v.number(r.points)] : [v.number(r.won), v.number(r.lost)];

/** What a layout that plans itself hands back to the frame. */
export interface OwnDrawing {
  width: number;
  height: number;
  /** The parts, in drawing order. */
  body: string[];
  /** The title and the subtitle. */
  texts: string[];
  /** The description for a screen reader, in place of the tree's. */
  desc?: string;
}

/** Draws the group tables as cards in a grid. */
export function drawGroups(layout: BracketLayout, o: DrawOptions, v: Voice, size: Size, ctx: MarkContext, road: boolean, linked: { count: number }): OwnDrawing {
  void linked;
  const mode = o.standings ?? "points";
  const tables = tablesOf(layout, mode, v);
  if (tables.length === 0) throw new RangeError("taisen-brackets: the groups layout needs round-robin games (round: 0) or teams with a group");
  const w = v.words;
  const W = size.width;
  const pad = W < 500 ? 14 : 22;
  const heads = mode === "points" ? [w.colPlayed, w.colWon, w.colDrawn, w.colLost, w.colDiff, w.colPoints] : [w.colWon, w.colLost];
  const colW = mode === "points" ? (W < 500 ? 31 : 36) : 44;
  const colsW = heads.length * colW;
  const gap = 14;
  const rowH = road ? 34 : 30;
  const maxRows = Math.max(...tables.map((t) => t.rows.length));
  const tileH = 28;
  const headH = 18;
  const cardH = 10 + tileH + 6 + headH + maxRows * rowH + 10;
  const minCard = colsW + 150;
  const avail = W - 2 * pad;
  const maxPer = Math.max(1, Math.min(tables.length, Math.floor((avail + gap) / (minCard + gap))));
  const lines = Math.ceil(tables.length / maxPer);
  const per = Math.ceil(tables.length / lines);
  const cardW = Math.min(400, (avail - gap * (per - 1)) / per);
  const titleH = titleHeight(o);
  const top0 = pad + titleH;
  const content = lines * cardH + (lines - 1) * gap;
  const height = Math.max(size.height ?? 0, top0 + content + pad);
  const y00 = top0 + Math.max(0, (height - top0 - pad - content) / 2);
  const md = clamp(rowH - 9, 14, 28);
  const qualify = Math.max(0, Math.floor(o.qualify ?? 0));
  const body: string[] = [];
  const descParts: string[] = [];
  tables.forEach((g, n) => {
    const line = Math.floor(n / per);
    const inLine = Math.min(per, tables.length - line * per);
    const x = pad + (avail - (inLine * cardW + (inLine - 1) * gap)) / 2 + (n % per) * (cardW + gap);
    const y = y00 + line * (cardH + gap);
    const parts: string[] = [];
    parts.push(`<rect class="tb-box tb-gcard" x="${num(x)}" y="${num(y)}" width="${num(cardW)}" height="${num(cardH)}" rx="10"${o.theme === "none" ? ' fill="none" stroke="currentColor" stroke-opacity=".4"' : ""}/>`);
    parts.push(`<rect class="tb-gtile" x="${num(x + 8)}" y="${num(y + 10)}" width="${num(cardW - 16)}" height="${tileH}" rx="7"/>`);
    parts.push(`<text class="tb-gtile-t" x="${num(x + cardW / 2)}" y="${num(y + 10 + tileH / 2 + 5)}" font-size="14" letter-spacing=".06em" text-anchor="middle">${esc(fit(o.theme === "poster" ? v.upper(g.name) : g.name, 14, cardW - 36, (t, s) => bold(t, s) * 1.06))}</text>`);
    const headY = y + 10 + tileH + 6;
    const colsX = x + cardW - 10 - colsW;
    heads.forEach((h, i) => parts.push(`<text class="tb-ghead" x="${num(colsX + i * colW + colW / 2)}" y="${num(headY + 12)}" font-size="10" text-anchor="middle">${esc(h)}</text>`));
    const rows0 = headY + headH;
    g.rows.forEach((r, i) => {
      const ry = rows0 + i * rowH;
      const cy = ry + rowH / 2;
      const out = i < qualify;
      if (i > 0) parts.push(`<line class="tb-gsep" x1="${num(x + 10)}" x2="${num(x + cardW - 10)}" y1="${num(ry)}" y2="${num(ry)}"/>`);
      if (out) parts.push(`<rect class="tb-qual" x="${num(x + 6)}" y="${num(ry + 1)}" width="${num(cardW - 12)}" height="${num(rowH - 2)}" rx="6"/>`);
      const row: string[] = [];
      let nx = x + 12;
      if (ctx.shape !== "none") { row.push(drawMark(r.team, nx + md / 2, cy, md, ctx)); nx += md + 8; }
      const room = colsX - 6 - nx;
      let nf = road ? 14 : 13;
      const full = r.team.name;
      const abbr = abbrOf(r.team, v);
      let label = full;
      while (nf > 10 && bold(label, nf) > room) nf -= 0.5;
      if (bold(label, nf) > room) { label = abbr; nf = road ? 14 : 13; while (nf > 10 && bold(label, nf) > room) nf -= 0.5; }
      row.push(`<text class="tb-gname" x="${num(nx)}" y="${num(cy + nf * 0.35)}" font-size="${num(nf)}">${esc(fit(label, nf, Math.max(room, 8), bold))}</text>`);
      cells(r, mode, v).forEach((c, k) => row.push(`<text class="tb-gcell${k === heads.length - 1 ? " tb-gcell-p" : ""}" x="${num(colsX + k * colW + colW / 2)}" y="${num(cy + 4.2)}" font-size="12.5" text-anchor="middle">${esc(c)}</text>`));
      parts.push(`<g class="tb-grow${out ? " tb-qualified" : ""}">${row.join("")}</g>`);
    });
    const summary = g.rows.map((r) => `${v.team(r.team)} ${cells(r, mode, v).join(" ")}`).join(w.noteJoin);
    descParts.push(`${g.name}: ${summary}`);
    body.push(`<g class="tb-group"><title>${esc(`${g.name}: ${summary}`)}</title>${parts.join("")}</g>`);
  });
  return { width: W, height, body, texts: headingTexts(v, o, W, pad), desc: `${descParts.join(w.sep)}${w.end}` };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
