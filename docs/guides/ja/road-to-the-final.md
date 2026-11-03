---
title: 決勝への道
section: how-to
order: 16
description: トーナメント表は大会全体を見せます。
---

トーナメント表は大会全体を見せます。決勝への道の図が見せるのは二つの物語、つまり二つの決勝進出チームがどう勝ち上がったかだけです。決勝当日の SNS の投稿にふさわしい絵です。上に大きな丸いマークが二つ、中央にラウンドが下から上へ（最後が上）、両側にそれぞれのチームの試合が、二つのチームのマークの間にスコアを挟んで並びます。このガイドでは、手元の大会から、手で書いた二チームの道のりから、そして表として、それぞれ描きます。

## 大会から描く

`roadToFinal(input, options?)` は、`drawBracket` と同じ入力を受け取ります。決勝の二つの側が決勝進出チームで、それぞれが行った対戦がその道のりです。返すのは `{ options, title, summary, totals, draw(extra?), table(options?) }` で、作ったときのオプション、アクセシブルな名前、キャプション、図の裏づけの数値、SVG 文字列、HTML の表です。

```js
import { roadToFinal } from "@johnmorrisdotca/taisen-brackets";

const teams = [
  { id: "NED", name: "Netherlands" }, { id: "ARG", name: "Argentina" },
  { id: "CRO", name: "Croatia" }, { id: "BRA", name: "Brazil" },
];
const matchups = [
  { sides: ["NED", "ARG"], score: [2, 2], extraTime: true, pens: [3, 4], date: "2022-12-09" },
  { sides: ["CRO", "BRA"], score: [1, 1], extraTime: true, pens: [4, 2], date: "2022-12-09" },
  { sides: ["ARG", "CRO"], score: [3, 0], date: "2022-12-13" },
];

const road = roadToFinal({ teams, matchups }, { title: "Qatar 2022", size: "wide" });
console.log(road.totals.champion); // Argentina
console.log(road.summary); // Matches played before the final: Argentina (1) and Croatia (1). The final: Argentina 3–0 Croatia (FT). Argentina won the final.
console.log(roadToFinal({ teams, matchups }, { team: "CRO" }).totals.finalists[0].name); // Croatia
console.log(road.draw({ size: "phone" }).startsWith("<svg")); // true
```

`team` は一方の決勝進出チームを（ID で）左に置きます。決勝に出場しないチームには決勝への道がないので、拒否されます。決勝がまだ決まっていない大会でも描けます。それぞれのチームのここまでの道のりが描かれ、中央は「v」になります。総当たりの試合（`round: 0`）はグループステージです。

## 自分で書く二つの道のりから

トーナメント表全体がないときは、二つのチームとその道のりを渡します。

```js
import { roadToFinal } from "@johnmorrisdotca/taisen-brackets";

const owls = { name: "Northern Owls", abbr: "NOW", color: "#3a2d6b", path: [
  { round: "quarter-final", opponent: { name: "Coastal Pines", abbr: "CPN" }, score: [2, 0] },
  { round: "semi-final", opponent: { name: "Valley Stars", abbr: "VAL" }, score: [1, 1], decidedBy: "pens", pens: [4, 3] },
] };
const gulls = { name: "Harbour City Gulls", abbr: "HCG", color: "#1d4f91", path: [
  { round: "quarter-final", opponent: { name: "Summit Peaks", abbr: "SMT" }, score: [3, 1] },
  { round: "semi-final", opponent: { name: "Metro Bolts", abbr: "MTB" }, score: [2, 1], decidedBy: "aet" },
] };

const chart = roadToFinal([owls, gulls], { title: "Northern Cup 2030", final: { score: [1, 2] }, size: "square" });
console.log(chart.totals.rounds.join(" "), chart.totals.champion); // quarter-final semi-final Harbour City Gulls
console.log(chart.table().includes("<td>Semi-final</td>")); // true
```

`decidedBy` は `aet` か `pens` で、図はスコアの下に FT、AET、または PK 戦の結果を書きます。

## サイズと言葉

`size` はトーナメント表と同じ `wide`、`square`、`card`、`phone` です。`roundNames` はトーナメント表と同じようにラウンドに名前を付けます（リスト、または `playoffFormat` のフォーマット）。`locale` は言葉とラウンド名を英語、フランス語、日本語、スペイン語、ドイツ語で書きます。`labels` で任意の語を置き換えられます。

```js
import { ROAD_THEMES, roadToFinal } from "@johnmorrisdotca/taisen-brackets";

const finalists = [
  { name: "A", path: [{ round: "semi-final", opponent: { name: "C" }, score: [1, 0] }] },
  { name: "B", path: [{ round: "semi-final", opponent: { name: "D" }, score: [2, 0] }] },
];
const fr = roadToFinal(finalists, { locale: "fr", size: "phone" });
console.log(Object.keys(ROAD_THEMES).length > 0, fr.summary.length > 0);
```

## トーナメント表の中の同じ見た目

図と `drawBracket(..., { look: "road" })` は見た目を共有します。同じマーク、スコア、ピル型のラベルです。`highlightPath: "ARG"` は、トーナメント表の中で一つのチームの勝ち上がりを点線で描きます。3 位決定戦は道のりに含まれず、負けたチームの道のりは負けた場所で終わります。[レイアウトと見た目](layouts-and-looks.md#road-の見た目)を参照してください。

対戦のフィールドとすべてのオプションは[決勝への道](../../road.md)にあります。
