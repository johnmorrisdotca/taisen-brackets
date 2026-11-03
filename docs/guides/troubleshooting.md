---
title: Troubleshooting
section: troubleshooting
order: 30
description: What to check when a bracket is empty, a name is missing, or the page shows nothing.
---

## Nothing appears

- The result of `drawBracket` is a string. Put it in the page (`element.innerHTML = svg`); logging it draws nothing.
- On a plain page, the script needs `type="module"`, and its address must end in the built file (see [plain HTML and CDNs](html-and-cdn.md)).
- In a framework, give the string as HTML ([React, Vue, Svelte and Angular](frameworks.md)).

## A team shows its id instead of its name

A side named by an id that is not listed is a team of that name. List the teams once, with names, and name the sides by id: `{ matchups, teams }`.

## Two matchups have the same id

Each tie's id must be its own: the layout refuses two ties with the same one. Leave `id` out and the package numbers the ties.

## A flag or a trophy is missing

The package draws no flag or trophy of its own. Give `flags` a function that returns the flag's SVG (such as one made from Hata), and `emblems` a function that draws an emblem. A team with no mark is drawn as its initials.

## The picture is wider than the page

The SVG scales: give it `width: 100%; height: auto` in your CSS, or choose another `size` (`wide`, `square`, `card` or `phone`).
