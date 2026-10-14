# Roadmap

What is planned and not built. Nothing here is promised for a date; each item says where it came from. The pictures that prompted them are listed in [references](./references.md), as mood only: no layout, artwork or mark of theirs is copied.

## Planned for 0.6.0: new layouts

Each is a new `layout` (or a `look` and a `size` together) over the same ties, so one tournament can be drawn every way. All of them take the `background` option of 0.5.0, the seed tags, and the same text fallback for a team with no picture.

1. **`rows`**: each team a horizontal row, its name on the left and its logo, flag or abbreviation tile on the right, the seed tag in the corner, with empty result boxes leading toward the centre.
2. **`shields`**: team marks inside shield shapes with "vs" between the two of a tie, the matchups listed down the left and the right of a central trophy.
3. **`update`**: a compact score-update card: abbreviation, seed and series score for each team, empty cards for the rounds to come, the final in the centre ("as of" date as the subtitle).
4. **`columns`** (tall rectangles, the NFL poster's style): each round is a column of tall slots that get taller toward the centre; the two conferences are coloured (their own pair of colours); "vs", or "at" for home and away, on a tag between the two slots of a tie; a big seed number beside each team's slot; the final is two tall slots side by side. An `at` wording option (a word in each language) for sports that name the home side.
5. **`play-in`** (the NBA's): a West and an East half with seed tiles ("1st", "8th seed") and the play-in games, 9 v 10 and 7 v 8, leading into "Winner 9/10" and "Loser 7/8" boxes, with arrows into the 7th and 8th seed slots.
   - **The model today cannot say it.** A tie's `feeds` names the ties whose *winners* take its two sides (`feeds: [a, b]`), and the third-place match is a flag, `third`, not a link from the two semi-finals' losers. A loser that goes on to a later tie has no way to be written.
   - **The design:** let each entry of `feeds` be either a tie id (as now: its winner) or `{ tie: "<id>", result: "winner" | "loser" }`. The layout then has two kinds of edge: the winner's, drawn as the connector of today, and the loser's, drawn as an arrow in a different line style (dashed, with an arrowhead), and a tie may be fed by a winner and a loser. `third` becomes a convenience for a tie fed by the losers of the two semi-finals. `Tie` gains `from: [Source | null, Source | null]` where `Source = { tie: number; result: "winner" | "loser" }`, next to the `winner`-only `parent` it keeps for the existing layouts. A tie with a loser edge cannot sit in the tree's columns by its feeders alone, so the play-in games are given `round: 0.5` or a `stage: "play-in"` and drawn beside the seed tiles.
   - Tests to write first: a loser edge is drawn (an arrow), a bracket with none is drawn exactly as today, a cycle in `from` is refused with the tie named, and the table says "loser of …".
6. **`series card`**: a vertical top-to-bottom bracket, East on top and West below with the final in the middle; each box has two teams with their seeds and the series score as one line, "BOS 4-0 MIA", the winner bold. A phone-width tall bracket already exists (`size: "phone"`, the halves as the top and the bottom); what is new is the one-line series score and its seed digits.
7. **`conference` headers**: big title tiles (West and East, AFC and NFC) over each half, which any layout can use: a `headers` option, off by default, drawing each half's `group` name as a tile in the colour of the half.
8. **A group-stage table** (below).

## Planned for 0.6.0: from the first sites to adopt the road look

Found by spxn.com when it moved to 0.4.0. Five were small and are in 0.5.0 (see the changelog): a team's flag or logo as an address is written once as a symbol (`flagHref`, and every `mark` address), the word "bye" never meets a score, a round's name is never cut (smaller, then on two lines), and `tieClass(tie)` for a page's own highlight or dim. Two are left:

1. **A lone final with a third-place match** (the World Cups of 1974 and 1978, which ended in a second group stage): the final and the champion are drawn off to one side with large empty areas. They should be centred, with the third-place match under them. The layout's shape for a tournament with no semi-finals in the tree needs its own centring rule, and a test with those two tournaments' ties.
2. **A stylesheet written once** for a page that draws two sizes of the same bracket (a desk's and a phone's): an option to leave the `<style>` out, or to share a class prefix, so that the second drawing's rules are not a copy of the first's. Its ids (clips, symbols) must stay apart, so the scope of the rules and the prefix of the ids become two options (`styleScope`, `id`); the rules are already scoped by one class, so a second drawing that carries the first's scope class and writes no `<style>` takes its colours from it.

## Planned: a group-stage table drawing

John Morris asked for this on 2026-10-14, from the group cards of the softball and futsal references (nos. 62, 63, 65 in [references](./references.md)); it is **not built yet**.

A drawing of the groups before the knockout: one card per group with a title tile (`Group A`, with a place and dates under it when given), then a row per team with its flag or mark in a rounded box, its name, and wins and losses (or played, won, drawn, lost, goals and points), the places that go through marked, and a team still to be decided as "Africa TBD"-style placeholder rows. It would be a new export beside `drawBracket` and `roadToFinal`, with the same `size`s (`card`, `square`, `wide`, `phone`), `look`s, `background`, `flags`, `locale`, an accessible table and the same geometry test: every mark inside its row, every text inside its box. The input is the round-robin games the layout already keeps under `round: 0` (`layout.robin`), which are today drawn as a plain grid below the bracket, so one tournament would draw its groups, its bracket and the road to its final.

## Not planned

- A server, a canvas or a DOM: a drawing stays a pure function that returns a string.
- Pictures that are not drawn in code: every background is SVG drawn in code, and a picture of your own goes in as `background: { image }`, never shipped.
