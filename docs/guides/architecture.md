---
title: Architecture: from a list of ties to a string of SVG
section: explanation
order: 21
description: This guide is for someone who wants to change the package or to know why it behaves as it does.
---

This guide is for someone who wants to change the package or to know why it behaves as it does. It follows one call, `drawBracket(ties)`, from the input to the string, and names the rules that keep it correct.

## The pipeline

```text
ties ──► matchup.ts ──► seeding.ts ──► layout.ts ──► render.ts ──► one string of SVG
         (a tie's        (a tree for     (rounds, halves,   (boxes, lines,     │
          result)         any teams)      byes, who feeds    marks, text)       ├─ layouts.ts: the boxes of rows, shields, update, columns, series
                                          whom)                                 ├─ marks.ts, text.ts: marks made safe, text measured and cut
                                                                                └─ theme.ts, family-backgrounds.ts: colours and backgrounds
```

- **`matchup.ts`** reads one tie: its kind (a game, a series, aggregate legs, a replay), its score, its winner and its notes. Everything after it asks this module; nothing else decides who won.
- **`layout.ts`** is the sport-agnostic part. From the ties, and the teams if you give them, it works out the rounds (from who plays whom, or given), which tie feeds which, the two halves and their names, the byes, the third-place match and the champion. It has no drawing in it and is exported on its own as the `/layout` entry.
- **`render.ts`** plans the boxes and the connector lines for a size and a shape, and asks `layouts.ts` to fill one box for the layouts that draw a tie their own way. Every mark, text and slot lies inside the rectangle it is given, and a test measures this for every layout, size and look.
- **`road.ts`** draws the road to the final from the same layout. It is the `/road` entry; **`presets.ts`** holds the formats by era (`/presets`); **`family-backgrounds.ts`** the twenty-five backgrounds (`/backgrounds`).

## Four rules

1. **Pure and deterministic.** A drawing is a function of its input and options: no clock, no random number, no counter, no DOM. An id inside a drawing comes from a hash of the input, so the same input gives the same string, and two drawings on a page do not share ids. This is why the output can be cached, compared and snapshot-tested.
2. **No dependencies, and the plug-ins are functions.** Flags and emblems are not imported: you pass `flags` and `emblems`, plain synchronous functions from a code to an SVG string. The package is as small as it was, and a renderer that throws or returns rubbish draws the fallback instead of failing.
3. **Everything from outside is made safe on the way in.** Text is escaped. A mark or trophy given as SVG passes `cleanSvg`; an image address passes `safeUrl`; a link passes `safeHref`; an `id` is reduced to letters, digits, `-` and `_`. A new option that reaches the markup has a test with a hostile value (`test/hostile-id.test.ts`).
4. **Text is estimated, not measured.** The width of a line comes from character classes, not from a font file, so that the string is the same on every machine. A long name is cut with an ellipsis a few percent early or late, and that is the price of the first rule.

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const ties = [{ sides: ["A", "B"], score: [1, 0], date: "1" }, { sides: ["C", "D"], score: [0, 2], date: "1" }, { sides: ["A", "D"], score: [2, 1], date: "2" }];
console.log(drawBracket(ties) === drawBracket(ties)); // true
console.log(drawBracket(ties, { id: "x" }).includes('id="x'));
```

## The entries

| Entry | What it holds |
| --- | --- |
| `@johnmorrisdotca/taisen-brackets` | everything |
| `/layout` | the layout and its helpers, no drawing |
| `/presets` | the formats by era |
| `/road` | the road to the final |
| `/backgrounds` | the twenty-five backgrounds on their own |

Import from the narrowest entry that has what you need.

## Data comes from a script, docs from the data

`docs/formats.md` and `docs/languages.md` are written from `src/presets.ts` and `src/locales.ts` by `scripts/make-formats-doc.mjs` and `scripts/make-languages-doc.mjs`, and `pnpm test:readme` runs them with `--check`, so a table cannot fall behind the code. The API reference is written from the doc comments of the source by `scripts/docs-site.mjs`. Do not edit a made file; change its source and run the script.

## How it is kept true

| Check | What it holds |
| --- | --- |
| `pnpm check` | lint, types, the unit tests (snapshots of every layout, the geometry of every drawing, the contrast of every background, hostile input), the build and the packed package |
| `pnpm test:readme` | the made documents, then every example in the README, the docs and these guides, run against the built package, with the output their comments state |
| `pnpm test:demo` | the demo in a real browser at a phone's width and a desk's |
| `pnpm docs:check` | the documentation site's checks: every export has a doc comment and a running example, every guide has its front matter and its links lead somewhere |

`family-backgrounds.ts` and the family's other shared files are copied byte for byte between packages; do not edit one here, change it in every repository at once.
