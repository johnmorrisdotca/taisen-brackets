---
title: TypeScript と Node
section: how-to
order: 16
description: パッケージの型を使います。DOM のないサーバーでも、同じトーナメント表を SVG の文字列として描けます。
---

パッケージは、エントリーポイントごとに自分の型を持っています。描画は純粋で、対戦を渡すと SVG の文字列が返るので、Node でも Deno でも Bun でもワーカーでもブラウザでも、同じ呼び出しは同じ答えを返します。このファイルは型を検査したあと、型を取り除いてくれる Node 22.18 以降でそのまま実行します。

```ts
import { drawBracket, layoutBracket, type DrawOptions, type Matchup } from "@johnmorrisdotca/taisen-brackets";

const matchups: Matchup[] = [
  { sides: ["Aurora", "Harbour"], score: [2, 1] },
  { sides: ["Cascade", "Delta"], score: [0, 1] },
  { sides: ["Aurora", "Delta"], score: [3, 1] },
];
const options: DrawOptions = { look: "road", theme: "dark", title: "Aurora Cup" };
console.log(drawBracket(matchups, options).startsWith("<svg"), layoutBracket(matchups).champion?.name);

// @ts-expect-error "neon" is not a theme
const theme: DrawOptions["theme"] = "neon";
console.log(theme);
```

`@ts-expect-error` は、`"neon"` がテーマではなく、コンパイラが断ることを示すためのものです。

## サーバーで

サーバーでも、ブラウザと同じ SVG を描けます。DOM がないので、ページは文字列です。

```mjs
import { drawBracket, layoutBracket } from "@johnmorrisdotca/taisen-brackets";

// A server draws the same SVG a browser does: pure, no DOM, no network, no script.
const matchups = [
  { sides: ["Aurora", "Harbour"], score: [2, 1] },
  { sides: ["Cascade", "Delta"], score: [0, 1] },
  { sides: ["Aurora", "Delta"], score: [3, 1] },
];
const page = `<!doctype html><title>Aurora Cup</title>${drawBracket(matchups, { title: "Aurora Cup" })}`;
console.log(page.length > 1000, layoutBracket(matchups).champion?.name);
```

最初のトーナメント表は [はじめに](getting-started.md) を見てください。
