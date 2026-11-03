---
title: 通常の HTML と CDN
section: how-to
order: 13
description: jsDelivr や unpkg のモジュールスクリプト1つで、通常のページにトーナメント表を描きます。
---

ビルドは要りません。パッケージは普通の ES モジュールなので、`type="module"` のスクリプトから CDN の `drawBracket` を import し、できた SVG をページに書き込めます。ほかに読み込むものはありません。描画に自分のスタイルが入っているからです。

## jsDelivr

jsDelivr はパッケージのファイルをそのまま配るので、アドレスはビルド済みのファイルです。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Taisen Brackets from jsDelivr</title>
  </head>
  <body>
    <div id="bracket"></div>
    <script type="module">
      import { drawBracket } from "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/taisen-brackets@0/dist/index.js";

      document.getElementById("bracket").innerHTML = drawBracket([
        { sides: ["Aurora", "Harbour"], score: [2, 1] },
        { sides: ["Cascade", "Delta"], score: [0, 1] },
        { sides: ["Aurora", "Delta"], score: [3, 1] },
      ]);
    </script>
  </body>
</html>
```

## unpkg

unpkg もパッケージのファイルをそのまま配ります。`?module` を付けると、ファイルの中の import をブラウザ用に書き換えてくれます。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Taisen Brackets from unpkg</title>
  </head>
  <body>
    <div id="bracket"></div>
    <script type="module">
      import { drawBracket } from "https://unpkg.com/@johnmorrisdotca/taisen-brackets@0/dist/index.js?module";

      document.getElementById("bracket").innerHTML = drawBracket([
        { sides: ["Aurora", "Harbour"], score: [2, 1] },
        { sides: ["Cascade", "Delta"], score: [0, 1] },
        { sides: ["Aurora", "Delta"], score: [3, 1] },
      ]);
    </script>
  </body>
</html>
```

## 注意

- `<script type="module">` を使います。普通の script では `import` できません。
- ページを変えたくないときは、アドレスにバージョンを書きます (`@johnmorrisdotca/taisen-brackets@0.19.0`)。`@0` だけなら、新しい 0.x が出るたびにそれを使います。
- `drawBracket` のオプションは [API リファレンス](api:drawBracket) にあります。何も表示されないときは、[困ったとき](troubleshooting.md) を見てください。
