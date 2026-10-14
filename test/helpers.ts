import { playOut } from "../demo/play.js";
import * as T from "../src/index.ts";
import type { Matchup, Team } from "../src/index.ts";

/** A finished single-elimination bracket of `n` seeded teams: the better seed always wins. */
export function finished(n: number, options: T.SingleEliminationOptions = {}): { teams: Team[]; matchups: Matchup[] } {
  const teams: Team[] = Array.from({ length: n }, (_, i) => ({ id: `T${i + 1}`, name: `Team ${i + 1}`, seed: i + 1 }));
  const made = T.singleElimination(teams, options);
  return { teams: made.teams, matchups: playOut(T, made.matchups, made.teams) as Matchup[] };
}

/** Checks that a string is well-formed XML of the kind a drawing makes: tags nest and close, attributes are quoted. */
export function wellFormed(xml: string): string | null {
  const stack: string[] = [];
  const tag = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+(?:="[^"]*")?)*)\s*(\/?)>/g;
  let rest = xml;
  let last = 0;
  for (let m = tag.exec(xml); m; m = tag.exec(xml)) {
    const between = xml.slice(last, m.index);
    if (/[<>]/.test(between.replace(/&[a-z]+;/g, ""))) return `stray < or > near ${JSON.stringify(between.slice(0, 40))}`;
    last = m.index + m[0].length;
    if (m[4]) continue;
    if (m[1]) { const open = stack.pop(); if (open !== m[2]) return `</${m[2]}> closes <${open}>`; } else stack.push(m[2]);
  }
  rest = xml.slice(last);
  if (/[<>]/.test(rest)) return "stray < or > at the end";
  return stack.length ? `unclosed <${stack.at(-1)}>` : null;
}
