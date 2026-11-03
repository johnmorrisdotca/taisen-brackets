---
title: React・Vue・Svelte・Angular で使う
section: how-to
order: 15
description: React、Vue、Svelte、Angular でトーナメント表を描きます。SVG の文字列を HTML として入れます。
---

`drawBracket` は SVG の文字列を返すので、どのフレームワークでも同じように使います。データから文字列を作り、フレームワークに HTML として渡します。描画は自分のスタイルを持ち、スクリプトを含まず、渡されたマークはすべて無害化されるので、文字列はそのままページに入れて安全です。サーバーでも同じ描画になるので、サーバーでの描画にもトーナメント表が入ります。

## React

`Bracket.tsx` です。React が HTML を受け取る方法は `dangerouslySetInnerHTML` です。

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

いつもどおりにマウントします。コンポーネントはサーバーでも文字列に描画できます (`renderToString`)。パッケージのテストで確かめています。ブラウザが何も実行する前から、ページにトーナメント表が入っています。

```tsx
import { createRoot } from "react-dom/client";
import { Bracket } from "./Bracket";

createRoot(document.getElementById("root")!).render(<Bracket />);
```

## Vue

`v-html` が文字列を受け取ります。

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

`{@html …}` が文字列を受け取ります。

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

Angular の `[innerHTML]` は描画の `<style>` を取り除いてしまうので、文字列は `bypassSecurityTrustHtml` を通します。

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

## Next.js・Nuxt・SvelteKit

どれも先にサーバーで描画しますが、`drawBracket` はサーバーでも同じ描画をするので、コンポーネントはそのまま動きます。Next.js の App Router では、描くだけのコンポーネントに `"use client"` は要りません。
