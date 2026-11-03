---
title: レイアウト、見た目、背景
section: how-to
order: 12
description: 同じ対戦でも、さまざまな描き方ができます。
---

同じ対戦でも、さまざまな描き方ができます。このガイドでは、互いに独立した六つの選択を分けて説明します。図の**サイズ**、ツリーの**形**、**レイアウト**（ツリー、行、シールドなど）、**見た目**（クラシックか `road`）、**テーマ**（ライト、ダーク、ポスター）、**背景**です。どの組み合わせも使えます。

## サイズと形

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const bracket = [
  { sides: ["A", "B"], score: [1, 0], date: "1" }, { sides: ["C", "D"], score: [0, 2], date: "1" }, { sides: ["A", "D"], score: [2, 1], date: "2" },
];

const views = {
  wide: drawBracket(bracket),
  square: drawBracket(bracket, { size: "square" }),
  card: drawBracket(bracket, { size: "card" }),
  phone: drawBracket(bracket, { size: "phone" }),
  custom: drawBracket(bracket, { size: { width: 800, height: 500 } }),
  ltr: drawBracket(bracket, { shape: "ltr" }),
};
console.log(Object.keys(views).map((name) => /viewBox="0 0 (\d+) /.exec(views[name])[1]).join(" ")); // 1200 1080 1080 390 800 1200
```

`wide` は 1200 × 675、`square` は 1080 × 1080、`card` は 1080 × 1350（縦長の投稿用で、ラウンドが行になります）、`phone` は幅 390 で高さは必要な分だけです。`shape: "ltr"` は左から右へ一本のツリーを描き、終点に優勝者を置きます。既定は、決勝で出会う二つの半分です。`detail` は `full`（名前とスコア）、`compact`（略称）、`mark`（マークだけ）、`auto`（収まる中でいちばん詳しいもの）です。

## テーマ

`theme: "auto"`（既定）はライトの見た目で描き、ページに追従します。`prefers-color-scheme: dark` のとき、または `<html data-theme="dark">` のときはダークになります。`light`、`dark`、`poster`（紺地に金）は固定です。`none` は `<style>` を書かず、自分の CSS で描かせます。その場合は `currentColor` がフォールバックになります。色はすべて `var(--tb-<名前>, <見た目の値>)` なので、ページ側から描画のスタイルを変えられます。

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const svg = drawBracket([{ sides: ["A", "B"], score: [1, 0] }]);
console.log(svg.includes("var(--tb-ink"), drawBracket([{ sides: ["A", "B"], score: [1, 0] }], { theme: "none" }).includes("<style>")); // true false
```

```css
.my-bracket { --tb-ink: #123; --tb-win: #c60; --tb-box: #fff; --tb-line: #99a; }
```

変数名は `bg`、`ink`、`muted`、`line`、`box`、`edge`、`win`、`gold`、`plain`、`font` です。

## `road` の見た目

`look: "road"` は、太いリングの大きな丸いマーク、大きな太字のスコア（敗者のものは控えめ）、ピル型のラベルに入ったラウンド名を描き、`highlightPath` を指定すると、あるチームの勝ち上がりの道を点線で描きます。`seeds`、`codes`、`vs` でタグを足せます。

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const bracket = [
  { sides: ["A", "B"], score: [1, 0], date: "1" }, { sides: ["C", "D"], score: [0, 2], date: "1" }, { sides: ["A", "D"], score: [2, 1], date: "2" },
];
const svg = drawBracket(bracket, { look: "road", size: "card", highlightPath: "A" });
console.log(svg.includes("tb-look-road"), (svg.match(/class="tb-line tb-path"/g) ?? []).length); // true 1
```

## 九つのレイアウト

`layout` は `tree`（既定）、`rows`、`shields`、`update`、`columns`、`playin`、`series`、`groups`、`picture` のどれかです。どれも同じ `background`、`look`、`size`、`locale`、`href`、`flags` を受け取ります。

| `layout` | 描くもの |
| --- | --- |
| `tree` | 決勝で出会う二つの半分 |
| `rows` | 各チームを一行に：名前、マーク、結果の欄 |
| `shields` | チームをシールドで |
| `update` | スコア更新のカード |
| `columns` | 二つのカンファレンスの色の縦長の列 |
| `playin` | NBA のプレーイン。勝者と敗者の矢印つき |
| `series` | シリーズのカード。各列の下に試合数 |
| `groups` | 総当たりの試合（`round: 0`）から作るグループの表 |
| `picture` | ポストシーズンの図：シードつきのロゴのタイル、組ごとの結果 |

```js
import { LAYOUTS, drawBracket } from "@johnmorrisdotca/taisen-brackets";

const bracket = [{ sides: ["A", "B"], score: [1, 0], date: "1" }, { sides: ["C", "D"], score: [0, 2], date: "1" }, { sides: ["A", "D"], score: [2, 1], date: "2" }];
console.log(LAYOUTS.join(" ")); // tree rows shields update columns playin series groups picture
console.log(drawBracket(bracket, { layout: "rows" }).startsWith("<svg"));
```

各レイアウトの図と、それぞれが必要とするものは[レイアウト](../../layouts.md)にあります。

## 背景

`background` は、トーナメント表の下にポスター用の背景を描きます。25 種類あり、すべてコードで描かれ、それぞれダークとライトの二種類があります。グラデーション、光、模様、競技場のマーキング（`pitch`、`ice`、`hardwood`、`infield`、`turf`）です。文字、線、ボックスは、その上で読める色になり、コントラストは 4.5 対 1 で、テストが保証しています。

```js
import { BACKGROUND_PRESETS, contrastRatio, drawBracket } from "@johnmorrisdotca/taisen-brackets";

const ties = [{ sides: ["VAN", "NSH"], score: [4, 3], round: 1, seeds: ["P1", "WC2"] }, { sides: ["EDM", "LAK"], score: [1, 2], round: 1 }, { sides: ["VAN", "LAK"], score: [2, 1], round: 2 }];
const ice = drawBracket(ties, { look: "road", background: "ice", seeds: true });
const mine = drawBracket(ties, { look: "road", theme: "dark", background: { preset: "swirl", colors: ["#10203a", "#3a1060", "#ff7ac8", "#6ae0ff"], angle: 135, intensity: 0.8 } });
const photo = drawBracket(ties, { look: "road", theme: "dark", background: { image: "stadium.jpg", fit: "cover", dim: 0.55 } });
console.log(BACKGROUND_PRESETS.length, ice.includes("tb-bgd"), mine.includes("#ff7ac8"), photo.includes('<image href="stadium.jpg"')); // 25 true true true
console.log(contrastRatio([0, 0, 0], [255, 255, 255])); // 21
```

自分の画像は `http(s)`、相対パス、`data:image/` のみで、ほかは捨てられます。`background: false` なら透明のままです。詳細とコントラストの規則は[背景](../../backgrounds.md)にあります。
