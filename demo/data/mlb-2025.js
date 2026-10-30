// The 2025 MLB postseason as series: who played whom, each club's seed in its league, and the games each side won. Typed from the series results on
// English Wikipedia's "2025 Major League Baseball postseason" (CC BY-SA 4.0; only the facts are used), checked 2026-10-30. No logos: each club is its letters on its colour.
export const MLB_2025 = {
  retrieved: "2026-10-30",
  teams: [
    { id: "TOR", name: "Toronto Blue Jays", abbr: "TOR", color: "#134a8e", group: "American League", seed: 1 },
    { id: "SEA", name: "Seattle Mariners", abbr: "SEA", color: "#005c5c", group: "American League", seed: 2 },
    { id: "CLE", name: "Cleveland Guardians", abbr: "CLE", color: "#e31937", group: "American League", seed: 3 },
    { id: "NYY", name: "New York Yankees", abbr: "NYY", color: "#0c2340", group: "American League", seed: 4 },
    { id: "BOS", name: "Boston Red Sox", abbr: "BOS", color: "#bd3039", group: "American League", seed: 5 },
    { id: "DET", name: "Detroit Tigers", abbr: "DET", color: "#0c2340", group: "American League", seed: 6 },
    { id: "MIL", name: "Milwaukee Brewers", abbr: "MIL", color: "#12284b", group: "National League", seed: 1 },
    { id: "PHI", name: "Philadelphia Phillies", abbr: "PHI", color: "#e81828", group: "National League", seed: 2 },
    { id: "LAD", name: "Los Angeles Dodgers", abbr: "LAD", color: "#005a9c", group: "National League", seed: 3 },
    { id: "CHC", name: "Chicago Cubs", abbr: "CHC", color: "#0e3386", group: "National League", seed: 4 },
    { id: "SD", name: "San Diego Padres", abbr: "SD", color: "#2f241d", group: "National League", seed: 5 },
    { id: "CIN", name: "Cincinnati Reds", abbr: "CIN", color: "#c6011f", group: "National League", seed: 6 },
  ],
  series: [
    { id: "al-wc1", round: 1, bestOf: 3, sides: ["CLE", "DET"], score: [1, 2] },
    { id: "al-wc2", round: 1, bestOf: 3, sides: ["NYY", "BOS"], score: [2, 1] },
    { id: "nl-wc1", round: 1, bestOf: 3, sides: ["LAD", "CIN"], score: [2, 0] },
    { id: "nl-wc2", round: 1, bestOf: 3, sides: ["CHC", "SD"], score: [2, 1] },
    { id: "al-ds1", round: 2, bestOf: 5, sides: ["TOR", "NYY"], score: [3, 1] },
    { id: "al-ds2", round: 2, bestOf: 5, sides: ["SEA", "DET"], score: [3, 2] },
    { id: "nl-ds1", round: 2, bestOf: 5, sides: ["MIL", "CHC"], score: [3, 2] },
    { id: "nl-ds2", round: 2, bestOf: 5, sides: ["PHI", "LAD"], score: [1, 3] },
    { id: "alcs", round: 3, bestOf: 7, sides: ["TOR", "SEA"], score: [4, 3] },
    { id: "nlcs", round: 3, bestOf: 7, sides: ["MIL", "LAD"], score: [0, 4] },
    { id: "ws", round: 4, bestOf: 7, sides: ["TOR", "LAD"], score: [3, 4] },
  ],
};
