// Made-up rankings for the demo and the docs: every name, club and number is invented (any likeness to a real athlete or club is by chance), and the flags are
// only there to show a country's and a Canadian province's. The shape is a provincial feed: age group and weight, a club, points to two decimals, and the movement since the last list.
export const RANKING_SAMPLE = {
  title: "Provincial ranking",
  source: "Sample data, invented for the demo",
  lists: {
    // Men's under-18 -60 kg: a podium, a tie at 10, a newly ranked athlete and every kind of movement.
    "u18-men-60": {
      category: { age: "U18", sex: "men", weight: "-60" },
      date: "October 2026",
      entries: [
        { name: { surname: "Nakamura", given: "Kenji" }, club: "Coastal Pine Judo", flag: "CA-BC", country: "British Columbia", points: 412.5, change: 1 },
        { name: { surname: "Brar", given: "Harpreet" }, club: "Salmonberry Judo Club", flag: "CA-BC", country: "British Columbia", points: 398, change: -1 },
        { name: { surname: "Leclerc", given: "Mathieu" }, club: "Kestrel Valley Judo", flag: "CA-QC", country: "Quebec", points: 366.25, change: 4 },
        { name: { surname: "Okafor", given: "Daniel" }, club: "Thornwood Judo Club", flag: "CA-BC", country: "British Columbia", points: 351, change: 0 },
        { name: { surname: "Whitehorse", given: "Eli" }, club: "Driftwood Judo Academy", flag: "CA-AB", country: "Alberta", points: 340.75, change: -2 },
        { name: { surname: "Sandhu", given: "Arjun" }, club: "Bluebell Judo", flag: "CA-BC", country: "British Columbia", points: 322, change: 3 },
        { name: { surname: "Lindqvist", given: "Oskar" }, club: "Harbour Lights Judo", flag: "CA-BC", country: "British Columbia", points: 301.5, change: -3 },
        { name: { surname: "Fontaine", given: "Étienne" }, club: "Kestrel Valley Judo", flag: "CA-ON", country: "Ontario", points: 288, change: 12 },
        { name: { surname: "Tanaka", given: "Ren" }, club: "Coastal Pine Judo", flag: "CA-BC", country: "British Columbia", points: 270.25, change: -1 },
        { name: { surname: "Moreau", given: "Jules" }, club: "Salmonberry Judo Club", flag: "CA-BC", country: "British Columbia", points: 255, change: "new" },
        { name: { surname: "Haddad", given: "Karim" }, club: "Thornwood Judo Club", flag: "CA-BC", country: "British Columbia", points: 255, change: 2 },
        { name: { surname: "Gunnarsson", given: "Nils" }, club: "Driftwood Judo Academy", flag: "CA-NL", country: "Newfoundland and Labrador", points: 241.5, change: -4 },
        { name: { surname: "Pereira", given: "Tiago" }, club: "Bluebell Judo", flag: "CA-BC", country: "British Columbia", points: 230, change: 0 },
        { name: { surname: "Ishikawa", given: "Sota" }, club: "Harbour Lights Judo", flag: "CA-BC", country: "British Columbia", points: 218.75, change: 1 },
        { name: { surname: "Dubois", given: "Hugo" }, club: "Kestrel Valley Judo", flag: "CA-QC", country: "Quebec", points: 205, change: "new" },
      ],
    },
    // Women's senior -57 kg with a champion above the ranks, as a division list.
    "senior-women-57": {
      category: { sex: "women", weight: "-57" },
      date: "October 2026",
      entries: [
        { name: { surname: "Aoki", given: "Mio" }, club: "Coastal Pine Judo", flag: "CA-BC", champion: true, points: 520 },
        { name: { surname: "Delacroix", given: "Camille" }, club: "Kestrel Valley Judo", flag: "CA-QC", points: 488, change: 0 },
        { name: { surname: "Grewal", given: "Simran" }, club: "Salmonberry Judo Club", flag: "CA-BC", points: 463.5, change: 2 },
        { name: { surname: "Hartley", given: "Maren" }, club: "Thornwood Judo Club", flag: "CA-BC", points: 431, change: -1 },
        { name: { surname: "Nowak", given: "Zofia" }, club: "Driftwood Judo Academy", flag: "CA-AB", points: 402.25, change: 1 },
        { name: { surname: "Yamada", given: "Haruka" }, club: "Harbour Lights Judo", flag: "CA-BC", points: 389, change: -2 },
        { name: { surname: "Boucher", given: "Léa" }, club: "Kestrel Valley Judo", flag: "CA-ON", points: 360.5, change: 5 },
        { name: { surname: "Castellano", given: "Isabel" }, club: "Bluebell Judo", flag: "CA-BC", points: 344, change: -3 },
        { name: { surname: "Kowalski", given: "Anna" }, club: "Coastal Pine Judo", flag: "CA-BC", points: 320, change: "new" },
        { name: { surname: "Singh", given: "Priya" }, club: "Thornwood Judo Club", flag: "CA-BC", points: 301.75, change: -1 },
      ],
    },
  },
  // The number one of each senior men's weight class.
  numberOnes: [
    { category: "-60 kg", entry: { name: { surname: "Nakamura", given: "Kenji" }, club: "Coastal Pine Judo", flag: "CA-BC", points: 1240 } },
    { category: "-66 kg", entry: { name: { surname: "Leclerc", given: "Mathieu" }, club: "Kestrel Valley Judo", flag: "CA-QC", points: 1175 } },
    { category: "-73 kg", entry: { name: { surname: "Brar", given: "Harpreet" }, club: "Salmonberry Judo Club", flag: "CA-BC", points: 1098 } },
    { category: "-81 kg", entry: { name: { surname: "Whitehorse", given: "Eli" }, club: "Driftwood Judo Academy", flag: "CA-AB", points: 1066 } },
    { category: "-90 kg", entry: { name: { surname: "Lindqvist", given: "Oskar" }, club: "Harbour Lights Judo", flag: "CA-BC", points: 1012 } },
    { category: "+100 kg", entry: { name: { surname: "Okafor", given: "Daniel" }, club: "Thornwood Judo Club", flag: "CA-BC", points: 985 } },
  ],
  // An event's entry list in the order of the draw, with each athlete's ranking (none: not ranked).
  entryList: {
    event: "Invitational",
    entries: [
      { name: { surname: "Hoshino", given: "Daiki" }, code: "JPN", flag: "JP", rank: 3 },
      { name: { surname: "Roussel", given: "Mathis" }, code: "FRA", flag: "FR", rank: 9 },
      { name: { surname: "Mtchedlishvili", given: "Levan" }, code: "GEO", flag: "GE", rank: 1 },
      { name: { surname: "Seong", given: "Min-jae" }, code: "KOR", flag: "KR", rank: 12 },
      { name: { surname: "Tavares", given: "Rafael" }, code: "BRA", flag: "BR", rank: 17 },
      { name: { surname: "Rakhimov", given: "Jasur" }, code: "UZB", flag: "UZ", rank: 4 },
      { name: { surname: "Zaldívar", given: "Tomás" }, code: "CUB", flag: "CU", rank: 25 },
      { name: { surname: "van Dijk", given: "Joris" }, code: "NED", flag: "NL", rank: 31 },
      { name: { surname: "Hartmann", given: "Emil" }, code: "GER", flag: "DE", rank: 8 },
      { name: { surname: "Caballero", given: "Alonso" }, code: "ESP", flag: "ES", rank: 14 },
      { name: { surname: "Ferraro", given: "Gianluca" }, code: "ITA", flag: "IT", rank: 21 },
      { name: { surname: "Qasimov", given: "Elnur" }, code: "AZE", flag: "AZ", rank: 6 },
      { name: { surname: "Batsaikhan", given: "Temuulen" }, code: "MGL", flag: "MN", rank: 11 },
      { name: { surname: "Callahan", given: "Owen" }, code: "CAN", flag: "CA", rank: 18 },
      { name: { surname: "Whitfield", given: "Marcus" }, code: "USA", flag: "US" },
      { name: { surname: "Kertész", given: "Balázs" }, code: "HUN", flag: "HU", rank: 27 },
    ],
  },
};
