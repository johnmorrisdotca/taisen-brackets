import { drawBracket, layoutBracket } from "@johnmorrisdotca/taisen-brackets";

// A server draws the same SVG a browser does: pure, no DOM, no network, no script.
const matchups = [
  { sides: ["Aurora", "Harbour"], score: [2, 1] },
  { sides: ["Cascade", "Delta"], score: [0, 1] },
  { sides: ["Aurora", "Delta"], score: [3, 1] },
];
const page = `<!doctype html><title>Aurora Cup</title>${drawBracket(matchups, { title: "Aurora Cup" })}`;
console.log(page.length > 1000, layoutBracket(matchups).champion?.name);
