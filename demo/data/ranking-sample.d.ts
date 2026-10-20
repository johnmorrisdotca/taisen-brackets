import type { RankingCard, RankingEntry, RankingMeeting } from "../../src/index.ts";
interface SampleList { category: { age?: string; sex?: "men" | "women"; weight?: string }; date: string; entries: RankingEntry[] }
export const RANKING_SAMPLE: {
  title: string;
  source: string;
  lists: { "u18-men-60": SampleList; "senior-women-57": SampleList };
  numberOnes: RankingCard[];
  entryList: { event: string; entries: RankingEntry[] };
  matchup: { category: string; event: string; a: RankingEntry; b: RankingEntry; meetings: RankingMeeting[] };
};
