// The `playin` layout: the play-in games of each half (the NBA's), each leading on by an arrow: a winner's solid, a loser's dashed, to a game that takes it ("Winner 9/10" and "Loser 7/8" meet) or to the
// seed it earns ("Seed 8"). The seeds that need no game stand in a column of tiles at the left. The places come from `Tie.from`, which `feeds` with `{ tie, result }` writes.
import type { BracketLayout, DrawOptions, Size, Team, Tie } from "./types.ts";
import { fill, type Voice } from "./locales.ts";
import { abbrOf, describeTie } from "./matchup.ts";
import { drawMark, type MarkContext } from "./marks.ts";
import { bold, headTile, headingTexts, titleHeight } from "./furniture.ts";
import type { OwnDrawing } from "./groups.ts";
import { esc, fit, num } from "./text.ts";

interface Rect { x: number; y: number; w: number; h: number }

/** One half's play-in: its games, where they lead, and the seeds that need no game. */
interface Panel {
  label: string | null;
  games: number[];
  slots: { to: Tie; side: 0 | 1; from: number; result: "winner" | "loser" }[];
  tiles: Team[];
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Draws the play-in games of each half. */
export function drawPlayIn(layout: BracketLayout, o: DrawOptions, v: Voice, size: Size, ctx: MarkContext, road: boolean, linked: { count: number }): OwnDrawing {
  void linked;
  void road;
  const w = v.words;
  const games = layout.playIn;
  if (games.length === 0) throw new RangeError('taisen-brackets: the playin layout needs play-in games: matchups with stage: "play-in"');
  const inPlayIn = new Set(games);
  const sources = (i: number): { tie: number; result: "winner" | "loser"; side: 0 | 1 }[] => (layout.ties[i].from ?? []).flatMap((s, k) => (s ? [{ tie: s.tie, result: s.result, side: k as 0 | 1 }] : []));

  // The halves: the play-in games joined by what feeds what.
  const parent = new Map<number, number>(games.map((g) => [g, g]));
  const find = (a: number): number => { let r = a; while (parent.get(r) !== r) r = parent.get(r)!; return r; };
  for (const g of games) for (const s of sources(g)) if (inPlayIn.has(s.tie)) parent.set(find(g), find(s.tie));
  const groups = new Map<number, number[]>();
  for (const g of games) groups.set(find(g), [...(groups.get(find(g)) ?? []), g]);
  const groupOf = (list: number[]): string | null => {
    const counts = new Map<string, number>();
    for (const g of list) for (const t of layout.ties[g].sides) if (t?.group) counts.set(t.group, (counts.get(t.group) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? null;
  };
  const rank = (g: string | null) => (g !== null && /west/i.test(g) ? 0 : g !== null && /east/i.test(g) ? 2 : 1);
  const panels: Panel[] = [...groups.values()].map((list) => {
    const label = groupOf(list);
    const set = new Set(list);
    const slots = layout.ties.filter((t) => !inPlayIn.has(t.index)).flatMap((t) => sources(t.index).filter((s) => set.has(s.tie)).map((s) => ({ to: t, side: s.side, from: s.tie, result: s.result })));
    const inGames = new Set(list.flatMap((g) => layout.ties[g].sides.map((t) => t?.id)));
    const tiles = label === null && groups.size > 1 ? [] : layout.teams.filter((t) => typeof t.seed === "number" && !inGames.has(t.id) && (label === null || t.group === label)).sort((a, b) => a.seed! - b.seed!);
    return { label, games: list, slots, tiles };
  }).sort((a, b) => rank(a.label) - rank(b.label));

  const W = size.width;
  const pad = W < 500 ? 14 : 22;
  const avail = W - 2 * pad;
  const side = panels.length === 2 && avail >= 900;
  const panelW = side ? (avail - 28) / 2 : avail;
  const titleH = titleHeight(o);
  const tileH = 34, tileGap = 6, gameH = 54, colGap = 24, unit = 44, slotH = 32;
  const wideTiles = panelW >= 470;
  const tileW = 124;
  const body: string[] = [];
  const parts: { x: number; y: number; h: number }[] = [];
  const heights: number[] = [];

  const drawn = panels.map((panel, pi) => {
    // Depth and row of each game: a game with no source in the play-in is at the start; one that takes others sits between them.
    const depth = new Map<number, number>();
    const pos = new Map<number, number>();
    let next = 0;
    const walk = (g: number): void => {
      if (depth.has(g)) return;
      const src = sources(g).filter((s) => inPlayIn.has(s.tie));
      src.forEach((s) => walk(s.tie));
      depth.set(g, src.length === 0 ? 0 : 1 + Math.max(...src.map((s) => depth.get(s.tie)!)));
      pos.set(g, src.length === 0 ? (next += 2) - 2 : src.reduce((sum, s) => sum + pos.get(s.tie)!, 0) / src.length);
    };
    [...panel.games].sort((a, b) => a - b).forEach(walk);
    const maxDepth = Math.max(...panel.games.map((g) => depth.get(g)!));
    const maxPos = Math.max(...panel.games.map((g) => pos.get(g)!));
    const slotW = wideTiles ? 100 : 84;
    const innerW = panelW - (wideTiles && panel.tiles.length > 0 ? tileW + colGap : 0);
    const gameW = clamp((innerW - (panel.slots.length > 0 ? slotW + colGap : 0) - colGap * maxDepth) / (maxDepth + 1), 90, 168);
    const gamesH = maxPos * unit + gameH;
    const tilesH = panel.tiles.length * (tileH + tileGap) - tileGap;
    const gridCols = wideTiles ? 1 : Math.max(1, Math.floor((panelW + 6) / 90));
    const gridH = !wideTiles && panel.tiles.length > 0 ? Math.ceil(panel.tiles.length / gridCols) * (tileH + tileGap) + 10 : 0;
    const head = 42;
    const bodyH = Math.max(wideTiles ? tilesH : 0, gamesH + 18);
    return { panel, pi, depth, pos, maxDepth, maxPos, slotW, innerW, gameW, gamesH, tilesH, gridCols, gridH, head, bodyH, height: head + gridH + bodyH + 8 };
  });

  // Where the panels stand: side by side, or one under the other.
  const content = side ? Math.max(...drawn.map((d) => d.height)) : drawn.reduce((s, d) => s + d.height, 0) + (drawn.length - 1) * 18;
  const top0 = pad + titleH;
  const height = Math.max(size.height ?? 0, top0 + content + pad);
  let yCursor = top0 + Math.max(0, (height - top0 - pad - content) / 2);
  void parts;
  void heights;

  drawn.forEach((d) => {
    const px = side ? pad + d.pi * (panelW + 28) : pad;
    const py = side ? top0 + Math.max(0, (height - top0 - pad - content) / 2) : yCursor;
    if (!side) yCursor += d.height + 18;
    const coloured = panels.length === 2;
    if (d.panel.label !== null) body.push(headTile(o.theme === "poster" ? v.upper(d.panel.label) : d.panel.label, px + panelW / 2, panelW, py + 18, d.pi === 0 ? 0 : 1, coloured));
    const by = py + d.head + d.gridH;

    // The seeds that need no game: a column of tiles at the left, or a grid over the games.
    const seedTile = (t: Team, rect: Rect): string => {
      const label = t.seed !== undefined ? v.number(t.seed) : "";
      const md = ctx.shape === "none" ? 0 : Math.min(rect.h - 10, 24);
      const parts2: string[] = [];
      let x = rect.x + 6;
      if (md > 0) { parts2.push(drawMark(t, x + md / 2, rect.y + rect.h / 2, md, ctx)); x += md + 5; }
      const nf = 12;
      const sf = label ? 15 : 0;
      const sw = label ? bold(label, sf) + 6 : 0;
      const room = rect.x + rect.w - 6 - sw - x;
      parts2.push(`<text class="tb-name" x="${num(x)}" y="${num(rect.y + rect.h / 2 + nf * 0.35)}" font-size="${nf}">${esc(fit(abbrOf(t, v), nf, Math.max(room, 8), bold))}</text>`);
      if (label) parts2.push(`<text class="tb-seedn" x="${num(rect.x + rect.w - 6)}" y="${num(rect.y + rect.h / 2 + sf * 0.35)}" font-size="${sf}" font-weight="800" text-anchor="end">${esc(label)}</text>`);
      return `<g class="tb-group"><title>${esc(`${fill(w.seedSlot, { n: label })}: ${v.team(t)}`)}</title><rect class="tb-box" x="${num(rect.x)}" y="${num(rect.y)}" width="${num(rect.w)}" height="${num(rect.h)}" rx="7"/>${parts2.join("")}</g>`;
    };
    if (wideTiles) d.panel.tiles.forEach((t, i) => body.push(seedTile(t, { x: px, y: by + i * (tileH + tileGap), w: tileW, h: tileH })));
    else if (d.gridH > 0) {
      const cell = (panelW - tileGap * (d.gridCols - 1)) / d.gridCols;
      d.panel.tiles.forEach((t, i) => body.push(seedTile(t, { x: px + (i % d.gridCols) * (cell + tileGap), y: py + d.head + Math.floor(i / d.gridCols) * (tileH + tileGap), w: cell, h: tileH })));
    }

    // The games, in columns by depth; the seeds they lead to, in the column after.
    const gx0 = px + (wideTiles && d.panel.tiles.length > 0 ? tileW + colGap : 0);
    const colX = (c: number) => gx0 + c * (d.gameW + colGap);
    const rects = new Map<number, Rect>();
    const cyOf = (g: number) => by + 18 + gameH / 2 + d.pos.get(g)! * unit;
    body.push(`<text class="tb-ghead" x="${num(gx0)}" y="${num(by + 9)}" font-size="10" letter-spacing=".1em">${esc(v.upper(w.playIn))}</text>`);
    const placeholder = (t: Tie, k: 0 | 1): string => {
      const s = t.from?.[k];
      if (!s) return w.tbd;
      const src = layout.ties[s.tie];
      const seed = (j: 0 | 1) => src.seeds?.[j] ?? src.sides[j]?.seed;
      if (seed(0) !== undefined && seed(0) !== null && seed(1) !== undefined && seed(1) !== null) return fill(s.result === "loser" ? w.playInLoser : w.playInWinner, { a: v.number(Number(seed(0))), b: v.number(Number(seed(1))) });
      return fill(s.result === "loser" ? w.loserOf : w.winnerOf, { name: fill(w.tieVs, { a: src.sides[0] ? v.team(src.sides[0]) : w.tbd, b: src.sides[1] ? v.team(src.sides[1]) : w.tbd }) });
    };
    for (const g of d.panel.games) {
      const t = layout.ties[g];
      const rect = { x: colX(d.depth.get(g)!), y: cyOf(g) - gameH / 2, w: d.gameW, h: gameH };
      rects.set(g, rect);
      const rowH = gameH / 2;
      const rows = ([0, 1] as const).map((k) => {
        const team = t.sides[k];
        const ry = rect.y + k * rowH;
        const cy = ry + rowH / 2;
        const score = o.scores !== false && t.result.score ? v.number(t.result.score[k]) : "";
        const cls = t.winner === null ? "tb-pending" : t.winner === k ? "tb-won" : "tb-lost";
        const items: string[] = [];
        const slotX = rect.x + rect.w - 5 - 26;
        items.push(`<rect class="tb-slot" x="${num(slotX)}" y="${num(cy - 9)}" width="26" height="18" rx="4"/>`);
        if (score) items.push(`<text class="tb-score" x="${num(slotX + 13)}" y="${num(cy + 4.5)}" font-size="12.5" text-anchor="middle" font-variant-numeric="tabular-nums">${esc(score)}</text>`);
        let x = rect.x + 6;
        const md = ctx.shape === "none" || !team ? 0 : rowH - 8;
        if (md > 0) { items.push(drawMark(team, x + md / 2, cy, md, ctx)); x += md + 5; }
        const room = slotX - 4 - x;
        const text = team ? (room >= bold(team.name, 12) ? team.name : abbrOf(team, v)) : placeholder(t, k);
        items.push(`<text class="tb-name${team ? "" : " tb-muted"}" x="${num(x)}" y="${num(cy + 4.2)}" font-size="12"${team ? "" : ' font-style="italic"'}>${esc(fit(text, 12, Math.max(room, 8), bold))}</text>`);
        return `<g class="${cls}">${items.join("")}</g>`;
      });
      body.push(`<g class="tb-tie${t.winner === null ? "" : " tb-decided"}"><title>${esc(describeTie(t, v))}</title><rect class="tb-box" x="${num(rect.x)}" y="${num(rect.y)}" width="${num(rect.w)}" height="${num(rect.h)}" rx="7"/>${rows.join("")}<line class="tb-line" x1="${num(rect.x + 4)}" x2="${num(rect.x + rect.w - 4)}" y1="${num(rect.y + rowH)}" y2="${num(rect.y + rowH)}" stroke-opacity=".35"/></g>`);
    }
    // The edges out of each game, to see where its winner's and its loser's arrows leave from.
    const out = new Map<number, Set<string>>();
    const addOut = (g: number, r: string) => out.set(g, (out.get(g) ?? new Set()).add(r));
    for (const g of d.panel.games) for (const s of sources(g)) if (inPlayIn.has(s.tie)) addOut(s.tie, s.result);
    for (const s of d.panel.slots) addOut(s.from, s.result);
    const leaveY = (g: number, result: "winner" | "loser"): number => {
      const kinds = out.get(g);
      const cy = cyOf(g);
      return kinds && kinds.size > 1 ? cy + (result === "winner" ? -9 : 9) : cy;
    };
    const arrow = (x0: number, y0: number, x1: number, y1: number, result: "winner" | "loser"): string => {
      const xm = x0 + colGap / 2;
      const d1 = y0 === y1 ? `M${num(x0)} ${num(y0)}H${num(x1 - 1)}` : `M${num(x0)} ${num(y0)}H${num(xm)}V${num(y1)}H${num(x1 - 1)}`;
      return `<path class="tb-line tb-arrow${result === "loser" ? " tb-arrow-loser" : ""}" d="${d1}"/><path class="tb-arrowhead" d="M${num(x1)} ${num(y1)}L${num(x1 - 7)} ${num(y1 - 4)}V${num(y1 + 4)}Z"/>`;
    };
    for (const g of d.panel.games) {
      const rect = rects.get(g)!;
      for (const s of sources(g)) {
        const from = rects.get(s.tie);
        if (!from) continue;
        body.push(arrow(from.x + from.w, leaveY(s.tie, s.result), rect.x, rect.y + gameH / 4 + s.side * (gameH / 2), s.result));
      }
    }
    // The seeds the games lead to.
    const slotX = colX(d.maxDepth + 1);
    d.panel.slots.forEach((s) => {
      const src = rects.get(s.from)!;
      const cy = leaveY(s.from, s.result);
      const rect = { x: slotX, y: cy - slotH / 2, w: d.slotW, h: slotH };
      const winnerOfSrc = layout.ties[s.from].winner;
      const team = winnerOfSrc === null ? null : layout.ties[s.from].sides[s.result === "winner" ? winnerOfSrc : ((1 - winnerOfSrc) as 0 | 1)];
      const seed = s.to.seeds?.[s.side] ?? s.to.sides[s.side]?.seed ?? null;
      const label = seed === null || seed === undefined ? w.tbd : fill(w.seedSlot, { n: v.number(Number(seed)) });
      const items: string[] = [];
      if (team) {
        const md = ctx.shape === "none" ? 0 : slotH - 10;
        let x = rect.x + 6;
        // The seed it earned, as a number, before the mark.
        if (seed !== null && seed !== undefined) { const sn = v.number(Number(seed)); items.push(`<text class="tb-seedn" x="${num(x)}" y="${num(cy + 5.5)}" font-size="15" font-weight="800">${esc(sn)}</text>`); x += bold(sn, 15) + 6; }
        if (md > 0) { items.push(drawMark(team, x + md / 2, cy, md, ctx)); x += md + 4; }
        items.push(`<text class="tb-name" x="${num(x)}" y="${num(cy + 4.2)}" font-size="12">${esc(fit(abbrOf(team, v), 12, Math.max(rect.x + rect.w - 6 - x, 8), bold))}</text>`);
      } else items.push(`<text class="tb-name tb-muted" x="${num(rect.x + rect.w / 2)}" y="${num(cy + 4)}" font-size="11.5" text-anchor="middle">${esc(fit(label, 11.5, rect.w - 12, bold))}</text>`);
      body.push(`<g class="tb-group"><title>${esc(team ? `${label}: ${v.team(team)}` : label)}</title><rect class="tb-box" x="${num(rect.x)}" y="${num(rect.y)}" width="${num(rect.w)}" height="${num(rect.h)}" rx="7"/>${items.join("")}</g>`);
      body.push(arrow(src.x + src.w, cy, rect.x, cy, s.result));
    });
  });
  const desc = games.map((g) => describeTie(layout.ties[g], v)).join(w.sep);
  return { width: W, height, body, texts: headingTexts(v, o, W, pad), desc: `${w.playIn}: ${desc}${w.end}` };
}
