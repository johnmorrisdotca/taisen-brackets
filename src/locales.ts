import type { DrawOptions, Locale, Team, Words } from "./types.ts";

/**
 * The languages: English, French, Japanese, Spanish and German. A language is its words (every text a drawing and a table write),
 * the names of the rounds by their English names, and the tag that `Intl` formats numbers and dates for. Football terms (the
 * rounds of the World Cup, extra time, the shoot-out) were checked against each language's Wikipedia article on the 2022 World Cup
 * (docs/languages.md); the other leagues' round names are the generic words, and a league's own proper name (the Stanley Cup, the
 * Grey Cup, the Super Bowl) is kept in its conventional form for the language.
 */

const EN: Words = {
  tbd: "TBD", bye: "bye", walkover: "walkover", champion: "Champion", thirdPlace: "Third place", other: "Other ties",
  aet: "a.e.t.", pens: "pens", aggregate: "agg.", replay: "replay",
  aetLong: "after extra time", pensScore: "{a}–{b} on penalties", aggregateLong: "on aggregate",
  inGames: "in {n}", bestOf: "best of {n}", round: "Round {n}", roundOf: "Round of {n}",
  tieVs: "{a} v {b}", tieScore: "{a} {sa}, {b} {sb}", scoreText: "{a}–{b}", winnerIs: "Winner: {name}", championIs: "Champion: {name}", finalLine: "{round}: {tie}",
  summary: "{n} teams, {r} rounds", summaryOne: "{n} teams, 1 round", sep: ". ", end: ".", note: " ({notes})", noteJoin: ", ",
  columnRound: "Round", columnTie: "Tie", columnNote: "Note", columnDate: "Date", title: "Knockout bracket",
  roadTitle: "Road to the final", roadVs: "v", roadGroup: "Group stage", roadFt: "FT", roadAet: "AET", roadPens: "{a}–{b} pens",
  roadWon: "Won", roadLost: "Lost", roadDrew: "Drew", roadQuarterFinal: "Quarter-final", roadSemiFinal: "Semi-final",
  roadTableTeam: "Team", roadTableOpponent: "Opponent", roadTableScore: "Score", roadTableDecided: "Decided", roadTableResult: "Result",
  roadCaption: "{a} and {b}: every match on the way to the final. Scores are written with the team in the first column first.",
  roadName: "{a} and {b}: {title}", roadSummary: "Matches played before the final: {a} ({an}) and {b} ({bn}).",
  roadFinal: "The final: {a} {score} {b} ({how}).", roadChampion: "{name} won the final.", roadToPlay: "The final is still to be played.",
  vs: "vs", at: "AT", groupName: "Group {n}", colPlayed: "P", colWon: "W", colDrawn: "D", colLost: "L", colDiff: "GD", colPoints: "Pts",
  playIn: "Play-in", playInWinner: "Winner {a}/{b}", playInLoser: "Loser {a}/{b}", seedSlot: "Seed {n}", winnerOf: "Winner of {name}", loserOf: "Loser of {name}",
  judoIppon: "I", judoWazaAri: "W", judoYuko: "Y", judoIpponLong: "ippon", judoWazaAriLong: "waza-ari", judoYukoLong: "yuko",
  judoMethodIppon: "ippon", judoMethodAwasete: "waza-ari awasete ippon", judoMethodScore: "decision", judoMethodHansoku: "hansoku-make", judoMethodFusen: "fusen-gachi", judoMethodKiken: "kiken-gachi",
  judoGolden: "GS", judoGoldenLong: "golden score", judoTime: "{t}", judoShidoOf: "{name}: {n} shido", judoShidoShort: "shido {a}–{b}",
  judoRepechage: "Repechage", judoBronze: "Bronze medal contest", judoRepechageBronze: "Repechage and bronze medal contests", judoWhite: "white", judoBlue: "blue",
  judoWeightClass: "{sex} -{w} kg", judoWeightOver: "{sex} +{w} kg", judoMen: "Men", judoWomen: "Women",
};

