# Roadmap

What is planned and not built. Nothing here is promised for a date; each item says where it came from. The pictures that prompted the layouts are listed in [references](./references.md), as mood only: no layout, artwork or mark of theirs is copied.

## Judo

- **0.7.0** (built): judo results in the boxes and the repechage bracket, [docs/judo.md](./judo.md).
- **0.8.0** (built): a contest scoreboard drawing for a given state, as a board or as flip cards, for a TV and a tablet.
- **0.9.0** (built): the contest card and the mat queue board (per mat, the upcoming contests in order).
- **0.10.0** (built): the road to the final of one judoka.
- Not drawn: double repechage and full repechage (their pools are in the rules' Appendix G charts), team events.

## Rankings and results boards

- **0.11.0** (built): the ranking list, [docs/rankings.md](./rankings.md).
- **0.12.0** (built): the number ones and the entry list.
- **0.13.0** (built): the head-to-head card.
- **0.14.0** (built): the medal table for any sport, [docs/medals.md](./medals.md).
- **0.15.0** (built): the broadcast-style results board, [docs/broadcast.md](./broadcast.md).
- Next: the bout presentation board and the broadcast-style medal table.

## Built in 0.6.0

Everything the 0.5.0 roadmap planned for 0.6.0 is in the package: see the [changelog](../CHANGELOG.md) and [layouts](./layouts.md).

- `layout`: `rows`, `shields`, `update`, `columns` (with `at` and `Matchup.home`), `playin`, `series` and `groups`, beside the default `tree`; each with the backgrounds, both looks, the four sizes, the five languages, links, seeds, codes, flags and tiles, and a geometry test over every layout, size and look.
- Loser edges: a `feeds` entry can be `{ tie, result: "winner" | "loser" }`, `Tie.from` says where each side comes from, `stage: "play-in"` keeps a game out of the tree, a cycle is refused with the ties named, and the table says "Loser of …".
- `headers`: big title tiles over each half, in any layout.
- A group-stage table drawing: `groups`, with `groupStandings` and `groupsTable`.
- A lone final with a third-place match is centred, the champion over it (the World Cups of 1974 and 1978).
- `styleScope`, `style: false` and `bracketStyle` for one stylesheet shared by several drawings of a page.
- The README's pictures are WebP: two to three times smaller than the JPEG they replaced, at no loss anyone sees.

## Ideas, not planned

- **The group tables and the knockout they lead to in one drawing**: cards on one side, the tree on the other, with an arrow from each group's qualifiers into the first round. Today they are two drawings of the same tournament (`layout: "groups"` and the tree).
- **A loser edge in the other layouts**: a dashed arrow from a semi-final's loser to the third-place match in the tree. The model has it (`feeds` with `result: "loser"`); only `playin` draws it.
- **Double elimination**, which needs the loser edges drawn in the tree and a second bracket for the losers.
- **A group tiebreak of your own** (head to head, fair play): `groupStandings` orders by points, goal difference and goals scored, then name.

## Not planned

- A server, a canvas or a DOM: a drawing stays a pure function that returns a string.
- Pictures that are not drawn in code: every background is SVG drawn in code, and a picture of your own goes in as `background: { image }`, never shipped.
