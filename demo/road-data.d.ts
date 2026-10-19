import type { RoadFinal, RoadFinalist } from "../src/index.ts";

/** A knockout match of a World Cup as read from spxn.com (the fields of `soccer_matches` the demo keeps). */
export interface WorldCupRow {
  match_number: number;
  match_date: string;
  kickoff_local: string | null;
  stage_key: string;
  home_team_id: string;
  home: string;
  home_flag: string | null;
  home_goals: number;
  away_team_id: string;
  away: string;
  away_flag: string | null;
  away_goals: number;
  extra_time: boolean;
  shootout: boolean;
  home_penalties: number | null;
  away_penalties: number | null;
  winner_team_id: string | null;
  is_replay: boolean;
  source: string;
}
export const WORLD_CUP_ROWS: Readonly<{ wc2022: readonly WorldCupRow[]; wc2026: readonly WorldCupRow[] }>;
export function roadFinalists(rows: readonly WorldCupRow[]): { finalists: [RoadFinalist, RoadFinalist]; final: RoadFinal };
export function winnerOf(rows: readonly WorldCupRow[]): string;
export interface RoadCard { key: "card" | "wide" | "phone" | "series"; example: string; size: "card" | "square" | "wide" | "phone"; theme?: "dark"; background: string; endnote: string }
export const ROAD_CARDS: readonly RoadCard[];
