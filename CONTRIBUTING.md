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
- **A README table, example or count that a test holds to the code** changes together with the code: `pnpm test:readme` runs
  every example of the README and of `docs/`, and checks that the README names every export.
- **`docs/formats.md` is made from the data**: `node scripts/make-formats-doc.mjs` rewrites it from `src/presets.ts`. A format
  you add cites its source in the pull request and in `NOTICE.md`.
- **The demo's results are read, not typed**: `SPXN_PUBLISHABLE_KEY=… node scripts/fetch-demo-data.mjs` rewrites `demo/data/` from spxn.com's public API, and `pnpm flags` the flags. The data's sources and terms are in `NOTICE.md`; the World Cup 1938 and 2022 file is CC BY-SA 4.0.
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
pnpm screenshots    # the README's pictures, into docs/images
pnpm dev            # the demo on http://127.0.0.1:7100/
```

## Releasing

Maintainers bump the version in `package.json` and in `src/version.ts`, move *Unreleased* to the new version in
`CHANGELOG.md`, dated, push, wait for CI and tag `vX.Y.Z`, the same as `package.json`'s version. The Release workflow
(`.github/workflows/release.yml`) checks and builds the package, attaches the tarball to a GitHub release and publishes it to
npm by trusted publishing, with provenance and no token. A version already on npm is not published again.
