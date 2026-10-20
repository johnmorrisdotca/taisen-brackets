// A made-up men's -66 kg tournament of 16 athletes, for the demo and the docs: every name is invented (any likeness to a real athlete is by chance) and the countries
// are only there for the flags. The results are written by hand to show every kind of ending the rules allow (scripts and tests rely on them staying as they are).
export const JUDO_SAMPLE = {
  category: { sex: "men", weight: "-66" },
  // In seed order.
  athletes: [
    { id: "J01", name: "Daiki Hoshino", flag: "JP", code: "JPN" }, { id: "J02", name: "Mathis Roussel", flag: "FR", code: "FRA" }, { id: "J03", name: "Levan Mtchedlishvili", flag: "GE", code: "GEO" }, { id: "J04", name: "Min-jae Seong", flag: "KR", code: "KOR" },
    { id: "J05", name: "Rafael Tavares", flag: "BR", code: "BRA" }, { id: "J06", name: "Jasur Rakhimov", flag: "UZ", code: "UZB" }, { id: "J07", name: "Tomás Zaldívar", flag: "CU", code: "CUB" }, { id: "J08", name: "Joris van Dijk", flag: "NL", code: "NED" },
    { id: "J09", name: "Emil Hartmann", flag: "DE", code: "GER" }, { id: "J10", name: "Alonso Caballero", flag: "ES", code: "ESP" }, { id: "J11", name: "Gianluca Ferraro", flag: "IT", code: "ITA" }, { id: "J12", name: "Elnur Qasimov", flag: "AZ", code: "AZE" },
    { id: "J13", name: "Temuulen Batsaikhan", flag: "MN", code: "MGL" }, { id: "J14", name: "Owen Callahan", flag: "CA", code: "CAN" }, { id: "J15", name: "Marcus Whitfield", flag: "US", code: "USA" }, { id: "J16", name: "Balázs Kertész", flag: "HU", code: "HUN" },
  ],
  // Each contest, in the order it is fought: [id, the winner, what the winner scored, what the loser scored, the rest of the result].
  fights: [
    ["J1-1", "J01", { ippon: true }, {}, { time: "1:12" }],
    ["J1-2", "J09", { wazaAri: 1 }, { yuko: 1 }, { goldenScore: true, time: "5:40" }],
    ["J1-3", "J04", { yuko: 2 }, { shido: 1 }, { time: "4:00" }],
    ["J1-4", "J05", { wazaAri: 2 }, {}, { time: "3:10" }],
    ["J1-5", "J02", { ippon: true }, { shido: 1 }, { time: "0:48" }],
    ["J1-6", "J10", { yuko: 1 }, { shido: 3 }, { time: "2:55" }],
    ["J1-7", "J03", {}, {}, { method: "fusen-gachi" }],
    ["J1-8", "J06", { wazaAri: 1 }, { shido: 2 }, { time: "4:00" }],
    ["J2-1", "J01", { ippon: true }, {}, { time: "2:30" }],
    ["J2-2", "J05", { yuko: 1 }, { shido: 1 }, { time: "4:00" }],
    ["J2-3", "J02", { wazaAri: 1 }, { yuko: 1 }, { goldenScore: true, time: "6:05" }],
    ["J2-4", "J06", { wazaAri: 1 }, { shido: 1 }, { method: "kiken-gachi", time: "1:50" }],
    ["J3-1", "J01", { ippon: true }, { yuko: 1 }, { time: "3:21" }],
    ["J3-2", "J06", { wazaAri: 1 }, {}, { time: "4:00" }],
    ["J4-1", "J01", { wazaAri: 1, yuko: 1 }, { wazaAri: 1 }, { goldenScore: true, time: "7:02" }],
    ["Jrep-1", "J04", { ippon: true }, {}, { time: "2:05" }],
    ["Jrep-2", "J03", { yuko: 1 }, { shido: 2 }, { time: "4:00" }],
    ["Jbronze-1", "J02", { ippon: true }, { yuko: 2 }, { time: "3:40" }],
    ["Jbronze-2", "J05", { wazaAri: 1 }, { shido: 1 }, { time: "4:00" }],
  ],
};