const FR: Words = {
  tbd: "À déterminer", bye: "exempt", walkover: "forfait", champion: "Champion", thirdPlace: "Match pour la troisième place", other: "Autres rencontres",
  aet: "a.p.", pens: "t.a.b.", aggregate: "cumulé", replay: "match rejoué",
  aetLong: "après prolongation", pensScore: "{a}–{b} aux tirs au but", aggregateLong: "au cumul",
  inGames: "en {n}", bestOf: "au meilleur des {n}", round: "Tour {n}", roundOf: "Tour à {n} équipes",
  tieVs: "{a} contre {b}", tieScore: "{a} {sa}, {b} {sb}", scoreText: "{a}–{b}", winnerIs: "Vainqueur : {name}", championIs: "Champion : {name}", finalLine: "{round} : {tie}",
  summary: "{n} équipes, {r} tours", summaryOne: "{n} équipes, 1 tour", sep: ". ", end: ".", note: " ({notes})", noteJoin: ", ",
  columnRound: "Tour", columnTie: "Rencontre", columnNote: "Note", columnDate: "Date", title: "Tableau à élimination directe",
  roadTitle: "Parcours vers la finale", roadVs: "vs", roadGroup: "Phase de groupes", roadFt: "t.r.", roadAet: "a.p.", roadPens: "{a}–{b} t.a.b.",
  roadWon: "Victoire", roadLost: "Défaite", roadDrew: "Nul", roadQuarterFinal: "Quart de finale", roadSemiFinal: "Demi-finale",
  roadTableTeam: "Équipe", roadTableOpponent: "Adversaire", roadTableScore: "Score", roadTableDecided: "Décidé en", roadTableResult: "Résultat",
  roadCaption: "{a} et {b} : tous les matchs jusqu’à la finale. Chaque score commence par celui de l’équipe de la première colonne.",
  roadName: "{a} et {b} : {title}", roadSummary: "Matchs joués avant la finale : {a} ({an}) et {b} ({bn}).",
  roadFinal: "La finale : {a} {score} {b} ({how}).", roadChampion: "{name} a remporté la finale.", roadToPlay: "La finale reste à jouer.",
  vs: "vs", at: "À", groupName: "Groupe {n}", colPlayed: "PJ", colWon: "V", colDrawn: "N", colLost: "D", colDiff: "+/-", colPoints: "Pts",
  playIn: "Play-in", playInWinner: "Gagnant {a}/{b}", playInLoser: "Perdant {a}/{b}", seedSlot: "N°\u00a0{n}", winnerOf: "Gagnant du match {name}", loserOf: "Perdant du match {name}",
  judoIppon: "I", judoWazaAri: "W", judoYuko: "Y", judoIpponLong: "ippon", judoWazaAriLong: "waza-ari", judoYukoLong: "yuko",
  judoMethodIppon: "ippon", judoMethodAwasete: "waza-ari awasete ippon", judoMethodScore: "décision", judoMethodHansoku: "hansoku-make", judoMethodFusen: "fusen-gachi", judoMethodKiken: "kiken-gachi",
  judoGolden: "GS", judoGoldenLong: "golden score", judoTime: "{t}", judoShidoOf: "{name}\u00a0: {n}\u00a0shido", judoShidoShort: "shido {a}–{b}",
  judoRepechage: "Repêchage", judoBronze: "Combat pour la médaille de bronze", judoRepechageBronze: "Repêchages et combats pour la médaille de bronze", judoWhite: "blanc", judoBlue: "bleu",
  judoWeightClass: "{sex} -{w}\u00a0kg", judoWeightOver: "{sex} +{w}\u00a0kg", judoMen: "Hommes", judoWomen: "Femmes",
};

