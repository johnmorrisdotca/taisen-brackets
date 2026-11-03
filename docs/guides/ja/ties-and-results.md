---
title: 対戦と結果
section: how-to
order: 10
description: トーナメント表は対戦でできていて、対戦とは、誰が勝ち進むかを決めるために必要だったもののすべてです。
---

トーナメント表は対戦でできていて、対戦とは、誰が勝ち進むかを決めるために必要だったもののすべてです。一試合、7戦4勝制のシリーズ、合計スコアで決める 2 試合、再試合などです。このガイドでは、それぞれの書き方、勝者の求め方、ルールがデータにないときに自分で決める方法を示します。全体の表は[レイアウト](../../layout.md)にあります。

## 対戦はどう読まれるか

| 書くもの | 意味 | 勝者 |
| --- | --- | --- |
| `score: [a, b]` | 一試合 | 得点の多い側、同点なら PK 戦の `pens`、それもなければまだ決まっていない |
| `bestOf: 7, score: [4, 2]` | シリーズ | `bestOf` の試合数のうち、多く勝った側 |
| `bestOf: 7, games: [...]` | 試合から数えるシリーズ | 同じ |
| `kind: "aggregate", legs: [...]` | 2 試合（レグ） | 合計の多い側、同じなら最後のレグの `pens` |
| `games: [{...}, { replay: true, ... }]` | 再試合になった試合 | 再試合の勝者 |
| これらのどれかに `winner: "A"` | 上と同じ | 指定した側 |

スコアは `sides` の順に書きます。誰も勝っていない対戦は勝者なしで描かれ、次のラウンドにはその場所に「TBD」が出ます。

## 2 試合、再試合、PK 戦

```js
import { layoutBracket } from "@johnmorrisdotca/taisen-brackets";

const layout = layoutBracket([
  { id: "a", sides: ["Aurora", "Harbour"], kind: "aggregate", legs: [{ score: [2, 0] }, { score: [0, 1] }] },
  { id: "b", sides: ["Cascade", "Delta"], games: [{ score: [1, 1] }, { score: [2, 0], replay: true }] },
  { id: "c", sides: ["Aurora", "Cascade"], score: [1, 1], extraTime: true, pens: [3, 5] },
]);

for (const tie of layout.ties) console.log(tie.result.kind, tie.result.score.join("-"), tie.sides[tie.winner].name);
// aggregate 2-1 Aurora
// replay 2-0 Cascade
// game 1-1 Cascade
```

引き分けて再試合になった試合は、1934 年と 1938 年のワールドカップのように、再試合で決まる一つの対戦として扱います。合計スコアが並んだときは PK 戦が決めます。それ以外（アウェーゴール、コイントスなど）は、`winner` を自分で指定し、`note` を添えてください。ボックスに表示されます。

## シリーズ

```js
import { drawBracket, playoffFormat } from "@johnmorrisdotca/taisen-brackets";

const svg = drawBracket({
  teams: [
    { id: "FLA", name: "Florida Panthers", abbr: "FLA", group: "Eastern" }, { id: "BOS", name: "Boston Bruins", abbr: "BOS", group: "Eastern" },
    { id: "EDM", name: "Edmonton Oilers", abbr: "EDM", group: "Western" }, { id: "DAL", name: "Dallas Stars", abbr: "DAL", group: "Western" },
  ],
  matchups: [
    { sides: ["FLA", "BOS"], bestOf: 7, score: [4, 2], date: "2024-05-06" },
    { sides: ["DAL", "EDM"], bestOf: 7, score: [2, 4], date: "2024-05-23" },
    { sides: ["FLA", "EDM"], bestOf: 7, score: [4, 3], date: "2024-06-08" },
  ],
}, { roundNames: playoffFormat("nhl", 2024), title: "Stanley Cup playoffs 2024" });
console.log(svg.includes("Eastern"), svg.includes("Stanley Cup Final")); // true true
```

`bestOf` も `winner` もないシリーズは、勝った試合数がどうであれ、決着していないものとして扱います。シリーズの長さをパッケージは推測しません。チームの `group` がきれいに二分するときは、トーナメント表の二つの半分がその名前で呼ばれます。

## フラットな試合リストから

多くのデータソースは、1 試合 1 行で、ステージ付きのフラットなリストを返します。`matchupsFromGames` は、それをステージと組み合わせごとに対戦にまとめます。同じステージで同じ組み合わせの試合が複数あれば再試合です。ただしそのステージが 2 試合制（`aggregate`）かシリーズ（`series`）の場合は別です。

```js
import { drawBracket, matchupsFromGames } from "@johnmorrisdotca/taisen-brackets";

const matchups = matchupsFromGames(
  [
    { stage: "semi", home: "ARG", away: "CRO", homeScore: 3, awayScore: 0, date: "2022-12-13" },
    { stage: "semi", home: "FRA", away: "MAR", homeScore: 2, awayScore: 0, date: "2022-12-14" },
    { stage: "third", home: "CRO", away: "MAR", homeScore: 2, awayScore: 1, date: "2022-12-17" },
    { stage: "final", home: "ARG", away: "FRA", homeScore: 3, awayScore: 3, extraTime: true, homePens: 4, awayPens: 2, date: "2022-12-18" },
  ],
  { stages: ["semi", "final"], third: "third" },
);
console.log(matchups.length, drawBracket(matchups).startsWith("<svg")); // 4 true
```

3 位決定戦はトーナメントのツリーから離れて置かれ、どこにもつながらない対戦はその下に描かれます。

## 対戦を自分で読む

`layoutBracket` が返す対戦は、結果をデータ（`kind`、`score`、`winner`）として持ちます。`describeTie(tie, voice)` は同じ結果を文にします（ボックスのツールチップです）。そのため、自分では描かなかった対戦の結果をページに出せます。`resolveMatchup` はその下にある関数です。

```js
import { describeTie, layoutBracket, voiceOf } from "@johnmorrisdotca/taisen-brackets";

const final = layoutBracket([{ sides: ["Argentina", "France"], score: [3, 3], extraTime: true, pens: [4, 2] }]).ties[0];
console.log(final.result.kind, final.result.score.join("-"), final.sides[final.winner].name); // game 3-3 Argentina
console.log(describeTie(final, voiceOf("en"))); // Argentina 3, France 3 (after extra time, 4–2 on penalties). Winner: Argentina
```

## 総当たりの試合

`round: 0` の試合はグループステージの試合です。`groups` レイアウトが表を描き、`groupStandings` は表をデータとして、`groupsTable` は HTML として返します。[レイアウトと見た目](layouts-and-looks.md#九つのレイアウト)を参照してください。
