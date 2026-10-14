// The demo's trophies: the emblems of @johnmorrisdotca/dougu-sports that the leagues' default emblems name (LEAGUE_EMBLEMS), each imported from its own
// module, so the page fetches seven small files and not the whole package. Taisen does not depend on it: this is the plug-in a caller writes
// (`drawBracket(data, { emblems: renderEmblem, trophy: "trophy:hockey-cup" })`, with the package's own renderEmblem), written out here for a page
// with no bundler. The Pages build and scripts/dev.mjs serve the package's compiled files at ./dougu-sports/.
import { TROPHY_BASEBALL } from "./dougu-sports/emblems/trophy/baseball.js";
import { TROPHY_BASKETBALL } from "./dougu-sports/emblems/trophy/basketball.js";
import { TROPHY_CANADIAN_BOWL } from "./dougu-sports/emblems/trophy/canadian-bowl.js";
import { TROPHY_CUP } from "./dougu-sports/emblems/trophy/cup.js";
import { TROPHY_FOOTBALL } from "./dougu-sports/emblems/trophy/football.js";
import { TROPHY_HOCKEY_CUP } from "./dougu-sports/emblems/trophy/hockey-cup.js";
import { TROPHY_SOCCER_GLOBE } from "./dougu-sports/emblems/trophy/soccer-globe.js";

const BY_ID = new Map([TROPHY_BASEBALL, TROPHY_BASKETBALL, TROPHY_CANADIAN_BOWL, TROPHY_CUP, TROPHY_FOOTBALL, TROPHY_HOCKEY_CUP, TROPHY_SOCCER_GLOBE].map((emblem) => [emblem.id, emblem]));

/** The `emblems` renderer for the ids of the leagues' default trophies; it throws for any other id, and Taisen then draws no trophy. */
export function renderEmblem(id, options) {
  const emblem = BY_ID.get(id);
  if (!emblem) throw new Error(`no emblem ${id}`);
  return emblem.svg(options);
}
