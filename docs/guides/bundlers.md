---
title: Vite and webpack
section: how-to
order: 14
description: Install the package and draw a bracket in a Vite or webpack project.
---

Install it.

```sh
npm install @johnmorrisdotca/taisen-brackets
# or: pnpm add @johnmorrisdotca/taisen-brackets
# or: yarn add @johnmorrisdotca/taisen-brackets
```

Everything is an ES module with its own entry point, so a bundler keeps only what you import: `@johnmorrisdotca/taisen-brackets` (the drawing and the layout), `/layout` (the layout alone, with no drawing), `/presets` (each league's playoff format by era), `/road` (the road to the final) and `/backgrounds` (the poster backgrounds). The package says `sideEffects: false`, so tree shaking removes whatever you do not import.

## Vite

The page.

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

The script. Vite builds this entry with no configuration.

```ts no-run
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

document.getElementById("bracket")!.innerHTML = drawBracket([
  { sides: ["Aurora", "Harbour"], score: [2, 1] },
  { sides: ["Cascade", "Delta"], score: [0, 1] },
  { sides: ["Aurora", "Delta"], score: [3, 1] },
]);
```

## webpack

The entry.

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

`webpack.config.mjs`. webpack 5 needs nothing special for a package with `exports`.

```mjs no-run
import { fileURLToPath } from "node:url";

export default {
  mode: "production",
  entry: "./src/index.js",
  output: { path: fileURLToPath(new URL("./dist", import.meta.url)), filename: "main.js" },
};
```

Run `npx webpack` and load the `dist/main.js` it makes from a page.

## Other tools

Anything that reads `exports` in `package.json` works the same way: Rollup, esbuild, Parcel, Bun, Deno (`npm:@johnmorrisdotca/taisen-brackets`).
