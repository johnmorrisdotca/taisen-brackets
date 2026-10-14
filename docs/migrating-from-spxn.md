# Migrating spxn.com to Taisen

spxn.com (the `spx-stats` repository, `web/`) draws its playoff brackets and World Cup knockouts with its own layout: `web/src/lib/bracket.ts`, `web/src/components/BracketFrame.tsx`, the adapters `seriesTies()` in `web/src/lib/series.ts` and `knockoutOf()` in `web/src/lib/soccerBracket.ts`, the box components in `SeasonPlayoffs.tsx` and the soccer page, and the CSS in `series.css`. This package is that layout with the sport taken out and a drawing added. This note says how `web/` would use it. Nothing in `spx-stats` has been changed.

## What maps to what

| spxn | Taisen |
| --- | --- |
| `Tie<K>` (`teams`, `winner`, `start`) | `Matchup` (`sides`, `winner`, `date`) |
| `buildBracket(ties, round, confOf)` | `layoutBracket({ matchups, teams })`: `round` is `Matchup.round`, `confOf` is `Team.group` |
| `Bracket` (`sides`, `final`, `columns`, `rows`, `other`, `robin`, `place`) | `BracketLayout`: the same names, with `place` and `parent` as arrays and `third`, `champion`, `teams` added |
| `Box` (`i`, `round`, `y`, `to`, `fed`) | `LayoutBox` (the same, with `order` and `bye`) |
| `seriesTies(list)` | map each `Series` to a matchup: `{ id, sides: [franchiseA, franchiseB], bestOf, score: wins, winner, date: start }` |
| `knockoutOf(matches)` | `matchupsFromGames(games, { stages, third: "third_place" })` |
| `BracketFrame` + `series.css` | `drawBracket` (a string) in a server component, or `layoutBracket` plus your own React boxes if links are needed |
| the halves' `Conf` names | `Team.group` (`"West"`, `"East"`) |
| hourly ISR, no per-request server work | the same: `drawBracket` is pure, so the page stays a kept page |

## The two ways to use it

**1. Keep spxn's boxes, replace only the layout** (the smaller change). `web/src/lib/bracket.ts` is deleted and `web/src/components/BracketFrame.tsx` keeps its job, reading a `BracketLayout` instead of a `Bracket`. The boxes stay React components that link to the series page. Only `buildBracket` is replaced by `layoutBracket`; the fields `BracketFrame` reads (`sides`, `final`, `columns`, `rows`, `place`) have the same names and meaning. This keeps every link, the conference filter and the division dimming.

**2. Draw the bracket as an SVG** for the places that do not need a link in every box: the share card for a season, the World Cup poster, an image in a social post, the print view. `drawBracket(layout, { size: "square", theme: "poster" })` is a string that a route handler returns as `image/svg+xml`, or that a server component writes inline.

Do (1) first, then (2) where there is a use for it.

## Steps for (1)

1. `pnpm add @johnmorrisdotca/taisen-brackets` in `web/` (pinned at an exact version, as spxn pins John's packages).
2. Replace `import { buildBracket, type Bracket } from "@/lib/bracket"` with the package's `layoutBracket` and `BracketLayout`. Where `loadPlayoffs` builds a bracket, build `Matchup`s from the `Series` list:

   ```js no-run
   const matchups = series.map((s, i) => ({
     id: `s${i}`,
     sides: [s.sides[0].f, s.sides[1].f],
     kind: s.basis === "goals" ? "aggregate" : "series",  // a total-goals series is two legs added up
     bestOf: s.bestOf,                       // 7 for an NHL round, 5 for a baseball division series
     score: s.basis === "goals" ? [s.sides[0].scored, s.sides[1].scored] : [s.sides[0].wins, s.sides[1].wins],
     winner: s.winner == null ? null : s.sides[s.winner].f,
     round: roundOf[i],                      // spxn's own round, 1 = first round (0 = round robin)
     date: s.start,
   }));
   const teams = franchises.map((f) => ({ id: f.id, name: f.name, group: conferenceOf(f.id)?.name }));
   const layout = layoutBracket({ matchups, teams });
   ```

   Pass `round` as spxn does today: the package would otherwise infer it from who plays whom, which is the same answer for a complete playoff but not for a season where a bye puts two teams in a round without a feeder.
3. `BracketFrame` takes `layout` where it took `bracket`. `b.place` is an array of `"l" | "r" | "f" | "o"` indexed by tie (it was a `Map`), and `b.other` and `b.robin` are the same lists as before.
4. For the World Cup, replace `knockoutOf` with `matchupsFromGames` (the `stage_key` order is `stages`, `third_place` is `third`). A replayed match (1934, 1938) becomes one tie of two games, as `knockoutOf` made it.
5. Delete `web/src/lib/bracket.ts` and its test (`web/scripts/bracket.test.ts`): the same cases are in this package's `test/layout.test.ts`. Keep `series.css`'s box rules; the layout rules (`.bk*`) stay while `BracketFrame` stays.
6. Run `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` and `pnpm test:routing`, and look at one NHL season and one World Cup: the halves, the conference names and the third-place match.

## Differences to know about

- **`Bracket.place` is an array, not a `Map`.**
- **Each box has `order`**: which side is on top. spxn only reversed the final; the package reverses any tie whose first feeder carries the second side, so the top row of a tie is always the team from the top feeder.
- **`Series.sides` lists the winner first**, and the package draws `sides` in the order given, marking the winner with `winner`; the top row of a box is whichever team came from the top feeder, as above.
- **Ties are ordered** by `no`, then `date`, then the team's id (spxn used the date, then `teams[0]`). Pass `no` to keep a bracket's official order.
- **Groups come from `Team.group`** and the half is named by the group most of its teams are in (spxn used the conference of the final's side). The result is the same wherever the final's sides come from the halves they lead.
- **Sizing is not in the layout.** spxn's `row` and `colw` props remain `BracketFrame`'s; the package's sizes belong to `drawBracket`.
- **The package has no i18n.** Round names stay spxn's (`roundSay`), passed as `roundNames` when `drawBracket` is used.

## Licence and credit

spxn is the same owner's code and MIT-compatible; the package is MIT. Nothing external is credited.
