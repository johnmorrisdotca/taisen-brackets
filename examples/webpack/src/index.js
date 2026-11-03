import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const bracket = document.createElement("div");
bracket.id = "bracket";
bracket.innerHTML = drawBracket([
  { sides: ["Aurora", "Harbour"], score: [2, 1] },
  { sides: ["Cascade", "Delta"], score: [0, 1] },
  { sides: ["Aurora", "Delta"], score: [3, 1] },
]);
document.body.append(bracket);
