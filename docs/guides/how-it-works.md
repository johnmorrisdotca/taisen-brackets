---
title: How a bracket is drawn
section: explanation
order: 20
description: What the package does with a list of ties, from the layout to the SVG.
---

A bracket starts as a list of ties, in any order. Each tie is a game, a best-of series, two legs added up or a game with a replay, so one layout draws a hockey playoff and a World Cup alike.

1. **The teams** are collected once: those you list, and a team of its own for each side named by an id that is not listed.
2. **Each tie is resolved**: its result is worked out from the score, the games or the legs, and so is who won.
3. **The layout** finds which tie feeds which (a winner goes on to the next tie its team plays, or the tie that `feeds` names), the rounds, which half each tie sits in and which side has a bye. This part is [`layoutBracket`](api:layoutBracket): pure, with no drawing.
4. **The drawing** is [`drawBracket`](api:drawBracket): it turns the layout into an SVG string with its own style, in the look, size, theme and language you ask for.

Nothing is drawn by a browser's layout engine, so the same input gives the same bytes everywhere: in a page, on a server, in a test. The other boards (rankings, medal tables, judo boards, results boards) follow the same rule: data in, SVG text out.
