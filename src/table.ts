import type { BracketInput, BracketLayout, DrawOptions, Matchup, Tie } from "./types.ts";
import { layoutBracket } from "./layout.ts";
import { noteLong } from "./matchup.ts";
import { fill, voiceOf } from "./locales.ts";
import { localizedLayout } from "./render.ts";
import { roundLabel } from "./rounds.ts";
import { esc } from "./text.ts";

export interface TableOptions extends Pick<DrawOptions, "locale" | "words" | "teamName" | "roundNames"> {
  /** The table's caption. Default: the summary ("16 teams, 4 rounds"). */
  caption?: string;
  /** A class for the `<table>`. Default `tb-table`. */
  className?: string;
}

/**
 * The bracket as an HTML table, for a reader the drawing does not serve: one row for every tie, round by round, with the
 * two sides, the score, the winner in bold, the date where the tie has one (written as the language writes dates) and a note.
 * It is a plain, valid `<table>` with a caption and header cells, in the language of `locale`.
 */
export function bracketTable(input: BracketLayout | readonly Matchup[] | BracketInput, options: TableOptions = {}): string {
  const v = voiceOf(options);
  const layout = localizedLayout("ties" in (input as object) && "rounds" in (input as object) ? (input as BracketLayout) : layoutBracket(input as readonly Matchup[] | BracketInput), v);
  const w = v.words;
  const caption = options.caption ?? fill(layout.rounds === 1 ? w.summaryOne : w.summary, { n: v.number(layout.teams.length), r: v.number(layout.rounds) });
  const order = layout.ties
    .filter((t) => t.round > 0 || layout.robin.includes(t.index) || layout.playIn.includes(t.index))
    .sort((a, b) => Number(a.third) - Number(b.third) || a.round - b.round || (a.date < b.date ? -1 : a.date > b.date ? 1 : a.index - b.index));
  const dated = order.some((t) => v.date(t.date) !== null);
  const name = (t: Tie, k: 0 | 1) => {
    const team = t.sides[k];
    const text = team ? esc(team.name) : esc(w.tbd);
    return t.winner === k ? `<strong>${text}</strong>` : text;
  };
  const score = (t: Tie) => (t.result.score ? fill(w.scoreText, { a: v.number(t.result.score[0]), b: v.number(t.result.score[1]) }) : "");
  // Where a side comes from, in words, when the tie says so: "Loser of A v B".
  const named = (i: number) => fill(w.tieVs, { a: layout.ties[i].sides[0]?.name ?? w.tbd, b: layout.ties[i].sides[1]?.name ?? w.tbd });
  const origins = (t: Tie): string[] => (t.from ?? []).flatMap((s) => (s ? [fill(s.result === "loser" ? w.loserOf : w.winnerOf, { name: named(s.tie) })] : []));
  const rows = order.map((t) => {
    const roundText = t.third ? w.thirdPlace : t.playIn ? w.playIn : t.round === 0 ? "" : roundLabel(layout, t.round, options.roundNames, v);
    const date = dated ? `<td>${esc(v.date(t.date) ?? "")}</td>` : "";
    return `<tr><th scope="row">${esc(roundText)}</th>${date}<td>${name(t, 0)}</td><td>${esc(score(t))}</td><td>${name(t, 1)}</td><td>${esc([...noteLong(t, v), ...origins(t)].join(w.noteJoin))}</td></tr>`;
  });
  return [
    `<table class="${esc(options.className ?? "tb-table")}" lang="${esc(v.locale.code)}">`,
    `<caption>${esc(caption)}</caption>`,
    `<thead><tr><th scope="col">${esc(w.columnRound)}</th>${dated ? `<th scope="col">${esc(w.columnDate)}</th>` : ""}<th scope="col" colspan="3">${esc(w.columnTie)}</th><th scope="col">${esc(w.columnNote)}</th></tr></thead>`,
    `<tbody>${rows.join("")}</tbody>`,
    "</table>",
  ].join("\n");
}
