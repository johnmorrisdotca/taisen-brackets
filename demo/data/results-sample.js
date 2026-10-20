// Made-up results for the demo and the docs: every name, country pairing and number is invented (any likeness to a real athlete or result is by chance), and the countries are only there
// for the flags. A board is a graphic of the made-up final of an event; the records are badges to show the shape, not claims.
const row = (rank, code, flag, name, values, extra = {}) => ({ rank, code, flag, name, values, ...extra });

export const RESULTS_SAMPLE = {
  // Women's vault final: two vaults and the average, a red box for each rank.
  apparatus: {
    title: "Apparatus final women",
    phase: "Vault",
    columns: [{ label: "Vault 1", precision: 3 }, { label: "Vault 2", precision: 3 }, { label: "Score", precision: 3 }],
    rows: [
      row(1, "PRK", "KP", "H. Un-jong", [15.55, 15.75, 15.65]),
      row(2, "GER", "DE", "O. Kruse", [15.725, 15.425, 15.575]),
      row(3, "CHN", "CN", "C. Fang", [16.075, 15.05, 15.562]),
      row(4, "USA", "US", "A. Sandoval", [15.75, 15.325, 15.537]),
      row(5, "SUI", "CH", "E. Kaufmann", [15.4, 14.7, 15.05]),
      row(6, "ITA", "IT", "C. Giorgetti", [14.925, 14.175, 14.55]),
      row(7, "BRA", "BR", "J. Barros", [14.725, 14.25, 14.487]),
      row(8, "SWE", "SE", "A. Lindgren", [15.625, 0, 7.812]),
    ],
  },
  // Individual all-around: one score to three decimals, plain numerals.
  allAround: {
    title: "Individual all-around women",
    columns: [{ precision: 3 }],
    rows: [
      row(1, "USA", "US", "Carly Petersen", [38.387]),
      row(2, "POL", "PL", "Svetlana Marchenko", [38.211]),
      row(3, "CHN", "CN", "Zhang Lan", [38.049]),
      row(4, "FRA", "FR", "Anna Pavlova", [38.024]),
      row(5, "ROU", "RO", "Nicoleta D. Sofronie", [37.948]),
      row(6, "UKR", "UA", "Irina Yarotska", [37.687]),
      row(7, "FRA", "FR", "Marine Debaux", [37.361]),
      row(8, "AUT", "AT", "Elena Gruber", [37.299]),
    ],
  },
  // A swimming final: times to two decimals, a record badge.
  swimming: {
    title: "Men's 100m butterfly",
    phase: "Results · Final",
    columns: [{ precision: 2 }],
    rows: [
      row(1, "USA", "US", "Michael Phillips", [50.58], { record: "OR" }),
      row(2, "HUN", "HU", "Laszlo Czigany", [50.59]),
      row(3, "AUS", "AU", "Andrew Lauterman", [51.12]),
      row(4, "USA", "US", "Ian Crockett", [51.13]),
      row(5, "KEN", "KE", "Jason Dunford", [51.47]),
      row(6, "JPN", "JP", "Takuro Fujita", [51.5]),
      row(7, "UKR", "UA", "Andrii Serdinov", [51.59]),
      row(8, "PNG", "PG", "Ryan Pinelli", [51.86]),
    ],
  },
  // Athletics 100 m: reaction time and time, a national record badge and a withdrawal.
  athletics: {
    title: "Men's 100m",
    phase: "Final · Wind +0.3",
    columns: [{ label: "React", precision: 3 }, { label: "Time", precision: 2 }],
    rows: [
      row(1, "JAM", "JM", "Usain Bolten", [0.146, 9.63], { record: ["OR"] }),
      row(2, "USA", "US", "Yohan Blakely", [0.165, 9.75], { record: "NR" }),
      row(3, "USA", "US", "Justin Garland", [0.152, 9.79]),
      row(4, "FRA", "FR", "Christophe Lemoine", [0.167, 9.8], { record: "NR" }),
      row(5, "JAM", "JM", "Asafa Powers", [0.134, 9.88]),
      row(6, "GBR", "GB", "Dwain Chambers", [0.15, 9.99]),
      row(7, "TTO", "TT", "Richard Thompsen", [0.163, 10.04]),
      row("DQ", "CAN", "CA", "Andre De Grassi", [], { note: "DQ" }),
    ],
  },
  // Speed skating: times with minutes as text, a world record badge.
  skating: {
    title: "Women's 1000m",
    phase: "Final",
    columns: [{ label: "Time" }],
    rows: [
      row(1, "NED", "NL", "Ireen van der Meer", ["1:14.61"], { record: "WR" }),
      row(2, "JPN", "JP", "Nao Kodama", ["1:14.84"]),
      row(3, "CAN", "CA", "Brianne Tutt", ["1:15.02"]),
      row(4, "NOR", "NO", "Ida Njaa", ["1:15.31"], { record: "NR" }),
      row(5, "KOR", "KR", "Sang-hwa Lee", ["1:15.44"]),
      row(6, "USA", "US", "Heather Richards", ["1:15.73"]),
      row(7, "GER", "DE", "Jennifer Rodenbeck", ["1:15.97"]),
      row(8, "POL", "PL", "Karolina Bosiek", ["1:16.20"]),
    ],
  },
};

/** A made-up bout presentation (a wrestling bout): the athletes, the referee and the judges are invented. */
export const BOUT_SAMPLE = {
  title: "Women's 57-60 kg",
  phase: "Preliminaries",
  bout: 142,
  red: { code: "BRA", flag: "BR", name: "TAVARES M." },
  blue: { code: "USA", flag: "US", name: "MAYER M." },
  officials: [
    { role: "referee", code: "MGL", flag: "MN", name: "KHISHIGEE Khas-Erdene" },
    { code: "POL", flag: "PL", name: "GORNY Mariusz" },
    { code: "KAZ", flag: "KZ", name: "RYSBAYEV Rakhymzhan" },
    { code: "DEN", flag: "DK", name: "BEDEMANN Claus" },
    { code: "ALG", flag: "DZ", name: "SIDI YAKOUB Kheira" },
    { code: "FRA", flag: "FR", name: "MADFOUA Fathi" },
  ],
};

/** A made-up medal table of ten countries for the broadcast style: the numbers are invented. */
export const MEDALS_SAMPLE = {
  subtitle: "Day 16",
  date: "Games",
  rows: [
    ["United States", "USA", "US", 46, 29, 29], ["China", "CHN", "CN", 38, 27, 22], ["Great Britain", "GBR", "GB", 29, 17, 19], ["Japan", "JPN", "JP", 24, 25, 33], ["South Korea", "KOR", "KR", 13, 8, 7],
    ["Germany", "GER", "DE", 11, 19, 14], ["France", "FRA", "FR", 11, 11, 12], ["Italy", "ITA", "IT", 8, 9, 11], ["Hungary", "HUN", "HU", 8, 4, 5], ["Netherlands", "NED", "NL", 0, 1, 0],
  ].map(([name, code, flag, gold, silver, bronze]) => ({ name, code, flag, gold, silver, bronze })),
};
