---
title: Plain HTML and CDNs
section: how-to
order: 13
description: Draw a bracket on a plain page with one module script from jsDelivr or unpkg.
---

A page needs no build step. The package is plain ES modules, so a script of `type="module"` can import `drawBracket` from a CDN and write the SVG into the page. There is nothing else to load: the drawing carries its own style.

## jsDelivr

jsDelivr serves the package's files as they are, so the address is the built file.

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

unpkg serves the package's own files too; `?module` makes it rewrite the imports inside them for the browser.

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

## Notes

- Use `<script type="module">`. A classic script cannot `import`.
- Pin a version in the address (`@johnmorrisdotca/taisen-brackets@0.19.0`) so the page stays as it is; a bare `@0` takes each new 0.x release.
- The options of `drawBracket` are in [the API reference](api:drawBracket). If nothing appears, see [troubleshooting](troubleshooting.md).
