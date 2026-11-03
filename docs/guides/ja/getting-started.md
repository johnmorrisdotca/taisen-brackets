---
title: はじめに
section: tutorial
order: 1
description: パッケージをインストールし、対戦の一覧からトーナメント表を描きます。
---

インストールします。

```sh
npm install @johnmorrisdotca/taisen-brackets
# or: pnpm add @johnmorrisdotca/taisen-brackets
# or: yarn add @johnmorrisdotca/taisen-brackets
```

トーナメント表は、対戦の一覧です。1つの対戦には、2つの側と、試合が終わっていればそのスコアを書きます。`layoutBracket` はラウンド、ブロック、どの対戦がどの対戦につながるかを調べ、`drawBracket` は同じ一覧 (または作っておいたレイアウト) を SVG の文字列として描きます。

```ts
import { drawBracket, layoutBracket, type Matchup } from "@johnmorrisdotca/taisen-brackets";

const matchups: Matchup[] = [
  { sides: ["Aurora", "Harbour"], score: [2, 1], date: "2026-06-01" },
  { sides: ["Cascade", "Delta"], score: [0, 1], date: "2026-06-01" },
  { sides: ["Aurora", "Delta"], score: [3, 1], date: "2026-06-08" },
];

const layout = layoutBracket(matchups);
console.log(layout.rounds, layout.champion?.name, layout.shape);
console.log(drawBracket(layout, { title: "Aurora Cup" }).startsWith("<svg"));
```

文字列は普通の SVG で、スクリプトもネットワークも使いません。ページに入れる (`element.innerHTML = svg`)、ファイルに書く、サーバーから送る、のどれでもできます。

## 次に読むもの

- ページ、バンドラー、フレームワーク、iframe で使う: [通常の HTML と CDN](html-and-cdn.md)、[Vite と webpack](bundlers.md)、[React・Vue・Svelte・Angular](frameworks.md)、[iframe](embed-in-an-iframe.md)、[TypeScript と Node](typescript-and-node.md)。
- 仕組み: [トーナメント表が描かれるまで](how-it-works.md)。
- すべての関数・オプション・型: [API リファレンス](api:drawBracket)。
