# How it compares

Other libraries draw brackets. This page says what each one's own README and package say, read on 2026-10-13, so that a reader can choose. Nothing here was run, and only ideas were taken from these projects, never code. A blank means the README does not say.

| | Taisen | [brackets-viewer.js](https://github.com/Drarig29/brackets-viewer.js) | [react-tournament-brackets](https://github.com/g-loot/react-tournament-brackets) | [react-brackets](https://github.com/mohux/react-brackets) | [bracketry](https://github.com/sbachinin/bracketry) | [jquery-bracket](https://github.com/teijo/jquery-bracket) |
| --- | --- | --- | --- | --- | --- | --- |
| Needs | nothing: functions return strings | nothing (vanilla JS; i18next for translation) | React | React | nothing stated | jQuery |
| What it draws | an SVG string, with a table beside it | a bracket in the page (round robin, single and double elimination) | an SVG of the matches (single and double elimination), with optional pan and zoom | a `<Bracket>` component (single, two-sided single, double by custom seeds); a swipeable view below a breakpoint | a bracket in the browser (single elimination; third-place matches) | a bracket in the page (single and double elimination) |
| Runs on a server, with no DOM | yes: the output is a string | | | | | |
| Input | matchups as played: games, series, legs, replays; or a tree | brackets-manager's data (stages, matches, participants) | matches with `nextMatchId` | rounds of seeds | its own data shape | teams and results arrays |
| Works out the rounds and who feeds whom | yes, from who plays whom, or from `feeds` | from its input's stages | from `nextMatchId` | from your rounds | | |
| Series, two legs, replays, shoot-outs as ties | yes | | | | tennis scoring (sets, tie-breaks) | |
| Byes | worked out and marked; any number of teams | | | | | yes, for any number of teams |
| Halves that meet at the final | yes, named for the conferences | | | two-sided | | |
| Third-place match | placed apart | | | | supported | a consolation round |
| Champion, trophy slot | yes | | | | | |
| Sizes made for a poster, a square card, a phone | yes | | | a swipeable mobile view | mobile tuning | |
| Themes | light, dark, a poster look, CSS custom properties | CSS variables | a theme object | custom classes | sizes, margins, fonts | CSS |
| Accessible table of the same data | yes | | | | | |
| Formats of the leagues by era | NHL, NBA, MLB, NFL, CFL, World Cup | | | | | |
| Licence | MIT | MIT in its README, ISC in its npm metadata | LGPL-2.1 on its repository page, ISC in its npm metadata | MIT | MIT | MIT |

Where a README and a package's metadata disagree on the licence (two of them do), the table says both; read the repository's licence file before reusing any of them. Taisen takes no code from any of them.

## Where the others go further

- **Interaction.** brackets-viewer.js, react-tournament-brackets, bracketry and jquery-bracket handle clicks and hover on a match; bracketry highlights a team's path and updates live; jquery-bracket has an edit mode. Taisen draws a still picture and a table, and leaves the interaction to your page.
- **Double elimination.** brackets-viewer.js, react-tournament-brackets and jquery-bracket draw it. Taisen does not (see the roadmap).
- **A component for your framework.** react-tournament-brackets and react-brackets are React components, with custom renderers for a box.

## Where Taisen goes further

- **It reads games, not a tree.** A series, two legs, a replay and a shoot-out are ties with a result of their own, and the winner, the score drawn and the note ("in 7", "a.e.t.", "pens 4–2") come from them.
- **It works without a browser.** The same call draws the bracket in a build step, a worker, a server or a script that makes pictures for a social card.
- **A poster is one option away.** The same bracket in a gold-on-navy look, flags only, in a wide, square or phone shape.
- **The leagues' formats by era** are data in the package.
