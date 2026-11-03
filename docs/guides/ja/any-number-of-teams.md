---
title: 任意のチーム数のトーナメント表
section: how-to
order: 11
description: 結果が出る前にトーナメント表が必要なことがあります。
---

結果が出る前にトーナメント表が必要なことがあります。これから始まる大会や、試合が進むにつれて埋まっていく大会です。このガイドでは、任意のチーム数のツリーを作り、標準の方法でシードを割り当て、上位シードに 1 回戦免除（バイ）を与え、勝者を次へ進めます。

## ツリーを作る

`singleElimination(teams, options?)` は、シングルエリミネーション（一発勝負）のトーナメントの対戦を、ID、ラウンド、どの対戦がどこにつながるかを示す `feeds` つきで返します。6 チームなら 1 回戦は 2 対戦になります。上位 2 シードがバイになるからです。

```js
import { drawBracket, singleElimination } from "@johnmorrisdotca/taisen-brackets";

const teams = Array.from({ length: 6 }, (_, i) => ({ id: `T${i + 1}`, name: `Team ${i + 1}` }));
const { matchups } = singleElimination(teams, { thirdPlace: true });
console.log(matchups.length); // 6
console.log(matchups.map((m) => m.id).join(" ")); // R1-2 R2-1 R1-4 R2-2 R3-1 R3rd
console.log(drawBracket({ teams, matchups }, { seeds: true }).includes("TBD")); // true
```

まだ決まっていない側は「TBD」と描かれます。チームのリストはシード順として扱われます。チームを自分で配置したいときは、`standardSeeds(size)` が 1 回戦の並びを返します。

```js
import { standardSeeds } from "@johnmorrisdotca/taisen-brackets";

console.log(standardSeeds(8).join(" ")); // 1 8 4 5 2 7 3 6
```

## 結果を次へ進める

試合が終わったら、対戦のリストにその `score` を設定して `advanceWinners` を呼びます。後のラウンドの側が、対戦の ID を手がかりに勝者で埋められ、結果は新しいリストになります。入力が変更されることはありません。

```js
import { advanceWinners, singleElimination } from "@johnmorrisdotca/taisen-brackets";

const teams = Array.from({ length: 6 }, (_, i) => ({ id: `T${i + 1}`, name: `Team ${i + 1}` }));
const { matchups } = singleElimination(teams, { thirdPlace: true });
const played = matchups.map((m) => (m.id === "R1-2" ? { ...m, score: [2, 1] } : m));
const next = advanceWinners(played);
console.log(next.find((m) => m.id === "R2-1").sides); // [ 'T1', 'T4' ]
console.log(matchups.find((m) => m.id === "R2-1").sides); // [ 'T1', null ]
```

上位シードは 1 回戦を免除されます。レイアウトは対戦のどちら側がバイだったかを知っていて（`box.bye`）、トーナメント表にもそれが出ます。

## ツリーを自分で指定する

ツリーが単純なトーナメントでない場合（プレーイン、組み合わせが固定された表）は、各対戦の `feeds` でツリーを指定します。その対戦に勝者を送り込む対戦の ID、または敗者が進む場合は `{ tie, result: "loser" }` です。敗者の接続線を描くのは `playin` レイアウトだけです。

```js
import { layoutBracket } from "@johnmorrisdotca/taisen-brackets";

const layout = layoutBracket({ matchups: [
  { id: "g78", stage: "play-in", sides: ["T7", "T8"], score: [105, 104] },
  { id: "g910", stage: "play-in", sides: ["T9", "T10"], score: [131, 116] },
  { id: "decider", stage: "play-in", sides: ["T8", "T9"], score: [112, 91], feeds: [{ tie: "g78", result: "loser" }, "g910"] },
] });
console.log(JSON.stringify(layout.ties[2].from)); // [{"tie":0,"result":"loser"},{"tie":1,"result":"winner"}]
console.log(layout.playIn.length); // 3
```

## 描画なしでレイアウトする

`layoutBracket`（描画コードを含まない `/layout` エントリーポイントにもあります）は、ラウンド、半分、行、バイ、結果をデータとして返します。これを使えば、キャンバスやフレームワークで自分でトーナメント表を描き、パッケージには難しい部分だけを任せられます。

```js
import { layoutBracket } from "@johnmorrisdotca/taisen-brackets/layout";

const layout = layoutBracket({
  teams: [{ id: "A", name: "Aurora", seed: 1 }, { id: "B", name: "Borealis", seed: 4 }, { id: "C", name: "Cascade", seed: 2 }, { id: "D", name: "Delta", seed: 3 }],
  matchups: [
    { id: "sf1", sides: ["A", "B"], score: [2, 0], date: "2026-05-01" },
    { id: "sf2", sides: ["C", "D"], score: [1, 2], date: "2026-05-02" },
    { id: "final", sides: ["A", "D"], score: [0, 1], date: "2026-05-09" },
  ],
});
console.log(layout.rounds, layout.champion.name, layout.shape); // 2 Delta halves
```

オプションと対戦のフィールドは[レイアウト](../../layout.md)に、描画での扱いは[レイアウトと見た目](layouts-and-looks.md)にあります。
