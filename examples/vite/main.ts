import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

document.getElementById("bracket")!.innerHTML = drawBracket([
  { sides: ["Aurora", "Harbour"], score: [2, 1] },
  { sides: ["Cascade", "Delta"], score: [0, 1] },
  { sides: ["Aurora", "Delta"], score: [3, 1] },
]);
