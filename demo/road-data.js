// The demo's "Road to the final" section, and the finalists the tests of `roadToFinal` and of the round mark are made from. Everything here is real: the results of the men's
// World Cups of 2022 and 2026 and of the 2024 Stanley Cup playoffs, read from spxn.com's public API by scripts/fetch-demo-data.mjs into demo/data/ (sources and terms: NOTICE.md),
// and the round flags are Hata's (demo/flags-data.js). Nothing is made up. The rows hold the knockout rounds only, so a road has no group stage to draw.
import { WORLD_CUPS } from "./data/worldcup-1938-2022.js";
import { WORLD_CUP_2026 } from "./data/worldcup-2026.js";
import { CODE } from "./data.js";

/** The knockout rounds of the rows, by the key a road uses, the earliest first. */
const ROUNDS = { round_of_32: "round-of-32", round_of_16: "round-of-16", quarter: "quarter-final", semi: "semi-final" };
const ORDER = Object.keys(ROUNDS);

/** The matches of the men's World Cups of 2022 and 2026 as the rows came: one list each, every row a knockout match with its teams, score, extra time and shoot-out. */
export const WORLD_CUP_ROWS = Object.freeze({ wc2022: WORLD_CUPS.wc2022, wc2026: WORLD_CUP_2026.matches });

/** A team of a row as a road team: its name, FIFA's three letters, and the region code that Hata's flag and `countryName` go by. */
const teamOf = (row, side) => ({ name: row[side], abbr: CODE[row[side]], ...(row[`${side}_flag`] ? { region: row[`${side}_flag`], flag: row[`${side}_flag`] } : {}) });

/** The goals of a row from the side of `id`: [for, against], and its shoot-out likewise. */
const fromSide = (row, id, pair) => (row.home_team_id === id ? pair : [pair[1], pair[0]]);

/** How a row was decided, written as a road match: extra time (AET), or a shoot-out (with its number, the finalist's first). */
const decision = (row, id) => (row.shootout ? { decidedBy: "pens", pens: fromSide(row, id, [row.home_penalties, row.away_penalties]) } : row.extra_time ? { decidedBy: "aet" } : {});

/**
 * The two finalists of a World Cup, each with the knockout matches on the way (the earliest first), and the final, all from the rows of `WORLD_CUP_ROWS`.
 * The finalists are the two sides of the final, the home side of the row first.
 */
export function roadFinalists(rows) {
  const final = rows.find((row) => row.stage_key === "final");
  if (!final) throw new Error("the rows have no final");
  const finalist = (side) => {
    const id = final[`${side}_team_id`];
    const path = rows
      .filter((row) => ROUNDS[row.stage_key] && (row.home_team_id === id || row.away_team_id === id))
      .sort((a, b) => ORDER.indexOf(a.stage_key) - ORDER.indexOf(b.stage_key))
      .map((row) => {
        const mine = row.home_team_id === id ? "home" : "away";
        const theirs = mine === "home" ? "away" : "home";
        return { round: ROUNDS[row.stage_key], opponent: teamOf(row, theirs), score: fromSide(row, id, [row.home_goals, row.away_goals]), ...decision(row, id) };
      });
    return { ...teamOf(final, side), path };
  };
  const finalScore = [final.home_goals, final.away_goals];
  return { finalists: [finalist("home"), finalist("away")], final: { score: finalScore, ...decision(final, final.home_team_id) } };
}

/** The name of the team that won the final, as the data names it: the side whose id the final's row gives as `winner_team_id`. */
export const winnerOf = (rows) => {
  const final = rows.find((row) => row.stage_key === "final");
  return final.home_team_id === final.winner_team_id ? final.home : final.away;
};

/**
 * What the demo draws under "The road to the final": four cards, each from one of the demo's examples (`example`, the key in demo/examples.js; its `data` is the tournament)
 * with the card's size, look, background and the line at its foot that credits the data. The title and the names of the rounds are the example's own.
 */
export const ROAD_CARDS = Object.freeze([
  { key: "card", example: "wc2022", size: "card", background: "royal", endnote: "Results: Fjelstul World Cup Database, CC BY-SA 4.0" },
  { key: "wide", example: "poster", size: "wide", background: "floodlights", endnote: "Results: openfootball, CC0" },
  { key: "phone", example: "poster", size: "phone", theme: "dark", background: "aurora", endnote: "Results: openfootball, CC0" },
  { key: "series", example: "nhl2024", size: "square", background: "carbon", endnote: "Results: the NHL, via spxn.com" },
]);