const JA: Words = {
  tbd: "未定", bye: "シード", walkover: "不戦勝", champion: "優勝", thirdPlace: "3位決定戦", other: "その他の対戦",
  aet: "延長", pens: "PK戦", aggregate: "合計", replay: "再試合",
  aetLong: "延長戦", pensScore: "PK戦 {a}–{b}", aggregateLong: "合計スコア",
  inGames: "{n}戦", bestOf: "{n}戦{w}勝制", round: "第{n}ラウンド", roundOf: "ラウンド{n}",
  tieVs: "{a} 対 {b}", tieScore: "{a} {sa}–{sb} {b}", scoreText: "{a}–{b}", winnerIs: "勝者：{name}", championIs: "優勝：{name}", finalLine: "{round}：{tie}",
  summary: "{n}チーム、{r}ラウンド", summaryOne: "{n}チーム、1ラウンド", sep: "。", end: "。", note: "（{notes}）", noteJoin: "、",
  columnRound: "ラウンド", columnTie: "対戦", columnNote: "備考", columnDate: "日付", title: "トーナメント表",
  roadTitle: "決勝への道", roadVs: "対", roadGroup: "グループステージ", roadFt: "規定時間", roadAet: "延長", roadPens: "PK戦 {a}–{b}",
  roadWon: "勝ち", roadLost: "負け", roadDrew: "引き分け", roadQuarterFinal: "準々決勝", roadSemiFinal: "準決勝",
  roadTableTeam: "チーム", roadTableOpponent: "対戦相手", roadTableScore: "スコア", roadTableDecided: "決着", roadTableResult: "結果",
  roadCaption: "{a}と{b}：決勝までの全試合。スコアは「チーム」列のチームの得点を先に書いています。",
  roadName: "{a}と{b}：{title}", roadSummary: "{a}は決勝までに{an}試合、{b}は{bn}試合を戦いました。",
  roadFinal: "決勝は{a} {score} {b}（{how}）でした。", roadChampion: "{name}が優勝しました。", roadToPlay: "決勝はまだ行われていません。",
  vs: "対", at: "@", groupName: "グループ{n}", colPlayed: "試合", colWon: "勝", colDrawn: "分", colLost: "敗", colDiff: "得失差", colPoints: "勝点",
  playIn: "プレイイン", playInWinner: "{a}/{b}の勝者", playInLoser: "{a}/{b}の敗者", seedSlot: "第{n}シード", winnerOf: "{name}の勝者", loserOf: "{name}の敗者",
  judoIppon: "一", judoWazaAri: "技", judoYuko: "有", judoIpponLong: "一本", judoWazaAriLong: "技あり", judoYukoLong: "有効",
  judoMethodIppon: "一本", judoMethodAwasete: "合わせ技一本", judoMethodScore: "優勢勝ち", judoMethodHansoku: "反則勝ち", judoMethodFusen: "不戦勝", judoMethodKiken: "棄権勝ち",
  judoGolden: "GS", judoGoldenLong: "ゴールデンスコア", judoTime: "{t}", judoShidoOf: "{name}：指導{n}", judoShidoShort: "指導{a}–{b}",
  judoRepechage: "敗者復活戦", judoBronze: "銅メダル決定戦", judoRepechageBronze: "敗者復活戦と銅メダル決定戦", judoWhite: "白", judoBlue: "青",
  judoWeightClass: "{sex}{w}kg級", judoWeightOver: "{sex}{w}kg超級", judoMen: "男子", judoWomen: "女子",
};

