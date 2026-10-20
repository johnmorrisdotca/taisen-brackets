// Made-up medals for the demo and the docs: no result here is real. Each event of each Games gives a gold, a silver and two bronze medals to countries picked by a small fixed
// generator from the countries taking part that year (the former countries only in the years they existed), so that the table can be filtered by sport, weight class and Games.
// The countries are only there for the flags and the badges: a former country has no flag in Hata, so its row is drawn as a badge with its code.
const MODERN = [
  ["France", "FR", "FRA"], ["Japan", "JP", "JPN"], ["Georgia", "GE", "GEO"], ["South Korea", "KR", "KOR"], ["Brazil", "BR", "BRA"], ["Uzbekistan", "UZ", "UZB"], ["Cuba", "CU", "CUB"],
  ["Netherlands", "NL", "NED"], ["Germany", "DE", "GER"], ["Spain", "ES", "ESP"], ["Italy", "IT", "ITA"], ["Azerbaijan", "AZ", "AZE"], ["Mongolia", "MN", "MGL"], ["Canada", "CA", "CAN"],
  ["United States", "US", "USA"], ["Hungary", "HU", "HUN"],
].map(([name, flag, code]) => ({ name, flag, code }));
const FORMER = {
  URS: { name: "Soviet Union", code: "URS", note: "1922–1991" },
  FRG: { name: "West Germany", code: "FRG", note: "1949–1990" },
  TCH: { name: "Czechoslovakia", code: "TCH", note: "1918–1992" },
  YUG: { name: "Yugoslavia", code: "YUG", note: "1918–1992" },
  EUN: { name: "Unified Team", code: "EUN", note: "1992 only" },
};
const GAMES = {
  1984: [FORMER.FRG, FORMER.TCH, FORMER.YUG],
  1988: [FORMER.URS, FORMER.FRG, FORMER.TCH, FORMER.YUG],
  1992: [FORMER.EUN, FORMER.TCH, FORMER.YUG],
  2000: [], 2008: [], 2016: [], 2024: [],
};
const EVENTS = [["judo", "-66 kg"], ["judo", "-100 kg"], ["judo", "+100 kg"], ["wrestling", "-65 kg"], ["wrestling", "-97 kg"]];

let seed = 20261020;
const next = (n) => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed % n; };

/** Every medal of the made-up Games, in order: { name, flag?, code, note?, medal, sport, category, games }. */
export const MEDAL_AWARDS = [];
for (const [games, former] of Object.entries(GAMES)) {
  const pool = [...MODERN.slice(0, 10), ...former, ...former];
  for (const [sport, category] of EVENTS) {
    const taken = new Set();
    for (const medal of ["gold", "silver", "bronze", "bronze"]) {
      let who;
      do who = pool[next(pool.length)]; while (taken.has(who.name));
      taken.add(who.name);
      MEDAL_AWARDS.push({ ...who, medal, sport, category, games: Number(games) });
    }
  }
}
export const MEDAL_SPORTS = ["judo", "wrestling"];
export const MEDAL_CATEGORIES = { judo: ["-66 kg", "-100 kg", "+100 kg"], wrestling: ["-65 kg", "-97 kg"] };
export const MEDAL_GAMES = Object.keys(GAMES).map(Number);
