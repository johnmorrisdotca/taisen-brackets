---
title: TypeScript and Node
section: how-to
order: 16
description: Use the package's types, and draw the same bracket as SVG text on a server with no DOM.
---

The package ships its own types, for each entry point. Drawing is pure: ties go in and SVG text comes out, so the same call gives the same answer in Node, Deno, Bun, a worker and a browser. This file type-checks, then runs under Node 22.18 or later, which strips the types.

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

`@ts-expect-error` is there to show that `"neon"` is not a theme; the compiler refuses it.

## On a server

A server draws the same SVG a browser does. There is no DOM, so the page is a string.

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

See [getting started](getting-started.md) for the first bracket.
