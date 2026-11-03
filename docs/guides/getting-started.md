---
title: Getting started
section: tutorial
order: 1
description: Install the package and draw a knockout bracket from a list of ties.
---

Install it.

```sh
npm install @johnmorrisdotca/taisen-brackets
# or: pnpm add @johnmorrisdotca/taisen-brackets
# or: yarn add @johnmorrisdotca/taisen-brackets
```

A bracket is a list of ties. Each tie names its two sides and, once it has been played, its score. `layoutBracket` works out the rounds, the halves and who feeds whom; `drawBracket` draws the same list, or a layout you already have, as an SVG string.

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

The string is plain SVG, with no script and no network. Put it in a page (`element.innerHTML = svg`), write it to a file, or send it from a server.

## What next

- Use it in a page, a bundler, a framework or an iframe: [plain HTML and CDNs](html-and-cdn.md), [Vite and webpack](bundlers.md), [React, Vue, Svelte and Angular](frameworks.md), [an iframe](embed-in-an-iframe.md) and [TypeScript and Node](typescript-and-node.md).
- How the package works: [how a bracket is drawn](how-it-works.md).
- Every function, option and type: the [API reference](api:drawBracket).
