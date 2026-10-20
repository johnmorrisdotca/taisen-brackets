# Languages

`locale` is `"en"` (the default), `"fr"`, `"ja"`, `"es"`, `"de"`, or a `Locale` made with `defineLocale`. This page lists every word and every round name of every built-in language, what each was checked against, and what still needs a native reader. It is written by `scripts/make-languages-doc.mjs` from the tables in `src/locales.ts`, except for the text around them; do not edit the tables by hand.

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

Spanish writes the shoot-out *penales* in the Latin American form (the article's own); in Spain it is *penaltis*. A Spain-Spanish locale is one `defineLocale` away:

```js no-run
const spain = defineLocale("es-ES", { tag: "es-ES", words: { pens: "penaltis", pensScore: "{a}–{b} en los penaltis" } }, "es");
```

## Who has read what

| Language | Football terms | Everything else |
| --- | --- | --- |
| English | the source | the source |
| French | checked against French Wikipedia (above) | read by a French-language reviewer on 2026-10-14; the fixes below are made |
| Japanese | checked against Japanese Wikipedia (above) | read by a Japanese-language reviewer on 2026-10-14; the fixes below are made |
| Spanish | checked against Spanish Wikipedia (above) | **not read by a native speaker: needs one** |
| German | checked against German Wikipedia (above) | **not read by a native speaker: needs one** |

**Not found in Wikipedia, and so unchecked**, in Spanish and German: the short forms (*i. E.*, *ges.*), *exento* and *Freilos* for a bye, *incomparecencia* and *kampflos* for a walkover, *global* and *im Gesamtergebnis* for an aggregate, *Turniersieger* and *Campeón* as the label under a champion (the World Cup says *Weltmeister* and *campeón del mundo*, which the generic label cannot), and the translations of the NHL, NBA, MLB, NFL and CFL round names in the next table, which are the generic words and each league's own name as the language writes it. The same goes for the French *a.p.* and *t.a.b.* (Wikipedia writes *tab*). Tell us what a native reader would write instead.

**French, the reviewer's changes:** the fallback for a round of 64 or more is *Tour à N équipes* (not *Tour de N*); *Pays de Galles* has its capital; the short notes are *cumulé* and *match rejoué*; the MLB championship series is *Série de championnat* and the NBA's *Finale de la NBA*. Left as they are, for a Quebec reader to settle: *Premier tour* and *Deuxième tour* (Quebec says *première ronde*, *deuxième ronde*), *conférence* for the NHL's rounds (Quebec media say *association*), *au meilleur des N*, and the wild card names, which keep *wild card* in English. The words are France-leaning; a Quebec locale is one `defineLocale("fr-CA", …, "fr")` away. The champion is the masculine *Champion*; for a women's tournament pass `words: { champion: "Championne" }`.

**Japanese, the reviewer's changes:** *予選ラウンド* for the preliminary round; *ワイルドカード・プレーオフ* for the NFL's first round; the MLB series without middle dots (*ワイルドカードシリーズ*, *ディビジョンシリーズ*, *リーグチャンピオンシップシリーズ*); the score is written between the teams (*アルゼンチン 3–3 フランス*). Left as they are: *シード* for a bye (it is the word a Japanese bracket uses, but it also means "seeded", which the `seeds` option shows: a native reader may prefer *免除*); *{n}戦* for "in 7"; *ラウンド16* and *ラウンド32* as Japanese Wikipedia writes them (NHK often says *決勝トーナメント1回戦* or *ベスト16*); *予選ラウンド* for both the preliminary and the qualifying rounds of the NHL (they never share a season).

**The road to the final's words** (the keys that start `road`, added in 0.4.0) were written for the chart and read by the same reviewers on 2026-10-14; the Spanish and German were not read by a native speaker and, like the rest of those two tables, need one. French, the reviewer's changes: *Parcours vers la finale*; *t.r.*, *a.p.* and *t.a.b.* (one lowercase dotted form for each idea, the last two as the file already writes them); a no-break space before each colon; and a summary that gives the number of matches after a label, so that no plural is needed (*Matchs joués avant la finale : …*). Left as they are: *vs* between the two marks (the tie's sentence says *contre*) and *Phase de groupes*, which `groupLabel` replaces for a sport that has no groups; *t.r.* (regulation time) is the weakest, since French sports media rarely abbreviate it, and a Quebec reader will say *partie*, *ronde* and *tirs de barrage* for a hockey play-off. Japanese: *規定時間* for FT, which says "regulation time" for any sport (the first version said 90 minutes), and *PK戦 {a}–{b}* as the file's own `pensScore` writes it; *PK戦* is the football word, and an ice hockey reader may prefer *シュートアウト*. The English, Spanish and German summaries are written the same way as the French (a label, then each team and its number) so that one match is never "1 matches".

**The layouts' words** (`vs`, `at`, `groupName`, the table heads `colPlayed` to `colPoints`, `playIn`, `playInWinner`, `playInLoser`, `seedSlot`, `winnerOf` and `loserOf`, added in 0.6.0) were read by the same French and Japanese reviewers on 2026-10-14; the Spanish and German were not read by a native speaker and need one. French, the reviewer's changes: *Play-in* in place of *Barrages* (which means a promotion play-off in France and *tirs de barrage* in Quebec), *Gagnant* and *Perdant* as a pair, *Gagnant du match {name}* so that no *de* meets a name that starts with a vowel, a no-break space in *N° {n}*, and the Canadian heads *PJ V N D* with *+/-* for the goal difference (France writes *J G N P*). Japanese: *試合* and *得失差* in full where *試* and *得失* alone are ambiguous, *勝点* for points (never *得点*, which is goals), and a plain ASCII *@* for "at": Japanese schedules write it as English ones do, and the full-width form looks like part of an address. *第{n}シード* shares *シード* with the word for a bye (*bye*); the number keeps them apart.

**The judo words** (the keys that start `judo`, added in 0.7.0) were read by the same French and Japanese reviewers on 2026-10-20; the Spanish and German were not read by a native speaker and need one. The scoreboard words (*Osaekomi*, *Shido*, *Mat {n}*, *Contest {n}*, the coach line and the title, added in 0.8.0) were read by the same reviewers on 2026-10-20: French keeps *Tapis* for the mat and *Combat* for the contest (judo-specific items say *combat*, generic bracket items *match*) and *Entraîneur* for the coach, and the Japanese osaekomi is *抑え込み* (the Kodokan's 抑), not 押さえ込み; the Spanish and German were not read by a native speaker. The titles of the contest card and the mat queue board (added in 0.9.0) were read by the same reviewers: French *Présentation d’un combat de judo* (not *fiche*, which is an administrative record) and *Prochains combats par tapis*; Japanese *柔道の対戦カード* and *各試合場の次の試合*; the Spanish and German were not read by a native speaker. The judo terms (*ippon*, *waza-ari*, *yuko*, *shido*, *hansoku-make*, *fusen-gachi*, *kiken-gachi*, *golden score*) are kept as the international judo vocabulary in French, Spanish and German. French, the reviewer's changes: a no-break space before the colon and before *kg*. Left as they are, for a French judo reader to settle: *décision* for a win on the technical scores (*aux points* is the alternative) and *{n} shido* with no plural. Japanese, the reviewer's changes: *合わせ技一本* for waza-ari-awasete-ippon, no space in *指導{a}–{b}*, and the weight class written the Japanese way, *男子66kg級* and *女子78kg超級* (the sign is dropped, *judoWeightOver* is for a class over a weight). Left as they are: the one-character marks *一*, *技* and *有* (from memory of Japanese scoreboards; a native judo reader should confirm them), *優勢勝ち* for a decision, *反則勝ち* for the winner by the other's hansoku-make, and *銅メダル決定戦* for the bronze medal contest (*3位決定戦* is the domestic word).

## What stays the same in every language

- **Clubs and people** keep their names. A national team's name comes from `Intl.DisplayNames` by its ISO 3166 code (`countryName`), or from `Team.names`, or from a `teamName` function; the demo writes by hand only the two states that no longer exist (Czechoslovakia, the Dutch East Indies), after the form each language's Wikipedia gives, and the home nations are in `src/locales.ts`.
- **A team's short name** (`NED`, `ARG`) is the FIFA code in every language.
- **The league's own name** (Stanley Cup, Grey Cup, Super Bowl, World Series) is as each language writes it: *Finale de la Coupe Stanley*, *Stanley-Cup-Finale*, *Coupe Grey*, *Série mondiale*, *スーパーボウル*, *Super Bowl*.
- **Numbers and dates** are written by `Intl` for the language (`voiceOf(...).number`, `.date`): *Dec 18, 2022*, *18 déc. 2022*, *2022/12/18*, *18 dic 2022*, *18.12.2022*.
- **A title or a subtitle** (`title`, `subtitle`) is your text, not the package's: the demo gives each language's Wikipedia title of the World Cup for the World Cup examples (and the subtitle of the poster in each language), and a name that needs no translation (`NHL 2024`) for the leagues. Those strings are the demo's and were not read by a reviewer.
- **Capitals** follow the language's rules (`toLocaleUpperCase`), and Japanese is never upper-cased.
- **Trophy emblems** (`emblems`, `trophy: "trophy:hockey-cup"`) add no word to the five languages: an emblem is a picture, and its own `<title>` (English, and Japanese in its package) is left out of the drawing, whose description already names the champion in the bracket's language. The demo's new controls ("Trophy", "Metal", "Line", "Colour") are English like the rest of the playground's controls; none of them was translated or read by a reviewer, so French, Japanese, Spanish and German have nothing new to review for this feature.

## Every round name

The English name is the key (a round the table does not name keeps its English name, or, for `Round of N`, the language's `roundOf` phrase).

| English | French | Japanese | Spanish | German |
| --- | --- | --- | --- | --- |
| Round of 32 | `Seizièmes de finale` | `ラウンド32` | `Dieciseisavos de final` | `Sechzehntelfinale` |
| Round of 16 | `Huitièmes de finale` | `ラウンド16` | `Octavos de final` | `Achtelfinale` |
| Quarter-finals | `Quarts de finale` | `準々決勝` | `Cuartos de final` | `Viertelfinale` |
| Quarterfinals | `Quarts de finale` | `準々決勝` | `Cuartos de final` | `Viertelfinale` |
| Semi-finals | `Demi-finales` | `準決勝` | `Semifinales` | `Halbfinale` |
| Semifinals | `Demi-finales` | `準決勝` | `Semifinales` | `Halbfinale` |
| Final | `Finale` | `決勝` | `Final` | `Finale` |
| Preliminary Round | `Tour préliminaire` | `予選ラウンド` | `Ronda preliminar` | `Vorrunde` |
| Qualifying Round | `Tour de qualification` | `予選ラウンド` | `Ronda de clasificación` | `Qualifikationsrunde` |
| First Round | `Premier tour` | `1回戦` | `Primera ronda` | `Erste Runde` |
| Second Round | `Deuxième tour` | `2回戦` | `Segunda ronda` | `Zweite Runde` |
| Division Semifinals | `Demi-finales de division` | `ディビジョン準決勝` | `Semifinales de división` | `Division-Halbfinale` |
| Division Finals | `Finales de division` | `ディビジョン決勝` | `Finales de división` | `Division-Finale` |
| Conference Quarterfinals | `Quarts de finale de conférence` | `カンファレンス準々決勝` | `Cuartos de final de conferencia` | `Conference-Viertelfinale` |
| Conference Semifinals | `Demi-finales de conférence` | `カンファレンス準決勝` | `Semifinales de conferencia` | `Conference-Halbfinale` |
| Conference Finals | `Finales de conférence` | `カンファレンス決勝` | `Finales de conferencia` | `Conference-Finale` |
| Stanley Cup Semifinals | `Demi-finales de la Coupe Stanley` | `スタンレー・カップ準決勝` | `Semifinales de la Stanley Cup` | `Stanley-Cup-Halbfinale` |
| Stanley Cup Final | `Finale de la Coupe Stanley` | `スタンレー・カップ・ファイナル` | `Final de la Stanley Cup` | `Stanley-Cup-Finale` |
| NBA Finals | `Finale de la NBA` | `NBAファイナル` | `Finales de la NBA` | `NBA-Finale` |
| Wild Card Game | `Match de wild card` | `ワイルドカードゲーム` | `Juego de comodín` | `Wild-Card-Spiel` |
| Wild Card Series | `Série de wild card` | `ワイルドカードシリーズ` | `Serie de comodín` | `Wild-Card-Serie` |
| Division Series | `Série de division` | `ディビジョンシリーズ` | `Serie divisional` | `Division Series` |
| League Championship Series | `Série de championnat` | `リーグチャンピオンシップシリーズ` | `Serie de Campeonato de Liga` | `League Championship Series` |
| World Series | `Série mondiale` | `ワールドシリーズ` | `Serie Mundial` | `World Series` |
| Wild Card Round | `Tour de wild card` | `ワイルドカードラウンド` | `Ronda de comodín` | `Wild-Card-Runde` |
| Round One | `Premier tour` | `1回戦` | `Primera ronda` | `Erste Runde` |
| MLS Cup | `Coupe MLS` | `MLSカップ` | `Copa MLS` | `MLS Cup` |
| Wild Card | `Wild card` | `ワイルドカード・プレーオフ` | `Comodín` | `Wild-Card-Runde` |
| Divisional | `Ronde divisionnaire` | `ディビジョナル・プレーオフ` | `Ronda divisional` | `Divisional Round` |
| Divisional Playoffs | `Ronde divisionnaire` | `ディビジョナル・プレーオフ` | `Ronda divisional` | `Divisional Round` |
| Conference Championship | `Finale de conférence` | `カンファレンス・チャンピオンシップ` | `Campeonato de conferencia` | `Conference Championship` |
| Conference Championships | `Finales de conférence` | `カンファレンス・チャンピオンシップ` | `Campeonatos de conferencia` | `Conference Championships` |
| Super Bowl | `Super Bowl` | `スーパーボウル` | `Super Bowl` | `Super Bowl` |
| Division Semi-Final | `Demi-finale de division` | `ディビジョン準決勝` | `Semifinal de división` | `Division-Halbfinale` |
| Division Final | `Finale de division` | `ディビジョン決勝` | `Final de división` | `Division-Finale` |
| Grey Cup | `Coupe Grey` | `グレイ・カップ` | `Grey Cup` | `Grey Cup` |

## Every word

| | English | French | Japanese | Spanish | German |
| --- | --- | --- | --- | --- | --- |
| `tbd` | `TBD` | `À déterminer` | `未定` | `Por definir` | `offen` |
| `bye` | `bye` | `exempt` | `シード` | `exento` | `Freilos` |
| `walkover` | `walkover` | `forfait` | `不戦勝` | `incomparecencia` | `kampflos` |
| `champion` | `Champion` | `Champion` | `優勝` | `Campeón` | `Turniersieger` |
| `thirdPlace` | `Third place` | `Match pour la troisième place` | `3位決定戦` | `Partido por el tercer puesto` | `Spiel um Platz 3` |
| `other` | `Other ties` | `Autres rencontres` | `その他の対戦` | `Otros partidos` | `Weitere Begegnungen` |
| `aet` | `a.e.t.` | `a.p.` | `延長` | `prórroga` | `n. V.` |
| `pens` | `pens` | `t.a.b.` | `PK戦` | `penales` | `i. E.` |
| `aggregate` | `agg.` | `cumulé` | `合計` | `global` | `ges.` |
| `replay` | `replay` | `match rejoué` | `再試合` | `desempate` | `Wiederholungsspiel` |
| `aetLong` | `after extra time` | `après prolongation` | `延長戦` | `tras la prórroga` | `nach Verlängerung` |
| `pensScore` | `{a}–{b} on penalties` | `{a}–{b} aux tirs au but` | `PK戦 {a}–{b}` | `{a}–{b} en los penales` | `{a}:{b} im Elfmeterschießen` |
| `aggregateLong` | `on aggregate` | `au cumul` | `合計スコア` | `en el global` | `im Gesamtergebnis` |
| `inGames` | `in {n}` | `en {n}` | `{n}戦` | `en {n}` | `in {n}` |
| `bestOf` | `best of {n}` | `au meilleur des {n}` | `{n}戦{w}勝制` | `al mejor de {n}` | `Best of {n}` |
| `round` | `Round {n}` | `Tour {n}` | `第{n}ラウンド` | `Ronda {n}` | `Runde {n}` |
| `roundOf` | `Round of {n}` | `Tour à {n} équipes` | `ラウンド{n}` | `Ronda de {n}` | `Runde der letzten {n}` |
| `tieVs` | `{a} v {b}` | `{a} contre {b}` | `{a} 対 {b}` | `{a} vs. {b}` | `{a} gegen {b}` |
| `tieScore` | `{a} {sa}, {b} {sb}` | `{a} {sa}, {b} {sb}` | `{a} {sa}–{sb} {b}` | `{a} {sa}, {b} {sb}` | `{a} {sa}, {b} {sb}` |
| `scoreText` | `{a}–{b}` | `{a}–{b}` | `{a}–{b}` | `{a}–{b}` | `{a}:{b}` |
| `winnerIs` | `Winner: {name}` | `Vainqueur␣: {name}` | `勝者：{name}` | `Ganador: {name}` | `Sieger: {name}` |
| `championIs` | `Champion: {name}` | `Champion␣: {name}` | `優勝：{name}` | `Campeón: {name}` | `Turniersieger: {name}` |
| `finalLine` | `{round}: {tie}` | `{round}␣: {tie}` | `{round}：{tie}` | `{round}: {tie}` | `{round}: {tie}` |
| `summary` | `{n} teams, {r} rounds` | `{n} équipes, {r} tours` | `{n}チーム、{r}ラウンド` | `{n} equipos, {r} rondas` | `{n} Teams, {r} Runden` |
| `summaryOne` | `{n} teams, 1 round` | `{n} équipes, 1 tour` | `{n}チーム、1ラウンド` | `{n} equipos, 1 ronda` | `{n} Teams, 1 Runde` |
| `sep` | `. ` | `. ` | `。` | `. ` | `. ` |
| `end` | `.` | `.` | `。` | `.` | `.` |
| `note` | ` ({notes})` | ` ({notes})` | `（{notes}）` | ` ({notes})` | ` ({notes})` |
| `noteJoin` | `, ` | `, ` | `、` | `, ` | `, ` |
| `columnRound` | `Round` | `Tour` | `ラウンド` | `Ronda` | `Runde` |
| `columnTie` | `Tie` | `Rencontre` | `対戦` | `Partido` | `Begegnung` |
| `columnNote` | `Note` | `Note` | `備考` | `Nota` | `Hinweis` |
| `columnDate` | `Date` | `Date` | `日付` | `Fecha` | `Datum` |
| `title` | `Knockout bracket` | `Tableau à élimination directe` | `トーナメント表` | `Cuadro de eliminatorias` | `Turnierbaum` |
| `roadTitle` | `Road to the final` | `Parcours vers la finale` | `決勝への道` | `El camino a la final` | `Der Weg ins Finale` |
| `roadVs` | `v` | `vs` | `対` | `vs.` | `vs.` |
| `roadGroup` | `Group stage` | `Phase de groupes` | `グループステージ` | `Fase de grupos` | `Gruppenphase` |
| `roadFt` | `FT` | `t.r.` | `規定時間` | `T. reg.` | `reg. Zeit` |
| `roadAet` | `AET` | `a.p.` | `延長` | `Prórroga` | `n. V.` |
| `roadPens` | `{a}–{b} pens` | `{a}–{b}␣t.a.b.` | `PK戦 {a}–{b}` | `{a}–{b} en los penales` | `{a}:{b} i. E.` |
| `roadWon` | `Won` | `Victoire` | `勝ち` | `Ganó` | `Sieg` |
| `roadLost` | `Lost` | `Défaite` | `負け` | `Perdió` | `Niederlage` |
| `roadDrew` | `Drew` | `Nul` | `引き分け` | `Empató` | `Remis` |
| `roadQuarterFinal` | `Quarter-final` | `Quart de finale` | `準々決勝` | `Cuartos de final` | `Viertelfinale` |
| `roadSemiFinal` | `Semi-final` | `Demi-finale` | `準決勝` | `Semifinal` | `Halbfinale` |
| `roadTableTeam` | `Team` | `Équipe` | `チーム` | `Equipo` | `Team` |
| `roadTableOpponent` | `Opponent` | `Adversaire` | `対戦相手` | `Rival` | `Gegner` |
| `roadTableScore` | `Score` | `Score` | `スコア` | `Marcador` | `Ergebnis` |
| `roadTableDecided` | `Decided` | `Décidé en` | `決着` | `Decidido en` | `Entschieden` |
| `roadTableResult` | `Result` | `Résultat` | `結果` | `Resultado` | `Ausgang` |
| `roadCaption` | `{a} and {b}: every match on the way to the final. Scores are written with the team in the first column first.` | `{a} et {b}␣: tous les matchs jusqu’à la finale. Chaque score commence par celui de l’équipe de la première colonne.` | `{a}と{b}：決勝までの全試合。スコアは「チーム」列のチームの得点を先に書いています。` | `{a} y {b}: todos los partidos hasta la final. Los marcadores empiezan por el equipo de la primera columna.` | `{a} und {b}: alle Spiele auf dem Weg ins Finale. Die Ergebnisse beginnen mit dem Team der ersten Spalte.` |
| `roadName` | `{a} and {b}: {title}` | `{a} et {b}␣: {title}` | `{a}と{b}：{title}` | `{a} y {b}: {title}` | `{a} und {b}: {title}` |
| `roadSummary` | `Matches played before the final: {a} ({an}) and {b} ({bn}).` | `Matchs joués avant la finale␣: {a} ({an}) et {b} ({bn}).` | `{a}は決勝までに{an}試合、{b}は{bn}試合を戦いました。` | `Partidos jugados hasta la final: {a} ({an}) y {b} ({bn}).` | `Spiele bis zum Finale: {a} ({an}) und {b} ({bn}).` |
| `roadFinal` | `The final: {a} {score} {b} ({how}).` | `La finale␣: {a} {score} {b} ({how}).` | `決勝は{a} {score} {b}（{how}）でした。` | `La final: {a} {score} {b} ({how}).` | `Das Finale: {a} {score} {b} ({how}).` |
| `roadChampion` | `{name} won the final.` | `{name} a remporté la finale.` | `{name}が優勝しました。` | `{name} ganó la final.` | `{name} gewann das Finale.` |
| `roadToPlay` | `The final is still to be played.` | `La finale reste à jouer.` | `決勝はまだ行われていません。` | `La final aún no se ha jugado.` | `Das Finale steht noch aus.` |
| `vs` | `vs` | `vs` | `対` | `vs.` | `vs.` |
| `at` | `AT` | `À` | `@` | `EN` | `BEI` |
| `groupName` | `Group {n}` | `Groupe {n}` | `グループ{n}` | `Grupo {n}` | `Gruppe {n}` |
| `colPlayed` | `P` | `PJ` | `試合` | `PJ` | `Sp` |
| `colWon` | `W` | `V` | `勝` | `G` | `S` |
| `colDrawn` | `D` | `N` | `分` | `E` | `U` |
| `colLost` | `L` | `D` | `敗` | `P` | `N` |
| `colDiff` | `GD` | `+/-` | `得失差` | `DG` | `Diff.` |
| `colPoints` | `Pts` | `Pts` | `勝点` | `Pts` | `Pkt` |
| `playIn` | `Play-in` | `Play-in` | `プレイイン` | `Play-in` | `Play-in` |
| `playInWinner` | `Winner {a}/{b}` | `Gagnant {a}/{b}` | `{a}/{b}の勝者` | `Ganador {a}/{b}` | `Sieger {a}/{b}` |
| `playInLoser` | `Loser {a}/{b}` | `Perdant {a}/{b}` | `{a}/{b}の敗者` | `Perdedor {a}/{b}` | `Verlierer {a}/{b}` |
| `seedSlot` | `Seed {n}` | `N°␣{n}` | `第{n}シード` | `Puesto {n}` | `Platz {n}` |
| `winnerOf` | `Winner of {name}` | `Gagnant du match {name}` | `{name}の勝者` | `Ganador de {name}` | `Sieger von {name}` |
| `loserOf` | `Loser of {name}` | `Perdant du match {name}` | `{name}の敗者` | `Perdedor de {name}` | `Verlierer von {name}` |
| `judoIppon` | `I` | `I` | `一` | `I` | `I` |
| `judoWazaAri` | `W` | `W` | `技` | `W` | `W` |
| `judoYuko` | `Y` | `Y` | `有` | `Y` | `Y` |
| `judoIpponLong` | `ippon` | `ippon` | `一本` | `ippon` | `Ippon` |
| `judoWazaAriLong` | `waza-ari` | `waza-ari` | `技あり` | `waza-ari` | `Waza-ari` |
| `judoYukoLong` | `yuko` | `yuko` | `有効` | `yuko` | `Yuko` |
| `judoMethodIppon` | `ippon` | `ippon` | `一本` | `ippon` | `Ippon` |
| `judoMethodAwasete` | `waza-ari awasete ippon` | `waza-ari awasete ippon` | `合わせ技一本` | `waza-ari awasete ippon` | `Waza-ari awasete Ippon` |
| `judoMethodScore` | `decision` | `décision` | `優勢勝ち` | `decisión` | `Punktsieg` |
| `judoMethodHansoku` | `hansoku-make` | `hansoku-make` | `反則勝ち` | `hansoku-make` | `Hansoku-make` |
| `judoMethodFusen` | `fusen-gachi` | `fusen-gachi` | `不戦勝` | `fusen-gachi` | `Fusen-gachi` |
| `judoMethodKiken` | `kiken-gachi` | `kiken-gachi` | `棄権勝ち` | `kiken-gachi` | `Kiken-gachi` |
| `judoGolden` | `GS` | `GS` | `GS` | `GS` | `GS` |
| `judoGoldenLong` | `golden score` | `golden score` | `ゴールデンスコア` | `golden score` | `Golden Score` |
| `judoTime` | `{t}` | `{t}` | `{t}` | `{t}` | `{t}` |
| `judoShidoOf` | `{name}: {n} shido` | `{name}␣: {n}␣shido` | `{name}：指導{n}` | `{name}: {n} shido` | `{name}: {n} Shido` |
| `judoShidoShort` | `shido {a}–{b}` | `shido {a}–{b}` | `指導{a}–{b}` | `shido {a}–{b}` | `Shido {a}–{b}` |
| `judoRepechage` | `Repechage` | `Repêchage` | `敗者復活戦` | `Repesca` | `Hoffnungsrunde` |
| `judoBronze` | `Bronze medal contest` | `Combat pour la médaille de bronze` | `銅メダル決定戦` | `Combate por la medalla de bronce` | `Kampf um Bronze` |
| `judoRepechageBronze` | `Repechage and bronze medal contests` | `Repêchages et combats pour la médaille de bronze` | `敗者復活戦と銅メダル決定戦` | `Repesca y combates por la medalla de bronce` | `Hoffnungsrunde und Kämpfe um Bronze` |
| `judoWhite` | `white` | `blanc` | `白` | `blanco` | `weiß` |
| `judoBlue` | `blue` | `bleu` | `青` | `azul` | `blau` |
| `judoWeightClass` | `{sex} -{w} kg` | `{sex} -{w}␣kg` | `{sex}{w}kg級` | `{sex} -{w} kg` | `{sex} -{w} kg` |
| `judoWeightOver` | `{sex} +{w} kg` | `{sex} +{w}␣kg` | `{sex}{w}kg超級` | `{sex} +{w} kg` | `{sex} +{w} kg` |
| `judoMen` | `Men` | `Hommes` | `男子` | `Hombres` | `Herren` |
| `judoWomen` | `Women` | `Femmes` | `女子` | `Mujeres` | `Damen` |
| `judoOsaekomi` | `Osaekomi` | `Osaekomi` | `抑え込み` | `Osaekomi` | `Osaekomi` |
| `judoShido` | `Shido` | `Shido` | `指導` | `Shido` | `Shido` |
| `judoMat` | `Mat {n}` | `Tapis {n}` | `第{n}試合場` | `Tatami {n}` | `Matte {n}` |
| `judoContest` | `Contest {n}` | `Combat {n}` | `試合 {n}` | `Combate {n}` | `Kampf {n}` |
| `judoCoach` | `Coach: {name}` | `Entraîneur␣: {name}` | `コーチ：{name}` | `Entrenador: {name}` | `Trainer: {name}` |
| `judoBoardTitle` | `Judo contest scoreboard` | `Tableau d’affichage d’un combat de judo` | `柔道試合のスコアボード` | `Marcador de un combate de judo` | `Anzeigetafel eines Judokampfes` |
| `judoCardTitle` | `Judo contest card` | `Présentation d’un combat de judo` | `柔道の対戦カード` | `Ficha de un combate de judo` | `Kampfkarte eines Judokampfes` |
| `judoQueueTitle` | `Judo mat queue` | `Prochains combats par tapis` | `各試合場の次の試合` | `Próximos combates por tatami` | `Nächste Kämpfe je Matte` |
| `rankTitle` | `Ranking` | `Classement` | `ランキング` | `Clasificación` | `Rangliste` |
| `rankPoints` | `points` | `points` | `ポイント` | `puntos` | `Punkte` |
| `rankPointsShort` | `pts` | `pts` | `pt` | `pts` | `Pkt.` |
| `rankChampion` | `C` | `C` | `王者` | `C` | `C` |
| `rankChampionLong` | `Champion` | `Champion` | `王者` | `Campeón` | `Champion` |
| `rankInterim` | `IC` | `CI` | `暫定` | `CI` | `IC` |
| `rankInterimLong` | `Interim champion` | `Champion intérimaire` | `暫定王者` | `Campeón interino` | `Interimschampion` |
| `rankNew` | `NR` | `Nouv.` | `NEW` | `NUEVO` | `NEU` |
| `rankNewLong` | `newly ranked` | `nouvelle entrée au classement` | `新規ランクイン` | `nuevo en la clasificación` | `neu in der Rangliste` |
| `rankUp` | `up {n}` | `en hausse de {n}` | `{n}ランク上昇` | `sube {n}` | `{n} Plätze höher` |
| `rankDown` | `down {n}` | `en baisse de {n}` | `{n}ランク下降` | `baja {n}` | `{n} Plätze tiefer` |
| `rankSame` | `unchanged` | `rang inchangé` | `変動なし` | `sin cambios` | `unverändert` |
| `rankRange` | `{a}–{b} of {n}` | `{a}–{b} sur {n}` | `{n}人中{a}–{b}位` | `{a}–{b} de {n}` | `{a}–{b} von {n}` |
| `rankNone` | `No ranked athletes yet` | `Aucun athlète classé pour l’instant` | `ランキング入りした選手はまだいません` | `Aún no hay deportistas clasificados` | `Noch keine platzierten Athleten` |
| `rankJoin` | `, ` | `, ` | `、` | `, ` | `, ` |
| `rankNumberOnes` | `Number ones` | `Les numéros un` | `各階級の1位` | `Los números uno` | `Die Nummer Eins` |
| `rankNumberOneIn` | `#1 in {category}` | `N°␣1 en {category}` | `{category} 1位` | `N.º 1 en {category}` | `Nr. 1 in {category}` |
| `rankEntryTitle` | `Entry list` | `Liste des engagés` | `エントリーリスト` | `Lista de inscritos` | `Meldeliste` |
| `rankColRanking` | `Ranking` | `Classement` | `ランキング` | `Clasificación` | `Rangliste` |
| `rankUnranked` | `NR` | `NC` | `圏外` | `SC` | `o. R.` |
| `rankMatchTitle` | `Head to head` | `Face-à-face` | `直接対決` | `Cara a cara` | `Direkter Vergleich` |
| `rankMeetings` | `Previous meetings` | `Confrontations précédentes` | `過去の対戦` | `Enfrentamientos anteriores` | `Bisherige Duelle` |
| `rankNoMeetings` | `No previous meetings` | `Aucune confrontation précédente` | `過去の対戦はありません` | `Sin enfrentamientos anteriores` | `Noch keine Duelle` |
| `rankMore` | `+{n} more` | `+{n} de plus` | `ほか{n}試合` | `+{n} más` | `+{n} weitere` |
| `medalTitle` | `Medal table` | `Tableau des médailles` | `メダル獲得表` | `Medallero` | `Medaillenspiegel` |
| `medalNone` | `No medals yet` | `Aucune médaille pour l’instant` | `まだメダルはありません` | `Aún no hay medallas` | `Noch keine Medaillen` |
| `medalGold` | `Gold` | `Or` | `金メダル` | `Oro` | `Gold` |
| `medalSilver` | `Silver` | `Argent` | `銀メダル` | `Plata` | `Silber` |
| `medalBronze` | `Bronze` | `Bronze` | `銅メダル` | `Bronce` | `Bronze` |
| `medalGoldShort` | `G` | `O` | `金` | `O` | `G` |
| `medalSilverShort` | `S` | `A` | `銀` | `P` | `S` |
| `medalBronzeShort` | `B` | `B` | `銅` | `B` | `B` |
| `medalTotal` | `Total` | `Total` | `合計` | `Total` | `Gesamt` |
| `medalLine` | `{g} gold, {s} silver, {b} bronze, {t} total` | `{g} or, {s} argent, {b} bronze, {t} au total` | `金{g}、銀{s}、銅{b}、合計{t}` | `{g} oro, {s} plata, {b} bronce, {t} en total` | `{g} Gold, {s} Silber, {b} Bronze, {t} gesamt` |
| `medalRank` | `{n}` | `{n}` | `{n}位` | `{n}` | `{n}` |
| `rbResult` | `Result` | `Résultat` | `結果` | `Resultado` | `Ergebnis` |

Holes in a phrase are filled in (`{n}`, `{a}`, `{b}`, `{sa}`, `{sb}`, `{w}`, `{name}`, `{round}`, `{tie}`, `{notes}`); `␣` stands for a no-break space (the French writes one before a colon).
