// Writes demo/flags-data.js: the round flags the demo draws, taken from @johnmorrisdotca/hata (a development dependency of
// the demo only; the package itself has no dependency on it), and the Commons credit of each. The flags are those of the nations in
// the World Cup data of 2022 and 2026 and of the made-up judo tournament and rankings (demo/data/), by their ISO 3166 code. Run `pnpm flags` after the data changes.
import { writeFileSync } from "node:fs";
import process from "node:process";
import { flag } from "@johnmorrisdotca/hata/load";
import { manifest } from "@johnmorrisdotca/hata/manifest";
import { WORLD_CUPS } from "../demo/data/worldcup-1938-2022.js";
import { WORLD_CUP_2026 } from "../demo/data/worldcup-2026.js";
import { JUDO_SAMPLE } from "../demo/data/judo-sample.js";
import { RANKING_SAMPLE } from "../demo/data/ranking-sample.js";
import { MEDAL_AWARDS } from "../demo/data/medal-sample.js";
import { RESULTS_SAMPLE } from "../demo/data/results-sample.js";

const codes = [...new Set([...[...WORLD_CUPS.wc2022, ...WORLD_CUP_2026.matches].flatMap((m) => [m.home_flag, m.away_flag]), ...JUDO_SAMPLE.athletes.map((a) => a.flag), ...Object.values(RANKING_SAMPLE.lists).flatMap((l) => l.entries.map((e) => e.flag)), ...RANKING_SAMPLE.numberOnes.map((c) => c.entry.flag), ...RANKING_SAMPLE.entryList.entries.map((e) => e.flag), ...MEDAL_AWARDS.map((a) => a.flag), ...Object.values(RESULTS_SAMPLE).flatMap((b) => b.rows.map((r) => r.flag))].filter(Boolean))].sort();
const flags = {};
const credits = {};
for (const code of codes) {
  const svg = await flag(code, { shape: "round", label: code });
  if (!svg) throw new Error(`hata has no flag for ${code}`);
  flags[code] = svg.replace(/<title>[^<]*<\/title>/, "").replace(/ role="img" aria-label="[^"]*"/, "");
  const m = manifest(code);
  credits[code] = { file: m?.file ?? null, page: m?.page ?? null, licence: m?.licence?.name ?? null, author: m?.author ?? null, attributionRequired: !!m?.attributionRequired };
}
// The broadcast boards draw flags 4:3, so their codes also get a rectangular drawing (Hata's "4:3").
const rectCodes = [...new Set(Object.values(RESULTS_SAMPLE).flatMap((b) => b.rows.map((r) => r.flag)).filter(Boolean))].sort();
const rect = {};
for (const code of rectCodes) {
  const svg = await flag(code, { shape: "4:3", label: code });
  if (!svg) throw new Error(`hata has no 4:3 flag for ${code}`);
  rect[code] = svg.replace(/<title>[^<]*<\/title>/, "").replace(/ role="img" aria-label="[^"]*"/, "");
}
const body = `// Made by scripts/make-flags.mjs from @johnmorrisdotca/hata; do not edit.\n// Round flags for the demo, by ISO 3166 code, and the credit of each (Wikimedia Commons, with the licence it states).\nexport const FLAGS = ${JSON.stringify(flags)};\n// The same nations drawn 4:3, for the broadcast boards.\nexport const FLAGS_RECT = ${JSON.stringify(rect)};\nexport const FLAG_CREDITS = ${JSON.stringify(credits)};\n`;
writeFileSync(new URL("../demo/flags-data.js", import.meta.url), body);
console.log(`${codes.length} flags (${codes.join(" ")}), ${(body.length / 1024).toFixed(0)} KB`);
const cc = Object.entries(credits).filter(([, c]) => c.attributionRequired);
console.log(cc.length ? `A credit is required for: ${cc.map(([k, c]) => `${k} (${c.licence}, ${c.author})`).join("; ")}` : "No flag asks for a credit; each is still listed in the demo's credits.");
process.exit(0);
