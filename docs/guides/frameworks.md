---
title: In React, Vue, Svelte and Angular
section: how-to
order: 15
description: Draw a bracket in React, Vue, Svelte and Angular: the SVG string goes in as HTML.
---

`drawBracket` gives a string of SVG, so every framework uses it the same way: make the string from your data, and give it to the framework as HTML. The drawing carries its own style and no script, and every mark it is given is cleaned, so the string is safe to put in the page as it is. It also draws the same on a server, so a server render has the bracket in it.

## React

`Bracket.tsx`; `dangerouslySetInnerHTML` is how React takes HTML.

```tsx
import { drawBracket, type Matchup } from "@johnmorrisdotca/taisen-brackets";

const matchups: Matchup[] = [
  { sides: ["Aurora", "Harbour"], score: [2, 1] },
  { sides: ["Cascade", "Delta"], score: [0, 1] },
  { sides: ["Aurora", "Delta"], score: [3, 1] },
];

export function Bracket({ theme = "auto" }: { theme?: "auto" | "light" | "dark" }) {
  return <div id="bracket" dangerouslySetInnerHTML={{ __html: drawBracket(matchups, { theme }) }} />;
}
```

Mount it as usual. The component renders to a string on a server (`renderToString`), as the package's tests check: the bracket is in the page before the browser runs anything.

```tsx
import { createRoot } from "react-dom/client";
import { Bracket } from "./Bracket";

createRoot(document.getElementById("root")!).render(<Bracket />);
```

## Vue

`v-html` takes the string.

```vue
<script setup lang="ts">
import { drawBracket, type Matchup } from "@johnmorrisdotca/taisen-brackets";

const props = withDefaults(defineProps<{ theme?: "auto" | "light" | "dark" }>(), { theme: "auto" });
const matchups: Matchup[] = [
  { sides: ["Aurora", "Harbour"], score: [2, 1] },
  { sides: ["Cascade", "Delta"], score: [0, 1] },
  { sides: ["Aurora", "Delta"], score: [3, 1] },
];
</script>

<template>
  <div id="bracket" v-html="drawBracket(matchups, { theme: props.theme })"></div>
</template>
```

```ts no-check
import { createApp } from "vue";
import Bracket from "./Bracket.vue";

createApp(Bracket).mount("#app");
```

## Svelte

`{@html …}` takes the string.

```svelte
<script lang="ts">
  import { drawBracket, type Matchup } from "@johnmorrisdotca/taisen-brackets";

  let { theme = "auto" }: { theme?: "auto" | "light" | "dark" } = $props();
  const matchups: Matchup[] = [
    { sides: ["Aurora", "Harbour"], score: [2, 1] },
    { sides: ["Cascade", "Delta"], score: [0, 1] },
    { sides: ["Aurora", "Delta"], score: [3, 1] },
  ];
</script>

<div id="bracket">{@html drawBracket(matchups, { theme })}</div>
```

```ts no-check
import { mount } from "svelte";
import Bracket from "./Bracket.svelte";

mount(Bracket, { target: document.getElementById("app")! });
```

## Angular

Angular's `[innerHTML]` would strip the drawing's `<style>`, so the string goes through `bypassSecurityTrustHtml`:

```ts no-check
import { Component, inject, Input } from "@angular/core";
import { DomSanitizer, type SafeHtml } from "@angular/platform-browser";
import { drawBracket, type Matchup } from "@johnmorrisdotca/taisen-brackets";

const matchups: Matchup[] = [
  { sides: ["Aurora", "Harbour"], score: [2, 1] },
  { sides: ["Cascade", "Delta"], score: [0, 1] },
  { sides: ["Aurora", "Delta"], score: [3, 1] },
];

@Component({
  selector: "app-bracket",
  standalone: true,
  template: `<div id="bracket" [innerHTML]="svg"></div>`,
})
export class BracketComponent {
  @Input() theme: "auto" | "light" | "dark" = "auto";

  private readonly sanitizer = inject(DomSanitizer);

  // The SVG is made here from your own data, and the package cleans every mark it is given: so it is trusted as it is.
  get svg(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(drawBracket(matchups, { theme: this.theme }));
  }
}
```

```ts no-check
import "@angular/compiler";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideZonelessChangeDetection } from "@angular/core";
import { BracketComponent } from "./bracket.component";

void bootstrapApplication(BracketComponent, { providers: [provideZonelessChangeDetection()] });
```

## Next.js, Nuxt, SvelteKit

They render on a server first, and `drawBracket` draws the same there, so the components work unchanged. In Next.js's App Router a component that only draws needs no `"use client"`.
