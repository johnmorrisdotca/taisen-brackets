// Writes demo/flags-data.js: the round flags the demo draws, taken from @johnmorrisdotca/hata (a development dependency of
// the demo only; the package itself has no dependency on it), and the Commons credit of each. Run `pnpm flags` after changing the list.
import { writeFileSync } from "node:fs";
import process from "node:process";
import { flag } from "@johnmorrisdotca/hata/load";
import { manifest } from "@johnmorrisdotca/hata/manifest";

/** The demo's team ids and the flag each one draws (ISO 3166 codes, as hata keys them). */
export const FLAG_OF = {
  // World Cup 2022
  NED: "NL", USA: "US", ARG: "AR", AUS: "AU", JPN: "JP", CRO: "HR", BRA: "BR", KOR: "KR", FRA: "FR", POL: "PL", ENG: "GB-ENG", SEN: "SN", MAR: "MA", ESP: "ES", POR: "PT", SUI: "CH",
  // the made-up poster's field
  GER: "DE", BEL: "BE", URU: "UY", COL: "CO", MEX: "MX", AUT: "AT", NOR: "NO", ECU: "EC", CAN: "CA", IRN: "IR", EGY: "EG", ALG: "DZ", TUN: "TN", PAR: "PY", KSA: "SA", QAT: "QA", UZB: "UZ",
};

const codes = [...new Set(Object.values(FLAG_OF))].sort();
const flags = {};
const credits = {};
for (const code of codes) {
  const svg = await flag(code, { shape: "round", label: code });
  if (!svg) throw new Error(`hata has no flag for ${code}`);
  flags[code] = svg.replace(/<title>[^<]*<\/title>/, "").replace(/ role="img" aria-label="[^"]*"/, "");
  const m = manifest(code);
  credits[code] = { file: m?.file ?? null, page: m?.page ?? null, licence: m?.licence?.name ?? null, author: m?.author ?? null, attributionRequired: !!m?.attributionRequired };
}
const body = `// Made by scripts/make-flags.mjs from @johnmorrisdotca/hata; do not edit.\n// Round flags for the demo, by ISO 3166 code, and the credit of each (Wikimedia Commons, with the licence it states).\nexport const FLAG_OF = ${JSON.stringify(FLAG_OF)};\nexport const FLAGS = ${JSON.stringify(flags)};\nexport const FLAG_CREDITS = ${JSON.stringify(credits)};\n`;
writeFileSync(new URL("../demo/flags-data.js", import.meta.url), body);
console.log(`${codes.length} flags, ${(body.length / 1024).toFixed(0)} KB`);
const cc = Object.entries(credits).filter(([, c]) => c.attributionRequired);
console.log(cc.length ? `A credit is required for: ${cc.map(([k, c]) => `${k} (${c.licence}, ${c.author})`).join("; ")}` : "No flag asks for a credit; each is still listed in the demo's credits.");
process.exit(0);