const ES: Words = {
  tbd: "Por definir", bye: "exento", walkover: "incomparecencia", champion: "Campeón", thirdPlace: "Partido por el tercer puesto", other: "Otros partidos",
  aet: "prórroga", pens: "penales", aggregate: "global", replay: "desempate",
  aetLong: "tras la prórroga", pensScore: "{a}–{b} en los penales", aggregateLong: "en el global",
  inGames: "en {n}", bestOf: "al mejor de {n}", round: "Ronda {n}", roundOf: "Ronda de {n}",
  tieVs: "{a} vs. {b}", tieScore: "{a} {sa}, {b} {sb}", scoreText: "{a}–{b}", winnerIs: "Ganador: {name}", championIs: "Campeón: {name}", finalLine: "{round}: {tie}",
  summary: "{n} equipos, {r} rondas", summaryOne: "{n} equipos, 1 ronda", sep: ". ", end: ".", note: " ({notes})", noteJoin: ", ",
  columnRound: "Ronda", columnTie: "Partido", columnNote: "Nota", columnDate: "Fecha", title: "Cuadro de eliminatorias",
  roadTitle: "El camino a la final", roadVs: "vs.", roadGroup: "Fase de grupos", roadFt: "T. reg.", roadAet: "Prórroga", roadPens: "{a}–{b} en los penales",
  roadWon: "Ganó", roadLost: "Perdió", roadDrew: "Empató", roadQuarterFinal: "Cuartos de final", roadSemiFinal: "Semifinal",
  roadTableTeam: "Equipo", roadTableOpponent: "Rival", roadTableScore: "Marcador", roadTableDecided: "Decidido en", roadTableResult: "Resultado",
  roadCaption: "{a} y {b}: todos los partidos hasta la final. Los marcadores empiezan por el equipo de la primera columna.",
  roadName: "{a} y {b}: {title}", roadSummary: "Partidos jugados hasta la final: {a} ({an}) y {b} ({bn}).",
  roadFinal: "La final: {a} {score} {b} ({how}).", roadChampion: "{name} ganó la final.", roadToPlay: "La final aún no se ha jugado.",
  vs: "vs.", at: "EN", groupName: "Grupo {n}", colPlayed: "PJ", colWon: "G", colDrawn: "E", colLost: "P", colDiff: "DG", colPoints: "Pts",
  playIn: "Play-in", playInWinner: "Ganador {a}/{b}", playInLoser: "Perdedor {a}/{b}", seedSlot: "Puesto {n}", winnerOf: "Ganador de {name}", loserOf: "Perdedor de {name}",
  judoIppon: "I", judoWazaAri: "W", judoYuko: "Y", judoIpponLong: "ippon", judoWazaAriLong: "waza-ari", judoYukoLong: "yuko",
  judoMethodIppon: "ippon", judoMethodAwasete: "waza-ari awasete ippon", judoMethodScore: "decisión", judoMethodHansoku: "hansoku-make", judoMethodFusen: "fusen-gachi", judoMethodKiken: "kiken-gachi",
  judoGolden: "GS", judoGoldenLong: "golden score", judoTime: "{t}", judoShidoOf: "{name}: {n} shido", judoShidoShort: "shido {a}–{b}",
  judoRepechage: "Repesca", judoBronze: "Combate por la medalla de bronce", judoRepechageBronze: "Repesca y combates por la medalla de bronce", judoWhite: "blanco", judoBlue: "azul",
  judoWeightClass: "{sex} -{w} kg", judoWeightOver: "{sex} +{w} kg", judoMen: "Hombres", judoWomen: "Mujeres",
};

