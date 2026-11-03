---
title: マーク、旗、優勝者とトロフィー
section: how-to
order: 14
description: 名前だけのトーナメント表は、ただの表です。
---

名前だけのトーナメント表は、ただの表です。絵にするのは、各チームのマーク（旗やエンブレム）と、中央のカップを持つ優勝者です。どれもパッケージの依存ではありません。マークは自分で用意し、パッケージが安全に描いて、一度だけ書き出します。このガイドでは、用意できる四つのものを説明します。

## 自分のマーク

チームの `mark` は、画像の URL（`https://`、`data:image/`、相対パス）かインライン SVG です。円形（`markShape: "round"`、既定）、四角形、または描かない（`"none"`）のどれかで描かれます。マークのないチームは、その `color` の上にイニシャルが出るので、欠けているようには見えません。`road` の見た目では、マークのないチームは頭文字入りの角丸のタイルになります。

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const teams = [
  { id: "AUR", name: "Aurora", color: "#2f5d4a", mark: "https://example.com/aurora.svg" },
  { id: "HAR", name: "Harbour", color: "#1d4f91" },
];
const svg = drawBracket({ teams, matchups: [{ sides: ["AUR", "HAR"], score: [2, 1] }] }, { look: "road" });
console.log(svg.includes("https://example.com/aurora.svg"), svg.includes(">HAR")); // true true
```

マークの URL はそれぞれ `<symbol>` として一度だけ書かれ、そのチームが現れるたびに使われます。長い `data:` 画像が使うたびに繰り返されることはありません。

## 作りからして安全

インライン SVG は、取り込まれる時点でクリーンアップされます。スクリプト、イベント属性、`<style>`、`<foreignObject>`、`javascript:` の URL は取り除かれ、画像の URL は http(s)、相対パス、`data:image/` に限られます。同じ規則が公開されているので、自分のマークアップにも使えます。

```js
import { cleanSvg, safeHref, safeUrl } from "@johnmorrisdotca/taisen-brackets";

const cleaned = cleanSvg('<svg viewBox="0 0 1 1"><script>alert(1)</script><path d="M0 0h1v1z" onclick="x()"/></svg>');
console.log(cleaned.viewBox, cleaned.inner.includes("script"), cleaned.inner.includes("onclick")); // 0 0 1 1 false false
console.log(safeUrl("javascript:alert(1)"), safeHref("/team/ARG")); // false true
```

渡した URL を読み込むのは訪問者のブラウザーです。パッケージ自身は通信しません。

## プラグインで旗を描く

チームには国コード `flag: "AR"` を持たせられます。描画は、渡された `flags` 関数に絵を求めます。コードとリクエスト（`{ shape, size, theme }`）を受け取って SVG 文字列を返す（旗がないコードなら何も返さない）同期関数ならなんでもかまいません。Hata の丸い旗を使うのがお勧めです。ただし Hata の `flag()` は非同期なので、先に読み込んでください。

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";
import { flag } from "@johnmorrisdotca/hata/load";

const loaded = { AR: await flag("AR", { shape: "round" }), FR: await flag("FR", { shape: "round" }) };
const teams = [{ id: "ARG", name: "Argentina", flag: "AR" }, { id: "FRA", name: "France", flag: "FR" }];
const matchups = [{ sides: ["ARG", "FRA"], score: [3, 3], extraTime: true, pens: [4, 2] }];

const svg = drawBracket({ teams, matchups }, { flags: (code) => loaded[code], look: "road" });
console.log(svg.includes("<symbol")); // true
```

描画関数がない場合、コードに対して何も返さない場合、例外を投げる場合、`<svg>` でないものを返す場合は、チームの `mark`、なければイニシャルが描かれます。例外は決して外に出ません。80 kB のインライン旗を二度も持てないページには、読み込み用の URL として旗を返す `flagHref(code)` があります。

## 優勝者とトロフィー

決勝が終わると、優勝者が「Champion」の文字とともに中央に出ます（スマートフォンでは、線がかからないよう上部です）。自分のトロフィー（インライン SVG か画像の URL）は `trophy` で渡します。`champion: false` なら中央は空になります。

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const trophy = '<svg viewBox="0 0 24 24"><path d="M6 3h12v5a6 6 0 0 1-12 0zM10 14h4v4h3v3H7v-3h3z" fill="currentColor"/></svg>';
console.log(drawBracket([{ sides: ["A", "B"], score: [2, 1] }], { trophy }).includes('class="tb-gold"')); // true
```

## Dougu Sports のエンブレム

トロフィーは `"trophy:hockey-cup"` のようなエンブレム ID にもできます。それを描くのは、`emblems` として渡す関数です。ID とリクエスト（`{ style, size, tint, theme }`）を受け取って SVG 文字列を返す関数ならなんでもよく、`@johnmorrisdotca/dougu-sports/emblems` の `renderEmblem` がその一つです。

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";
import { renderEmblem } from "@johnmorrisdotca/dougu-sports/emblems";

const svg = drawBracket([{ sides: ["Aurora", "Harbour"], score: [2, 1] }], { emblems: renderEmblem, trophy: "trophy:hockey-cup" });
console.log(svg.includes('class="tb-emblem"')); // true
```

- 描画関数には、トロフィーが絵の中で持つ大きさが渡されます。トーナメント表がその見た目のときは `theme: "light"` か `"dark"`（`poster` なら `"dark"`）、そうでなければ `"inherit"` が渡され、その場合は描画自身の色（`--tb-ink`）がインクになります。`emblemStyle`（`"metal"` が既定、`"line"`、`"color"`）と `emblemTint`（16 進の色）もそのまま渡されます。
- 描画関数がなければ、エンブレム ID は何も描かず、場所も取りません。例外を投げる、または `<svg>` でないものを返す描画関数のときは、トロフィーを描きません。
- グローバルな切り替えはありません。描画はオプションだけで決まる純粋な関数なので、描画関数は呼び出しごとに渡します。

## すべてのボックスにリンク

`href` は、対戦だけを渡して対戦ごとに呼ばれます。URL を返せばボックス全体がリンクになり、何も返さなければ各側（`0` と `1`）について呼ばれ、URL のあるチームの行がそれぞれのリンクになります。どれも SVG の中の本物の `<a href>` で、アクセシブルな名前（ツールチップの文）と、ホバー時の表示、フォーカスリングを持ちます。

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const bracket = [{ sides: ["A", "B"], score: [1, 0], date: "1" }, { sides: ["C", "D"], score: [0, 2], date: "1" }, { sides: ["A", "D"], score: [2, 1], date: "2" }];
const boxes = drawBracket(bracket, { href: (tie) => `/match/${tie.id}` });
console.log(boxes.match(/<a /g).length, boxes.includes('href="/match/m3"')); // 3 true
```

URL は http(s)、相対パス、`#` のフラグメントでなければならず、`javascript:` は捨てられます。
