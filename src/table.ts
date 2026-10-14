import type { BracketInput, BracketLayout, DrawOptions, Matchup, Tie, Words } from "./types.ts";
import { layoutBracket } from "./layout.ts";
import { noteParts } from "./matchup.ts";
import { roundLabel } from "./rounds.ts";
import { esc } from "./text.ts";
import { fill, wordsWith } from "./words.ts";

export interface TableOptions {
  words?: Partial<Words>;
  roundNames?: DrawOptions["roundNames"];
  /** The table's caption. Default: the summary ("16 teams, 4 rounds"). */
  caption?: string;
  /** A class for the `<table>`. Default `tb-table`. */
  className?: string;
}

/**
 * The bracket as an HTML table, for a reader the drawing does not serve: one row for every tie, round by round, with the
 * two sides, the score, the winner in bold and a note. It is a plain, valid `<table>` with a caption and header cells.
 */
export function bracketTable(input: BracketLayout | readonly Matchup[] | BracketInput, options: TableOptions = {}): string {
  const layout = "ties" in (input as object) && "rounds" in (input as object) ? (input as BracketLayout) : layoutBracket(input as readonly Matchup[] | BracketInput);
  const words = wordsWith(options.words);
  const caption = options.caption ?? fill(words.summary, { n: layout.teams.length, r: layout.rounds });
  const order = layout.ties
    .filter((t) => t.round > 0 || layout.robin.includes(t.index))
    .sort((a, b) => Number(a.third) - Number(b.third) || a.round - b.round || (a.date < b.date ? -1 : a.date > b.date ? 1 : a.index - b.index));
  const name = (t: Tie, k: 0 | 1) => {
    const team = t.sides[k];
    const text = team ? esc(team.name) : esc(words.tbd);
    return t.winner === k ? `<strong>${text}</strong>` : text;
  };
  const score = (t: Tie) => (t.result.score ? `${t.result.score[0]}–${t.result.score[1]}` : "");
  const rows = order.map((t) => {
    const roundText = t.third ? words.thirdPlace : t.round === 0 ? "" : roundLabel(layout, t.round, options.roundNames, words);
    const note = noteParts(t, words).map((part) => (part === words.pens && t.result.pens ? `${words.pens} ${t.result.pens[0]}–${t.result.pens[1]}` : part)).join(", ");
    return `<tr><th scope="row">${esc(roundText)}</th><td>${name(t, 0)}</td><td>${esc(score(t))}</td><td>${name(t, 1)}</td><td>${esc(note)}</td></tr>`;
  });
  return [
    `<table class="${esc(options.className ?? "tb-table")}">`,
    `<caption>${esc(caption)}</caption>`,
    `<thead><tr><th scope="col">${esc(words.columnRound)}</th><th scope="col" colspan="3">${esc(words.columnTie)}</th><th scope="col">${esc(words.columnNote)}</th></tr></thead>`,
    `<tbody>${rows.join("")}</tbody>`,
    "</table>",
  ].join("\n");
}
