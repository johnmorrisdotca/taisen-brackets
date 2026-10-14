# Contributing

Thank you for helping. Bug reports, ideas and pull requests are all welcome.
Bug reports and ideas go in the
[issues](https://github.com/johnmorrisdotca/taisen-brackets/issues).

## The rules

- **No runtime dependencies.** The package is a few modules of plain TypeScript that return strings; a dependency is not
  added for convenience.
- **The core is pure.** Every function returns new values and never changes what it was given.
- **A drawing is a pure function of its options.** No clock, no random number, no counter: the same input and options give the
  same string, and a test holds it. An id inside a drawing comes from a hash of the input unless the caller gives one.
- **Anything from outside is made safe.** Text is escaped, an image address passes `safeUrl`, inline SVG passes `cleanSvg`. A
  new option that reaches the markup has a test with a hostile value.
- **Test what you change.** Tests sit in `test/`. A rule you change has a test that would have caught it.
- **Docs pages are single-language.** Every page of the README and of `docs/` is in one language: one page per language, made from one source where that is practical, a Japanese one named `<name>.ja.md`, and the two linked at the top with a line such as `日本語 · English`. No page mixes English and Japanese in a table or in its prose, and a demo switches language with a control. Proper nouns and code identifiers (an id or a constant) stay as they are on both pages, and a Japanese term that is itself the subject (the package's own name) may appear once on an English page as a quoted name. The exception is a page about the translations themselves (`docs/languages.md`, which lists every word and round name of every language), which may show both languages side by side. A test, `docs-language.test`, holds the docs to this and lists each exception with its reason.
- **A README table, example or count that a test holds to the code** changes together with the code: `pnpm test:readme` runs
  every example of the README and of `docs/`, and checks that the README names every export.
- **`docs/formats.md` is made from the data**: `node scripts/make-formats-doc.mjs` rewrites it from `src/presets.ts`. A format
  you add cites its source in the pull request and in `NOTICE.md`.
- **The demo's results are read, not typed**: `SPXN_PUBLISHABLE_KEY=… node scripts/fetch-demo-data.mjs` rewrites `demo/data/` from spxn.com's public API, and `pnpm flags` the flags. The data's sources and terms are in `NOTICE.md`; the World Cup 1938 and 2022 file is CC BY-SA 4.0.
- **`docs/languages.md` is made from the tables**: `node scripts/make-languages-doc.mjs` rewrites it from `src/locales.ts`. A word or a round name in a language cites what it was checked against (a Wikipedia article in that language), and a language needs a key for every word of English and a name for every round of every era (a test holds both).
- **Option values and names are kebab case where they are words** (`"poster"`, `"ltr"`).
- **Art and data are shipped only when their licence lets them be**, with the notice kept in `NOTICE.md`. No GPL or LGPL code.
  The demo's flags are made with `pnpm flags` from Hata, and the package ships none.
- **Needs Node 22 or later**; the tests run the TypeScript source with `node --test`, which needs 22.18 or later.
- **Ports.** The demo's server is on 7100 and the tests' on 7101 (`scripts/dev.mjs`, `playwright.config.mjs`).

## Pull requests

One change per pull request. Say what changed and how you checked it, and add a line to `CHANGELOG.md` under **Unreleased**:
for a change a user would notice, and for one to the repository alone.

## Commands

```sh
pnpm check          # lint, types, tests, the build and the packed package
pnpm test:package   # pack it as npm does, install it in an empty project, import every entry
pnpm test:demo      # build the demo and play it in a real browser at a phone's width and a desk's
pnpm test:readme    # run the examples of the README and of docs/ against the built package
pnpm images         # every picture of docs/images, in one command (WebP, made in the browser; the same as pnpm screenshots)
pnpm screenshots    # the same, with `-- --extra <folder>` for review shots too
pnpm dev            # the demo on http://127.0.0.1:7100/
```

## Releasing

Maintainers bump the version in `package.json` and in `src/version.ts`, move *Unreleased* to the new version in
`CHANGELOG.md`, dated, push, wait for CI and tag `vX.Y.Z`, the same as `package.json`'s version. The Release workflow
(`.github/workflows/release.yml`) checks and builds the package, attaches the tarball to a GitHub release and publishes it to
npm by trusted publishing, with provenance and no token. A version already on npm is not published again.
