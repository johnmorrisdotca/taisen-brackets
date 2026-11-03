---
title: iframe でトーナメント表を埋め込む
section: how-to
order: 17
description: スクリプトを使えないページでも、デモの埋め込みページを iframe で載せてトーナメント表を表示します。
---

スクリプトを使えないサイトでも、デモの埋め込みページを iframe で載せればトーナメント表を表示できます。自分でコードを書く必要はありません。アドレスで、見た目 (`look`。`classic` か `road`)、テーマ (`theme`。`auto`、`light`、`dark`、`poster`)、言語 (`locale`。`en`、`fr`、`ja`、`es`、`de`)、大きさ (`size`。`wide`、`square`、`card`、`phone`)、タイトル (`title`) を選びます。キーは `drawBracket` のオプションと同じです。

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

このページは架空の小さなトーナメントを1つ描くだけで、何も保存せず、ほかの場所から何も読み込みません。描き終えると、まわりのページに `postMessage({ taisen: "load" })` で知らせます。描けないときは `{ taisen: "error", reason }` です。どちらも、信用する前に `event.origin` を確かめてください。自分の大会を描くには、自分のページで [`drawBracket`](api:drawBracket) を使います。すべての見た目は [デモ](https://johnmorrisdotca.github.io/taisen-brackets/) で見られます。
