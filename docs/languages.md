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

## What stays the same in every language

- **Clubs and people** keep their names. A national team's name comes from `Intl.DisplayNames` by its ISO 3166 code (`countryName`), or from `Team.names`, or from a `teamName` function; the demo writes by hand only the two states that no longer exist (Czechoslovakia, the Dutch East Indies), after the form each language's Wikipedia gives, and the home nations are in `src/locales.ts`.
- **A team's short name** (`NED`, `ARG`) is the FIFA code in every language.
- **The league's own name** (Stanley Cup, Grey Cup, Super Bowl, World Series) is as each language writes it: *Finale de la Coupe Stanley*, *Stanley-Cup-Finale*, *Coupe Grey*, *Série mondiale*, *スーパーボウル*, *Super Bowl*.
- **Numbers and dates** are written by `Intl` for the language (`voiceOf(...).number`, `.date`): *Dec 18, 2022*, *18 déc. 2022*, *2022/12/18*, *18 dic 2022*, *18.12.2022*.
- **A title or a subtitle** (`title`, `subtitle`) is your text, not the package's: the demo gives each language's Wikipedia title of the World Cup for the World Cup examples (and the subtitle of the poster in each language), and a name that needs no translation (`NHL 2024`) for the leagues. Those strings are the demo's and were not read by a reviewer.
- **Capitals** follow the language's rules (`toLocaleUpperCase`), and Japanese is never upper-cased.

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

Holes in a phrase are filled in (`{n}`, `{a}`, `{b}`, `{sa}`, `{sb}`, `{w}`, `{name}`, `{round}`, `{tie}`, `{notes}`); `␣` stands for a no-break space (the French writes one before a colon).
