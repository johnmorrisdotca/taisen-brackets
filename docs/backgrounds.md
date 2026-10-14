# Backgrounds

A bracket or a road chart can be drawn on a poster background: a gradient, a glow, a pattern or the markings of a playing surface, each drawn in code as SVG (no image file, nothing fetched), in a dark and a light variant, with the text, lines, boxes and marks drawn in colours that read over it. The plain colour of the look stays the default: a drawing is the same as before until a `background` is asked for.

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const ties = [
  { sides: ["VAN", "NSH"], score: [4, 3], round: 1 },
  { sides: ["EDM", "LAK"], score: [1, 2], round: 1 },
  { sides: ["VAN", "LAK"], score: [2, 1], round: 2 },
];

const svg = drawBracket(ties, { look: "road", theme: "dark", background: "ice" });
console.log(svg.includes("<g clip-path="), svg.length < 60000); // true true
```

## The option

`background` takes:

| Value | What it draws |
| --- | --- |
| left out, or `true` | The look's plain colour, as always. |
| `false` | Nothing: a transparent drawing. |
| a name, `"ice"` | That preset, in the variant of the look: `light` for `light`, `dark` for `dark` and `poster`. With `theme: "auto"` both variants are in the drawing and the stylesheet shows the one that fits the page (`prefers-color-scheme`, or `data-theme` on `<html>`). |
| `{ preset, colors, angle, intensity, seed, theme }` | A preset, tuned. |
| `{ image, fit, dim, theme }` | A picture of your own under a veil. |

```js
import { drawBracket, BACKGROUND_PRESETS } from "@johnmorrisdotca/taisen-brackets";

const ties = [{ sides: ["A", "B"], score: [1, 0], round: 1 }];
const tuned = drawBracket(ties, { theme: "dark", background: { preset: "swirl", colors: ["#10203a", "#3a1060", "#ff7ac8", "#6ae0ff"], angle: 135, intensity: 0.8 } });
console.log(BACKGROUND_PRESETS.length, tuned.includes("#ff7ac8")); // 25 true
```

- `preset`: one of the names below. Default `midnight`.
- `colors`: up to four, as hex (`#0b1230`) or `rgb()`. The first two make the ground (a gradient from the first to the second), the third is the glow and the fourth the pattern. One colour alone makes both ground colours (the second a little deeper, or lighter in a light variant). Fewer than four keep the preset's own for the rest, and a colour that is not hex or `rgb()` is ignored.
- `angle`: the ground's gradient and the pattern over it, in degrees as CSS counts them (180 is top to bottom). A playing surface keeps its lines straight.
- `intensity`: 0 to 1, how strong the glow and the pattern are. Default 0.6.
- `seed`: moves the scattered parts (confetti, stars, scratches, contours). Default 1. The same seed draws the same picture.
- `theme`: `light` or `dark`, to draw the other variant than the look's own.

An unknown name, a `colors` that is not a list of text, or an `angle`, `intensity`, `seed` or `dim` that is not a number throws a `RangeError` naming it. `roadToFinal` takes the same option.

## The twenty-five

Each has a dark and a light variant, is drawn the same way every time, and is at most 6 kB of SVG at any size. Five read as the sport's playing surface, faint enough that the boxes stay readable.

| Name | What it is |
| --- | --- |
| `midnight` | Deep navy to indigo with a soft glow at the top. |
| `crimson` | Crimson with a glow in the corner and a pale diagonal sweep. |
| `royal` | Purple and blue with a glow in two corners. |
| `emerald` | Deep green with wide diagonal light bands. |
| `pitch` | Soccer: mowing stripes, the halfway line and centre circle, penalty areas. |
| `ice` | Hockey: scratched ice with the centre circle, red centre line, blue lines and faceoff spots. |
| `hardwood` | Basketball: staggered planks with the court's lines and keys. |
| `infield` | Baseball: grass with a mown pattern, the infield's dirt and the base paths. |
| `turf` | Football: turf with end zones, yard lines and hash marks. |
| `ball-panels` | A close-up of a ball's hexagon and pentagon panels. |
| `swirl` | Curved ribbons sweeping across the ground. |
| `waves` | Layers of waves along the foot under a glow. |
| `glow` | One large radial glow with faint rings. |
| `floodlights` | Light cones from a row of floodlights above. |
| `confetti` | Scattered pieces of confetti. |
| `carbon` | Carbon-fibre weave with a diagonal sheen. |
| `aurora` | Curtains of green and violet light over stars. |
| `sunburst` | Rays from a glowing centre. |
| `chevrons` | Rows of chevrons. |
| `halftone` | A fading halftone dot screen. |
| `argyle` | A diamond lattice. |
| `contour` | Topographic contour lines. |
| `stardust` | A band of stars and a nebula glow. |
| `mesh` | Overlapping soft colour blobs. |
| `spotlight` | A single spotlight cone onto a lit floor, with a vignette. |

