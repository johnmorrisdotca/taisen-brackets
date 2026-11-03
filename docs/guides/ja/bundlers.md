---
title: Vite と webpack
section: how-to
order: 14
description: パッケージをインストールし、Vite や webpack のプロジェクトでトーナメント表を描きます。
---

インストールします。

```sh
npm install @johnmorrisdotca/taisen-brackets
# or: pnpm add @johnmorrisdotca/taisen-brackets
# or: yarn add @johnmorrisdotca/taisen-brackets
```

どれも ES モジュールで、エントリーポイントごとに分かれているので、バンドラーは import したものだけを残します。`@johnmorrisdotca/taisen-brackets` (描画とレイアウト)、`/layout` (描画なしのレイアウトだけ)、`/presets` (リーグごと・年代ごとのプレーオフの形式)、`/road` (決勝までの道)、`/backgrounds` (ポスター用の背景) があります。パッケージは `sideEffects: false` と宣言しているので、ツリーシェイキングが import していないものを取り除きます。

## Vite

ページです。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Taisen Brackets with Vite</title>
  </head>
  <body>
    <div id="bracket"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

スクリプトです。Vite は設定なしでこのエントリーをビルドします。

```ts no-run
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

document.getElementById("bracket")!.innerHTML = drawBracket([
  { sides: ["Aurora", "Harbour"], score: [2, 1] },
  { sides: ["Cascade", "Delta"], score: [0, 1] },
  { sides: ["Aurora", "Delta"], score: [3, 1] },
]);
```

## webpack

エントリーです。

```js no-run
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const bracket = document.createElement("div");
bracket.id = "bracket";
bracket.innerHTML = drawBracket([
  { sides: ["Aurora", "Harbour"], score: [2, 1] },
  { sides: ["Cascade", "Delta"], score: [0, 1] },
  { sides: ["Aurora", "Delta"], score: [3, 1] },
]);
document.body.append(bracket);
```

`webpack.config.mjs` です。`exports` を持つパッケージに、webpack 5 は特別な設定を要りません。

```mjs no-run
import { fileURLToPath } from "node:url";

export default {
  mode: "production",
  entry: "./src/index.js",
  output: { path: fileURLToPath(new URL("./dist", import.meta.url)), filename: "main.js" },
};
```

`npx webpack` を実行し、できた `dist/main.js` をページから読み込みます。

## ほかのツール

`package.json` の `exports` を読むツールなら同じように使えます。Rollup、esbuild、Parcel、Bun、Deno (`npm:@johnmorrisdotca/taisen-brackets`) などです。