const DE: Words = {
  tbd: "offen", bye: "Freilos", walkover: "kampflos", champion: "Turniersieger", thirdPlace: "Spiel um Platz 3", other: "Weitere Begegnungen",
  aet: "n. V.", pens: "i. E.", aggregate: "ges.", replay: "Wiederholungsspiel",
  aetLong: "nach Verlängerung", pensScore: "{a}:{b} im Elfmeterschießen", aggregateLong: "im Gesamtergebnis",
  inGames: "in {n}", bestOf: "Best of {n}", round: "Runde {n}", roundOf: "Runde der letzten {n}",
  tieVs: "{a} gegen {b}", tieScore: "{a} {sa}, {b} {sb}", scoreText: "{a}:{b}", winnerIs: "Sieger: {name}", championIs: "Turniersieger: {name}", finalLine: "{round}: {tie}",
  summary: "{n} Teams, {r} Runden", summaryOne: "{n} Teams, 1 Runde", sep: ". ", end: ".", note: " ({notes})", noteJoin: ", ",
  columnRound: "Runde", columnTie: "Begegnung", columnNote: "Hinweis", columnDate: "Datum", title: "Turnierbaum",
  roadTitle: "Der Weg ins Finale", roadVs: "vs.", roadGroup: "Gruppenphase", roadFt: "reg. Zeit", roadAet: "n. V.", roadPens: "{a}:{b} i. E.",
  roadWon: "Sieg", roadLost: "Niederlage", roadDrew: "Remis", roadQuarterFinal: "Viertelfinale", roadSemiFinal: "Halbfinale",
  roadTableTeam: "Team", roadTableOpponent: "Gegner", roadTableScore: "Ergebnis", roadTableDecided: "Entschieden", roadTableResult: "Ausgang",
  roadCaption: "{a} und {b}: alle Spiele auf dem Weg ins Finale. Die Ergebnisse beginnen mit dem Team der ersten Spalte.",
  roadName: "{a} und {b}: {title}", roadSummary: "Spiele bis zum Finale: {a} ({an}) und {b} ({bn}).",
  roadFinal: "Das Finale: {a} {score} {b} ({how}).", roadChampion: "{name} gewann das Finale.", roadToPlay: "Das Finale steht noch aus.",
  vs: "vs.", at: "BEI", groupName: "Gruppe {n}", colPlayed: "Sp", colWon: "S", colDrawn: "U", colLost: "N", colDiff: "Diff.", colPoints: "Pkt",
  playIn: "Play-in", playInWinner: "Sieger {a}/{b}", playInLoser: "Verlierer {a}/{b}", seedSlot: "Platz {n}", winnerOf: "Sieger von {name}", loserOf: "Verlierer von {name}",
  judoIppon: "I", judoWazaAri: "W", judoYuko: "Y", judoIpponLong: "Ippon", judoWazaAriLong: "Waza-ari", judoYukoLong: "Yuko",
  judoMethodIppon: "Ippon", judoMethodAwasete: "Waza-ari awasete Ippon", judoMethodScore: "Punktsieg", judoMethodHansoku: "Hansoku-make", judoMethodFusen: "Fusen-gachi", judoMethodKiken: "Kiken-gachi",
  judoGolden: "GS", judoGoldenLong: "Golden Score", judoTime: "{t}", judoShidoOf: "{name}: {n} Shido", judoShidoShort: "Shido {a}–{b}",
  judoRepechage: "Hoffnungsrunde", judoBronze: "Kampf um Bronze", judoRepechageBronze: "Hoffnungsrunde und Kämpfe um Bronze", judoWhite: "weiß", judoBlue: "blau",
  judoWeightClass: "{sex} -{w} kg", judoWeightOver: "{sex} +{w} kg", judoMen: "Herren", judoWomen: "Damen",
};

/**
 * The round names, English name first. The football rounds are the terms of each language's Wikipedia article on the World Cup;
 * the leagues' rounds are the generic words (first round, semi-finals), and the league's own name is kept as the language writes it.
 */
