# Notice: where the facts and the pictures come from

The code of this package is under the MIT licence (see [LICENSE](LICENSE)). The package draws what it is given and carries no data except the formats below; the demo and the docs carry some facts and some pictures, listed here.

| What | Made from | Terms |
| --- | --- | --- |
| `playoffFormat`: round names, series lengths, byes and teams by era | The leagues' published histories of their playoffs (the NHL, NBA, MLB, NFL, CFL and FIFA, read in English Wikipedia's articles on each playoff, 2026-10-13) | Facts: no text or table is copied |
| The demo's results: NHL 2024, World Cup 2022 and 1938, MLB 2022 | The published results of those events | Facts |
| The demo's two-legged ties, its 32-team field and its poster field | Made up for the demo: the clubs do not exist, and the poster's nations and results are illustrative, not the real draw or results | Not real |
| The demo's national flags (in `demo/flags-data.js`) | [Hata](https://github.com/johnmorrisdotca/hata) 1.5.0 (MIT code), a development dependency used only by `scripts/make-flags.mjs`. Each flag is a Wikimedia Commons file that Hata ships only when Commons states it public domain, CC0 or CC BY; the file, author and licence of each are in `FLAG_CREDITS` in that file and in Hata's manifest and NOTICE | Each flag's own licence; none of the flags used asks for a credit. Commons marks flags as official insignia, whose use some countries restrict independently of copyright |
| The demo's page | Written for this package, with the family stylesheet `demo/family.css` | MIT |

The flags in the demo are for the codes `AR AT AU BE BR CA CH CO DE DZ EC EG ES FR GB-ENG HR IR JP KR MA MX NL NO PL PT PY QA SA SN TN US UY UZ`. The package itself ships no flag, no logo and no data of the leagues.

No code, text or picture was taken from the bracket libraries compared in [docs/compare.md](docs/compare.md); that page records what each says of itself.
