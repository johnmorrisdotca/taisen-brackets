import { drawBracket, layoutBracket, type DrawOptions, type Matchup } from "@johnmorrisdotca/taisen-brackets";

const matchups: Matchup[] = [
  { sides: ["Aurora", "Harbour"], score: [2, 1] },
  { sides: ["Cascade", "Delta"], score: [0, 1] },
  { sides: ["Aurora", "Delta"], score: [3, 1] },
];
const options: DrawOptions = { look: "road", theme: "dark", title: "Aurora Cup" };
console.log(drawBracket(matchups, options).startsWith("<svg"), layoutBracket(matchups).champion?.name);

// @ts-expect-error "neon" is not a theme
const theme: DrawOptions["theme"] = "neon";
console.log(theme);