const ROUNDS: Record<string, readonly [fr: string, ja: string, es: string, de: string]> = {
  "Round of 32": ["Seizièmes de finale", "ラウンド32", "Dieciseisavos de final", "Sechzehntelfinale"],
  "Round of 16": ["Huitièmes de finale", "ラウンド16", "Octavos de final", "Achtelfinale"],
  "Quarter-finals": ["Quarts de finale", "準々決勝", "Cuartos de final", "Viertelfinale"],
  "Quarterfinals": ["Quarts de finale", "準々決勝", "Cuartos de final", "Viertelfinale"],
  "Semi-finals": ["Demi-finales", "準決勝", "Semifinales", "Halbfinale"],
  "Semifinals": ["Demi-finales", "準決勝", "Semifinales", "Halbfinale"],
  "Final": ["Finale", "決勝", "Final", "Finale"],
  "Preliminary Round": ["Tour préliminaire", "予選ラウンド", "Ronda preliminar", "Vorrunde"],
  "Qualifying Round": ["Tour de qualification", "予選ラウンド", "Ronda de clasificación", "Qualifikationsrunde"],
  "First Round": ["Premier tour", "1回戦", "Primera ronda", "Erste Runde"],
  "Second Round": ["Deuxième tour", "2回戦", "Segunda ronda", "Zweite Runde"],
  "Division Semifinals": ["Demi-finales de division", "ディビジョン準決勝", "Semifinales de división", "Division-Halbfinale"],
  "Division Finals": ["Finales de division", "ディビジョン決勝", "Finales de división", "Division-Finale"],
  "Conference Quarterfinals": ["Quarts de finale de conférence", "カンファレンス準々決勝", "Cuartos de final de conferencia", "Conference-Viertelfinale"],
  "Conference Semifinals": ["Demi-finales de conférence", "カンファレンス準決勝", "Semifinales de conferencia", "Conference-Halbfinale"],
  "Conference Finals": ["Finales de conférence", "カンファレンス決勝", "Finales de conferencia", "Conference-Finale"],
  "Stanley Cup Semifinals": ["Demi-finales de la Coupe Stanley", "スタンレー・カップ準決勝", "Semifinales de la Stanley Cup", "Stanley-Cup-Halbfinale"],
  "Stanley Cup Final": ["Finale de la Coupe Stanley", "スタンレー・カップ・ファイナル", "Final de la Stanley Cup", "Stanley-Cup-Finale"],
  "NBA Finals": ["Finale de la NBA", "NBAファイナル", "Finales de la NBA", "NBA-Finale"],
  "Wild Card Game": ["Match de wild card", "ワイルドカードゲーム", "Juego de comodín", "Wild-Card-Spiel"],
  "Wild Card Series": ["Série de wild card", "ワイルドカードシリーズ", "Serie de comodín", "Wild-Card-Serie"],
  "Division Series": ["Série de division", "ディビジョンシリーズ", "Serie divisional", "Division Series"],
  "League Championship Series": ["Série de championnat", "リーグチャンピオンシップシリーズ", "Serie de Campeonato de Liga", "League Championship Series"],
  "World Series": ["Série mondiale", "ワールドシリーズ", "Serie Mundial", "World Series"],
  "Wild Card Round": ["Tour de wild card", "ワイルドカードラウンド", "Ronda de comodín", "Wild-Card-Runde"],
  "Round One": ["Premier tour", "1回戦", "Primera ronda", "Erste Runde"],
  "MLS Cup": ["Coupe MLS", "MLSカップ", "Copa MLS", "MLS Cup"],
  "Wild Card": ["Wild card", "ワイルドカード・プレーオフ", "Comodín", "Wild-Card-Runde"],
  "Divisional": ["Ronde divisionnaire", "ディビジョナル・プレーオフ", "Ronda divisional", "Divisional Round"],
  "Divisional Playoffs": ["Ronde divisionnaire", "ディビジョナル・プレーオフ", "Ronda divisional", "Divisional Round"],
  "Conference Championship": ["Finale de conférence", "カンファレンス・チャンピオンシップ", "Campeonato de conferencia", "Conference Championship"],
  "Conference Championships": ["Finales de conférence", "カンファレンス・チャンピオンシップ", "Campeonatos de conferencia", "Conference Championships"],
  "Super Bowl": ["Super Bowl", "スーパーボウル", "Super Bowl", "Super Bowl"],
  "Division Semi-Final": ["Demi-finale de division", "ディビジョン準決勝", "Semifinal de división", "Division-Halbfinale"],
  "Division Final": ["Finale de division", "ディビジョン決勝", "Final de división", "Division-Finale"],
  "Grey Cup": ["Coupe Grey", "グレイ・カップ", "Grey Cup", "Grey Cup"],
};

const rounds = (index: 0 | 1 | 2 | 3): Record<string, string> => Object.fromEntries(Object.entries(ROUNDS).map(([en, names]) => [en, names[index]]));

/** The built-in languages, by code. */
export const LOCALES: Readonly<Record<"en" | "fr" | "ja" | "es" | "de", Locale>> = Object.freeze({
  en: { code: "en", tag: "en", words: EN, rounds: {} },
  fr: { code: "fr", tag: "fr", words: FR, rounds: rounds(0) },
  ja: { code: "ja", tag: "ja", words: JA, rounds: rounds(1) },
  es: { code: "es", tag: "es", words: ES, rounds: rounds(2) },
  de: { code: "de", tag: "de", words: DE, rounds: rounds(3) },
});

/** The codes of the built-in languages, English first. */
export const LOCALE_CODES: readonly string[] = Object.freeze(["en", "fr", "ja", "es", "de"]);

/** The English words, as they were before there were languages. */
export const WORDS: Readonly<Words> = LOCALES.en.words;

/**
 * A language of your own: what you give, on top of the base language's (English unless `base` says another) for what you leave out.
 * `tag` is what `Intl` formats numbers and dates with (default `code`).
 */
