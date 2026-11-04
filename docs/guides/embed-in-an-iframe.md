---
title: Embed a bracket in an iframe
section: how-to
order: 17
description: Show a bracket on a page that allows no scripts, with an iframe of the demo's embed page.
---

A site that allows no scripts can still show a bracket: an iframe of the demo's embed page needs no code of your own. The [builder](https://johnmorrisdotca.github.io/taisen-brackets/builder.html) writes it for you: its code section is the family's embed panel, with the iframe tab at the size of the bracket you chose, and the code for the call, a plain page, React, Vue, Angular and Svelte beside it. The address chooses the look (`look`: `classic` or `road`), the theme (`theme`: `auto`, `light`, `dark` or `poster`), the language (`locale`: `en`, `fr`, `ja`, `es` or `de`), the size (`size`: `wide`, `square`, `card` or `phone`) and a title (`title`). The keys are the options of `drawBracket`.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Taisen Brackets in an iframe</title>
  </head>
  <body>
    <iframe
      src="https://johnmorrisdotca.github.io/taisen-brackets/embed.html?look=road&theme=dark&size=wide&title=Aurora%20Cup"
      title="A knockout bracket: the Aurora Cup"
      width="640"
      height="360"
      loading="lazy"
      style="border: 0"
    ></iframe>
  </body>
</html>
```

The page draws one small made-up knockout and nothing else, stores nothing and loads nothing from anywhere else. When the bracket is drawn it tells the page around it with `postMessage({ taisen: "load" })`, or `{ taisen: "error", reason }` when it cannot; check `event.origin` before you trust either. To draw your own tournament, use [`drawBracket`](api:drawBracket) in your own page, and see [the demo](https://johnmorrisdotca.github.io/taisen-brackets/) for every look.
