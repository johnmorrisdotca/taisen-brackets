// Writes docs/languages.md: the hand-written part of the page (how the words were checked and what is still open) and, from the
// built package, every word and every round name of every language, so that the page and the tables cannot disagree.
//   node scripts/make-languages-doc.mjs           write the page
//   node scripts/make-languages-doc.mjs --check   exit 1 when the page is not the one the tables make
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { LOCALES, LOCALE_CODES } from "../dist/index.js";

const NAMES = { en: "English", fr: "French", ja: "Japanese", es: "Spanish", de: "German" };
const cell = (text) => `\`${String(text).replace(/\u00a0/g, "\u2423").replace(/\|/g, "\\|")}\``;

export function languagesPage() {
  const codes = LOCALE_CODES;
  const head = `| | ${codes.map((c) => NAMES[c]).join(" | ")} |\n| --- | ${codes.map(() => "---").join(" | ")} |`;
  const wordRows = Object.keys(LOCALES.en.words).map((key) => `| \`${key}\` | ${codes.map((c) => cell(LOCALES[c].words[key])).join(" | ")} |`);
  const roundNames = [...new Set(Object.keys(LOCALES.fr.rounds))];
  const roundRows = roundNames.map((name) => `| ${name} | ${codes.filter((c) => c !== "en").map((c) => cell(LOCALES[c].rounds[name])).join(" | ")} |`);
  return `# Languages

\`locale\` is \`"en"\` (the default), \`"fr"\`, \`"ja"\`, \`"es"\`, \`"de"\`, or a \`Locale\` made with \`defineLocale\`. This page lists every word and every round name of every built-in language, what each was checked against, and what still needs a native reader. It is written by \`scripts/make-languages-doc.mjs\` from the tables in \`src/locales.ts\`, except for the text around them; do not edit the tables by hand.

## How the words were checked

**The football terms** (the rounds of the World Cup, extra time, the shoot-out, a replay) were read on 2026-10-14 in each language's Wikipedia article on the knockout stage of the World Cups of 2022, 2026 and 1938, through the MediaWiki API, one request at a time, a second or more apart, with a User-Agent that names this project. Wikipedia's text is CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/legalcode); only terms are taken, no sentence or table.

| Language | Articles read |
| --- | --- |
| French | [Coupe du monde de football de 2022](https://fr.wikipedia.org/wiki/Coupe_du_monde_de_football_de_2022), [de 2026](https://fr.wikipedia.org/wiki/Coupe_du_monde_de_football_de_2026), [de 1938](https://fr.wikipedia.org/wiki/Coupe_du_monde_de_football_de_1938) |
| Spanish | [Copa Mundial de Fútbol de 2022](https://es.wikipedia.org/wiki/Copa_Mundial_de_F%C3%BAtbol_de_2022), [de 2026](https://es.wikipedia.org/wiki/Copa_Mundial_de_F%C3%BAtbol_de_2026), [de 1938](https://es.wikipedia.org/wiki/Copa_Mundial_de_F%C3%BAtbol_de_1938) |
| German | [Fußball-Weltmeisterschaft 2022](https://de.wikipedia.org/wiki/Fu%C3%9Fball-Weltmeisterschaft_2022), [2026](https://de.wikipedia.org/wiki/Fu%C3%9Fball-Weltmeisterschaft_2026), [1938](https://de.wikipedia.org/wiki/Fu%C3%9Fball-Weltmeisterschaft_1938) |
| Japanese | [2022 FIFAワールドカップ](https://ja.wikipedia.org/wiki/2022_FIFA%E3%83%AF%E3%83%BC%E3%83%AB%E3%83%89%E3%82%AB%E3%83%83%E3%83%97), [2026](https://ja.wikipedia.org/wiki/2026_FIFA%E3%83%AF%E3%83%BC%E3%83%AB%E3%83%89%E3%82%AB%E3%83%83%E3%83%97), [1938](https://ja.wikipedia.org/wiki/1938_FIFA%E3%83%AF%E3%83%BC%E3%83%AB%E3%83%89%E3%82%AB%E3%83%83%E3%83%97) |

What each article was found to use:

| Term | French | Spanish | German | Japanese |
| --- | --- | --- | --- | --- |
| Round of 32 (2026) | seizièmes de finale | dieciseisavos de final | Sechzehntelfinale | ラウンド32 |
| Round of 16 | huitièmes de finale | octavos de final | Achtelfinale | ラウンド16 |
| Quarter-finals | quarts de finale | cuartos de final | Viertelfinale | 準々決勝 |
| Semi-finals | demi-finales | semifinales | Halbfinale | 準決勝 |
| Final | finale | final | Finale | 決勝 |
| Third place | match pour la troisième place | tercer puesto | Spiel um Platz 3 | 3位決定戦 |
| Extra time | prolongation | prórroga | Verlängerung (n. V.) | 延長戦 |
| Shoot-out | tirs au but | tanda de penales | Elfmeterschießen | PK戦 |
| Replayed match (1938) | rejoué (match rejoué) | partido de desempate | Wiederholungsspiel | 再試合 |
| Walkover (1938) | forfait | not found | not found | not found |

Spanish writes the shoot-out *penales* in the Latin American form (the article's own); in Spain it is *penaltis*. A Spain-Spanish locale is one \`defineLocale\` away:

\`\`\`js no-run
const spain = defineLocale("es-ES", { tag: "es-ES", words: { pens: "penaltis", pensScore: "{a}–{b} en los penaltis" } }, "es");
\`\`\`

## Who has read what

| Language | Football terms | Everything else |
| --- | --- | --- |
| English | the source | the source |
| French | checked against French Wikipedia (above) | read by a French-language reviewer on 2026-10-14; the fixes below are made |
| Japanese | checked against Japanese Wikipedia (above) | read by a Japanese-language reviewer on 2026-10-14; the fixes below are made |
| Spanish | checked against Spanish Wikipedia (above) | **not read by a native speaker: needs one** |
| German | checked against German Wikipedia (above) | **not read by a native speaker: needs one** |

**Not found in Wikipedia, and so unchecked**, in Spanish and German: the short forms (*i. E.*, *ges.*), *exento* and *Freilos* for a bye, *incomparecencia* and *kampflos* for a walkover, *global* and *im Gesamtergebnis* for an aggregate, *Turniersieger* and *Campeón* as the label under a champion (the World Cup says *Weltmeister* and *campeón del mundo*, which the generic label cannot), and the translations of the NHL, NBA, MLB, NFL and CFL round names in the next table, which are the generic words and each league's own name as the language writes it. The same goes for the French *a.p.* and *t.a.b.* (Wikipedia writes *tab*). Tell us what a native reader would write instead.

**French, the reviewer's changes:** the fallback for a round of 64 or more is *Tour à N équipes* (not *Tour de N*); *Pays de Galles* has its capital; the short notes are *cumulé* and *match rejoué*; the MLB championship series is *Série de championnat* and the NBA's *Finale de la NBA*. Left as they are, for a Quebec reader to settle: *Premier tour* and *Deuxième tour* (Quebec says *première ronde*, *deuxième ronde*), *conférence* for the NHL's rounds (Quebec media say *association*), *au meilleur des N*, and the wild card names, which keep *wild card* in English. The words are France-leaning; a Quebec locale is one \`defineLocale("fr-CA", …, "fr")\` away. The champion is the masculine *Champion*; for a women's tournament pass \`words: { champion: "Championne" }\`.

**Japanese, the reviewer's changes:** *予選ラウンド* for the preliminary round; *ワイルドカード・プレーオフ* for the NFL's first round; the MLB series without middle dots (*ワイルドカードシリーズ*, *ディビジョンシリーズ*, *リーグチャンピオンシップシリーズ*); the score is written between the teams (*アルゼンチン 3–3 フランス*). Left as they are: *シード* for a bye (it is the word a Japanese bracket uses, but it also means "seeded", which the \`seeds\` option shows: a native reader may prefer *免除*); *{n}戦* for "in 7"; *ラウンド16* and *ラウンド32* as Japanese Wikipedia writes them (NHK often says *決勝トーナメント1回戦* or *ベスト16*); *予選ラウンド* for both the preliminary and the qualifying rounds of the NHL (they never share a season).

**The road to the final's words** (the keys that start \`road\`, added in 0.4.0) were written for the chart and read by the same reviewers on 2026-10-14; the Spanish and German were not read by a native speaker and, like the rest of those two tables, need one. French, the reviewer's changes: *Parcours vers la finale*; *t.r.*, *a.p.* and *t.a.b.* (one lowercase dotted form for each idea, the last two as the file already writes them); a no-break space before each colon; and a summary that gives the number of matches after a label, so that no plural is needed (*Matchs joués avant la finale : …*). Left as they are: *vs* between the two marks (the tie's sentence says *contre*) and *Phase de groupes*, which \`groupLabel\` replaces for a sport that has no groups; *t.r.* (regulation time) is the weakest, since French sports media rarely abbreviate it, and a Quebec reader will say *partie*, *ronde* and *tirs de barrage* for a hockey play-off. Japanese: *規定時間* for FT, which says "regulation time" for any sport (the first version said 90 minutes), and *PK戦 {a}–{b}* as the file's own \`pensScore\` writes it; *PK戦* is the football word, and an ice hockey reader may prefer *シュートアウト*. The English, Spanish and German summaries are written the same way as the French (a label, then each team and its number) so that one match is never "1 matches".

**The layouts' words** (\`vs\`, \`at\`, \`groupName\`, the table heads \`colPlayed\` to \`colPoints\`, \`playIn\`, \`playInWinner\`, \`playInLoser\`, \`seedSlot\`, \`winnerOf\` and \`loserOf\`, added in 0.6.0) were read by the same French and Japanese reviewers on 2026-10-14; the Spanish and German were not read by a native speaker and need one. French, the reviewer's changes: *Play-in* in place of *Barrages* (which means a promotion play-off in France and *tirs de barrage* in Quebec), *Gagnant* and *Perdant* as a pair, *Gagnant du match {name}* so that no *de* meets a name that starts with a vowel, a no-break space in *N° {n}*, and the Canadian heads *PJ V N D* with *+/-* for the goal difference (France writes *J G N P*). Japanese: *試合* and *得失差* in full where *試* and *得失* alone are ambiguous, *勝点* for points (never *得点*, which is goals), and a plain ASCII *@* for "at": Japanese schedules write it as English ones do, and the full-width form looks like part of an address. *第{n}シード* shares *シード* with the word for a bye (*bye*); the number keeps them apart.

**The judo words** (the keys that start \`judo\`, added in 0.7.0) were read by the same French and Japanese reviewers on 2026-10-20; the Spanish and German were not read by a native speaker and need one. The scoreboard words (*Osaekomi*, *Shido*, *Mat {n}*, *Contest {n}*, the coach line and the title, added in 0.8.0) were read by the same reviewers on 2026-10-20: French keeps *Tapis* for the mat and *Combat* for the contest (judo-specific items say *combat*, generic bracket items *match*) and *Entraîneur* for the coach, and the Japanese osaekomi is *抑え込み* (the Kodokan's 抑), not 押さえ込み; the Spanish and German were not read by a native speaker. The judo terms (*ippon*, *waza-ari*, *yuko*, *shido*, *hansoku-make*, *fusen-gachi*, *kiken-gachi*, *golden score*) are kept as the international judo vocabulary in French, Spanish and German. French, the reviewer's changes: a no-break space before the colon and before *kg*. Left as they are, for a French judo reader to settle: *décision* for a win on the technical scores (*aux points* is the alternative) and *{n} shido* with no plural. Japanese, the reviewer's changes: *合わせ技一本* for waza-ari-awasete-ippon, no space in *指導{a}–{b}*, and the weight class written the Japanese way, *男子66kg級* and *女子78kg超級* (the sign is dropped, *judoWeightOver* is for a class over a weight). Left as they are: the one-character marks *一*, *技* and *有* (from memory of Japanese scoreboards; a native judo reader should confirm them), *優勢勝ち* for a decision, *反則勝ち* for the winner by the other's hansoku-make, and *銅メダル決定戦* for the bronze medal contest (*3位決定戦* is the domestic word).

## What stays the same in every language

- **Clubs and people** keep their names. A national team's name comes from \`Intl.DisplayNames\` by its ISO 3166 code (\`countryName\`), or from \`Team.names\`, or from a \`teamName\` function; the demo writes by hand only the two states that no longer exist (Czechoslovakia, the Dutch East Indies), after the form each language's Wikipedia gives, and the home nations are in \`src/locales.ts\`.
- **A team's short name** (\`NED\`, \`ARG\`) is the FIFA code in every language.
- **The league's own name** (Stanley Cup, Grey Cup, Super Bowl, World Series) is as each language writes it: *Finale de la Coupe Stanley*, *Stanley-Cup-Finale*, *Coupe Grey*, *Série mondiale*, *スーパーボウル*, *Super Bowl*.
- **Numbers and dates** are written by \`Intl\` for the language (\`voiceOf(...).number\`, \`.date\`): *Dec 18, 2022*, *18 déc. 2022*, *2022/12/18*, *18 dic 2022*, *18.12.2022*.
- **A title or a subtitle** (\`title\`, \`subtitle\`) is your text, not the package's: the demo gives each language's Wikipedia title of the World Cup for the World Cup examples (and the subtitle of the poster in each language), and a name that needs no translation (\`NHL 2024\`) for the leagues. Those strings are the demo's and were not read by a reviewer.
- **Capitals** follow the language's rules (\`toLocaleUpperCase\`), and Japanese is never upper-cased.
- **Trophy emblems** (\`emblems\`, \`trophy: "trophy:hockey-cup"\`) add no word to the five languages: an emblem is a picture, and its own \`<title>\` (English, and Japanese in its package) is left out of the drawing, whose description already names the champion in the bracket's language. The demo's new controls ("Trophy", "Metal", "Line", "Colour") are English like the rest of the playground's controls; none of them was translated or read by a reviewer, so French, Japanese, Spanish and German have nothing new to review for this feature.

## Every round name

The English name is the key (a round the table does not name keeps its English name, or, for \`Round of N\`, the language's \`roundOf\` phrase).

| English | French | Japanese | Spanish | German |
| --- | --- | --- | --- | --- |
${roundRows.join("\n")}

## Every word

${head}
${wordRows.join("\n")}

Holes in a phrase are filled in (\`{n}\`, \`{a}\`, \`{b}\`, \`{sa}\`, \`{sb}\`, \`{w}\`, \`{name}\`, \`{round}\`, \`{tie}\`, \`{notes}\`); \`\u2423\` stands for a no-break space (the French writes one before a colon).
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = new URL("../docs/languages.md", import.meta.url);
  if (process.argv.includes("--check")) {
    if (readFileSync(path, "utf8") !== languagesPage()) { console.error("docs/languages.md is not what the tables make: run node scripts/make-languages-doc.mjs"); process.exit(1); }
    console.log("ok   docs/languages.md matches the tables");
  } else writeFileSync(path, languagesPage());
}