export function defineLocale(code: string, parts: { tag?: string; words?: Partial<Words>; rounds?: Readonly<Record<string, string>> }, base: keyof typeof LOCALES = "en"): Locale {
  const from = LOCALES[base];
  return { code, tag: parts.tag ?? code, words: { ...from.words, ...parts.words }, rounds: { ...from.rounds, ...parts.rounds } };
}

/** The language an option names: a code of a built-in one, or a `Locale`. */
export function localeOf(option: string | Locale | undefined): Locale {
  if (option === undefined) return LOCALES.en;
  if (typeof option !== "string") return option;
  const hit = (LOCALES as Record<string, Locale | undefined>)[option] ?? (LOCALES as Record<string, Locale | undefined>)[option.split("-")[0]];
  if (!hit) throw new Error(`taisen-brackets: no language ${JSON.stringify(option)}; the built-in ones are ${LOCALE_CODES.join(", ")} (defineLocale makes another)`);
  return hit;
}

/** A language ready to write with: the words with any replacements, and the formats. */
export interface Voice {
  locale: Locale;
  words: Words;
  /** A number in the language's own digits and separators. */
  number(n: number): string;
  /** A date as the language writes it ("Dec 18, 2022", "2022/12/18"), or `null` when `iso` does not start with a date. */
  date(iso: string): string | null;
  /** Capitals, by the language's own rules (not for Japanese). */
  upper(text: string): string;
  /** A round's name in the language. */
  round(name: string): string;
  /** A team's name in the language. */
  team(team: Team): string;
}

export function voiceOf(options: Pick<DrawOptions, "locale" | "words" | "teamName">): Voice {
  const locale = localeOf(options.locale);
  const words = options.words ? { ...locale.words, ...options.words } : locale.words;
  const numbers = new Intl.NumberFormat(locale.tag);
  const dates = new Intl.DateTimeFormat(locale.tag, { dateStyle: "medium", timeZone: "UTC" });
  return {
    locale,
    words,
    number: (n) => numbers.format(n),
    date: (iso) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
      return m ? dates.format(new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))) : null;
    },
    upper: (text) => (locale.code === "ja" ? text : text.toLocaleUpperCase(locale.tag)),
    round: (name) => {
      const hit = locale.rounds[name];
      if (hit !== undefined) return hit;
      const of = /^Round of (\d+)$/.exec(name);
      return of ? fill(words.roundOf, { n: of[1] }) : name;
    },
    team: (team) => options.teamName?.(team, locale) ?? team.names?.[locale.code] ?? team.name,
  };
}

/** Fills `{n}`-style holes in a phrase. */
export function fill(phrase: string, values: Record<string, string | number>): string {
  return phrase.replace(/\{(\w+)\}/g, (hole, key: string) => (key in values ? String(values[key]) : hole));
}

const SUBDIVISIONS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "GB-ENG": { en: "England", fr: "Angleterre", ja: "イングランド", es: "Inglaterra", de: "England" },
  "GB-SCT": { en: "Scotland", fr: "Écosse", ja: "スコットランド", es: "Escocia", de: "Schottland" },
  "GB-WLS": { en: "Wales", fr: "Pays de Galles", ja: "ウェールズ", es: "Gales", de: "Wales" },
  "GB-NIR": { en: "Northern Ireland", fr: "Irlande du Nord", ja: "北アイルランド", es: "Irlanda del Norte", de: "Nordirland" },
};

/**
 * The name of a country in a language, from its ISO 3166 code, through `Intl.DisplayNames`: no list to write ("DE" is
 * Germany, Allemagne, ドイツ, Alemania, Deutschland). The home nations (`GB-ENG`, `GB-SCT`, `GB-WLS`, `GB-NIR`) are not regions
 * to `Intl`, so they have names here. A code `Intl` does not know gives `undefined`.
 */
export function countryName(code: string, locale: string | Locale = "en"): string | undefined {
  const l = localeOf(locale);
  const sub = SUBDIVISIONS[code.toUpperCase()];
  if (sub) return sub[l.code] ?? sub.en;
  try {
    const names = new Intl.DisplayNames([l.tag], { type: "region" });
    const name = names.of(code.toUpperCase());
    return name && name !== code.toUpperCase() ? name : undefined;
  } catch {
    return undefined;
  }
}
