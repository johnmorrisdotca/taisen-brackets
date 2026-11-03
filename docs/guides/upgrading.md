---
title: Upgrading
section: upgrading
order: 40
description: What changes between releases, and where it is written.
---

The package is at 0.x: a minor release may add options and entry points, and says so in the [changelog](../../CHANGELOG.md). Between 0.18.0 and 0.19.0 nothing in the code changed; the demo, the docs and the release tooling did.

- Read the changelog entry of each release you skip. Every change that can alter a drawing is written there, with the option that restores the old one.
- The drawings are tested byte for byte, so a release that changes one says which and why.
- Pin a version in your lockfile, and update when you can look at the pictures.
