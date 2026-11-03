import { drawBracket, type Matchup } from "@johnmorrisdotca/taisen-brackets";

const matchups: Matchup[] = [
  { sides: ["Aurora", "Harbour"], score: [2, 1] },
  { sides: ["Cascade", "Delta"], score: [0, 1] },
  { sides: ["Aurora", "Delta"], score: [3, 1] },
];

export function Bracket({ theme = "auto" }: { theme?: "auto" | "light" | "dark" }) {
  return <div id="bracket" dangerouslySetInnerHTML={{ __html: drawBracket(matchups, { theme }) }} />;
}
