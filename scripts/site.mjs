// Builds the static demo for GitHub Pages into ./site: the page (made by page.mjs from the family's shared header and footer), its scripts and styles, and the compiled library beside them.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import { build } from "esbuild";

import { publishThumbnails, thumbnailHead } from "./family-thumbnail.mjs";
import { renderIndex } from "./page.mjs";

/** What the family's card shows (scripts/screenshots.mjs makes it): the words of og:image:alt and of the README's top picture. */
const ALT = "Taisen Brackets: the knockout stage of the 2022 World Cup in two halves that meet at the final, with a round flag for each nation, the scores and Argentina under a cup as champion.";

rmSync("site", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
cpSync("demo", "site", { recursive: true, filter: (from) => !/\.d\.ts$/.test(from) });
// The declarations are for editors, not for a browser.
cpSync("dist", "site/dist", { recursive: true, filter: (from) => !/\.d\.ts$/.test(from) });
// The trophies of the demo: the emblems package's compiled files, loaded one module per emblem.
cpSync("node_modules/@johnmorrisdotca/dougu-sports/dist", "site/dougu-sports", { recursive: true, filter: (from) => !/\.d\.ts$/.test(from) });
// The demo's page carries the family's card in its <head> (og:image, twitter:image, the icon); the three pictures are published beside it.
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
writeFileSync("site/index.html", renderIndex().replace("</head>", `  ${thumbnailHead(pkg, { alt: ALT })}\n</head>`));
publishThumbnails(".", "site");
// The family header's language picker and theme switch, as one small module for every page of the site (the demo, the embed page and the docs).
await build({
  stdin: { contents: 'import "@johnmorrisdotca/kazoku-ui/language-picker/define";\nimport "@johnmorrisdotca/kazoku-ui/theme-switch/define";\n', resolveDir: process.cwd() },
  outfile: "site/kazoku-parts.js",
  bundle: true,
  format: "esm",
  minify: true,
  logLevel: "silent",
});
console.log("site/ is ready");