All of them are original: drawn in this package from gradients, patterns and paths, none traced from a picture, a poster, a logo, a trophy or a photograph. The [gallery](../README.md#backgrounds) shows them on the sports they suit.

## Readable over every one

The drawing's text, muted text, lines, boxes and accent are chosen from the background's own colours:

- The text is a pale or a near-black ink, whichever reads better over the ground's two colours and over each of them blended with the glow and the pattern at their strongest: those are the background's `dominant` colours. The contrast is at least 4.5 to 1, better than the 3 to 1 that WCAG's AA asks of large text, and a test holds it for every preset, both variants and every size, and for colours of your own.
- The muted text keeps 3 to 1, the accent (the winner's ring, the champion, the path) keeps 3 to 1 on the ground, and a box laid over the picture keeps the text at 4.5 to 1 inside it.
- Colours of your own that suit neither ink (a mid-grey ground) get a veil of black or white over the picture, as thin as will do, so that the text still reads.

`backgroundSvg(preset, options)` gives the pieces: `{ defs, body, ink }`, with `ink.text`, `muted`, `line`, `box`, `edge`, `panel`, `plain`, `ring`, `spine`, `accent`, `dominant` and `base`. `contrastRatio(a, b)` is WCAG's formula for two colours given as `[r, g, b]`.

```js
import { backgroundSvg, contrastRatio } from "@johnmorrisdotca/taisen-brackets";

const { ink } = backgroundSvg("pitch", { width: 1200, height: 675, theme: "dark" });
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const worst = Math.min(...ink.dominant.map((ground) => contrastRatio(rgb(ink.text), rgb(ground))));
console.log(worst >= 4.5); // true
```

## Your own picture

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const svg = drawBracket([{ sides: ["A", "B"], score: [2, 1], round: 1 }], { theme: "dark", background: { image: "stadium.jpg", fit: "cover", dim: 0.55 } });
console.log(svg.includes('<image href="stadium.jpg"')); // true
```

The picture is an `<image>` under a veil of black (a dark look) or white (a light one), `dim` deep (0 to 1, default 0.5), and the text, lines and boxes take the colours of a plain dark or pale ground. `fit` is `cover` (fills the drawing, the default) or `contain`. The address must be http(s), relative, or `data:image/…`: anything else (`javascript:`, `data:text/html`, `file:`, a protocol-relative `//host`) throws, and the address is escaped like every other text. The demo reads a file into a data address in the browser and never uploads it. A picture you cannot be sure of reading (a busy photograph) wants a deeper `dim`: the package knows the colours of a preset, not of a picture.

## Seed tags, codes, vs and the tile

In the road look:

- **`seeds: true`** writes a small tag (`C1`, `WC2`, `M3`, `P2`) beside each team's mark: from the tie's `seeds: ["C1", "WC2"]`, else the team's `tag`, else its numeric `seed`. A box of marks alone puts the tag above the mark. Off by default.
- **`codes: true`** writes each team's three letters under its mark in a box of marks alone. Off by default (the road chart's `codes` is on by default).
- **`vs: true`** writes the language's "v" between the two marks of such a box, where there is room.
- A team with no `flag`, `mark` or `logo` is drawn as a **tile**: a rounded square with its abbreviation, filled with the team's `color` when it has one (the letters white or near-black, whichever reads on it), neutral when not. The classic look keeps its disc.
- In the two-sided layouts the champion stands in the centre with the trophy above it: a trophy given as `trophy` (an emblem id with an `emblems` renderer, inline SVG or an address), exactly as before.

## Nothing sticks out

Every size and both looks keep each team's mark, its seed tag, code and score inside its box with a few pixels of room, a shoot-out's score beside the score or under it, and the names of the rounds clear of the connector lines: in a tall bracket the lines turn at the edge of the box they leave and the names stand on their own strip between the rounds, each moved along it to a place the lines do not cross, set a little smaller (down to 8) and on a snugger pill where the room is tight. One case has no clear place: on a phone a round of eight or more boxes across (the 32-team World Cup) has the lines too close together for any name, which then stands over them on its own pill. `test/geometry.test.ts` measures every drawing's marks, text, pills and lines from the markup and asserts all of this.

## For other packages of the family

The drawing of the twenty-five is one file, `src/family-backgrounds.ts`: dependency-free, with no clock, no random number and no import, the same module in every package of the family that draws a background (Kyogijo, Taisen Brackets and the rest).

- **Copy rule.** A package copies the file at build time, byte for byte, into its own `src/` and never edits the copy. A change is made here: the file's `FAMILY_BACKGROUNDS_VERSION` is raised and the new file copied to the others.
- **The hash.** `test/family-backgrounds.test.ts` holds the file's sha256 and its version. A copy that differs, or a change here without the version and the hash raised, fails that test. A package that copies the file adds the same test with this version's hash.
- **The API.** `backgroundSvg(preset, { width, height, theme, colors, angle, intensity, seed, id }) => { defs, body, ink }`: `defs` goes in the drawing's `<defs>`, `body` right after a plain rectangle of `ink.base`, and `ink` holds the text, line, box and accent colours. `BACKGROUND_PRESETS` lists the names. The same options give the same markup, and every id starts with `id` (a hash of the options by default).
- **Licence.** MIT, like the rest of the package. Every preset is original work; none is traced from, or copies, another artist's artwork, logo, trophy or photograph, and a package that adds a preset keeps that.
- **Taisen's own `background` option** wraps it (`src/background.ts` reads the option, draws the picture's frame and hands the ink to the stylesheet); a package with its own drawing does the same.
