// Packs the package the way it is published (`npm pack`), installs the tarball into an empty project, and uses it as somebody
// who installed it would: every entry in `exports` imported by ESM and loaded by `require`, and a bracket drawn that must equal
// the one this checkout draws. A package whose `exports` name a file that is not in the tarball fails here, before it is published.
// `pnpm test:package` builds first.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const windows = process.platform === "win32";
const scratch = mkdtempSync(join(tmpdir(), "taisen-package-"));

function run(command, args, cwd, viaShell = false) {
  const shell = viaShell && windows;
  const ran = spawnSync(shell && /[\\/]/.test(command) ? `"${command}"` : command, args, { cwd, encoding: "utf8", shell });
  if (ran.status !== 0) {
    console.error(`FAIL ${command} ${args.join(" ")}\n${ran.stdout}\n${ran.stderr}`);
    process.exit(1);
  }
  return ran.stdout;
}

// 1. Pack, with npm.
const packed = JSON.parse(run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", scratch], root, true));
const tarball = join(scratch, packed[0].filename);
const inTarball = new Set(packed[0].files.map((file) => file.path));
console.log(`ok   npm pack: ${packed[0].filename}, ${packed[0].files.length} files`);
const shipped = [...inTarball].filter((file) => file.startsWith("docs/") || file.startsWith("demo/") || /\.(webp|png|jpe?g|gif)$/.test(file));
if (shipped.length > 0) {
  console.error(`FAIL the tarball holds the demo, docs or pictures: ${shipped.join(", ")}`);
  process.exit(1);
}
console.log("ok   no demo, doc or picture is in the tarball");

// 2. Everything package.json points at is in the tarball.
const pointed = [pkg.main, pkg.module, pkg.types, ...Object.values(pkg.exports).flatMap((entry) => (typeof entry === "string" ? [entry] : Object.values(entry)))];
for (const file of new Set(pointed)) {
  if (!inTarball.has(file.replace(/^\.\//, ""))) {
    console.error(`FAIL package.json points at ${file}, which is not in the tarball`);
    process.exit(1);
  }
}
console.log(`ok   every file package.json points at is in the tarball (${new Set(pointed).size})`);
for (const named of pkg.files) {
  if (![...inTarball].some((file) => file === named || file.startsWith(`${named}/`))) {
    console.error(`FAIL package.json's files names ${named}, which is not in the tarball`);
    process.exit(1);
  }
}
console.log(`ok   everything in package.json's files is in the tarball (${pkg.files.length})`);
if (Object.keys(pkg.dependencies ?? {}).length > 0) {
  console.error("FAIL the package has runtime dependencies; it is dependency-free");
  process.exit(1);
}
console.log("ok   no runtime dependencies");

// 3. Install it into an empty project.
const project = join(scratch, "project");
mkdirSync(project);
writeFileSync(join(project, "package.json"), JSON.stringify({ name: "scratch", private: true, version: "0.0.0" }));
run("npm", ["install", "--no-audit", "--no-fund", "--silent", tarball], project, true);
console.log("ok   npm install of the tarball");

// What the built package in this checkout makes: the installed one must make the same.
const local = await import(new URL("../dist/index.js", import.meta.url).href);
const input = {
  teams: [{ id: "a", name: "Alpha" }, { id: "b", name: "Beta" }, { id: "c", name: "Gamma" }, { id: "d", name: "Delta" }],
  matchups: [{ sides: ["a", "b"], score: [2, 1], date: "1" }, { sides: ["c", "d"], score: [0, 1], date: "1" }, { sides: ["a", "d"], score: [1, 1], pens: [4, 3], extraTime: true, date: "2" }],
};
const expected = local.drawBracket(input, { id: "pack" });
const expectedPhone = local.drawBracket(input, { id: "pack", size: "phone", theme: "poster" });
const expectedTable = local.bracketTable(input);

// 4. Every entry in `exports`, by ESM and by require.
const entries = Object.keys(pkg.exports).map((key) => (key === "." ? pkg.name : `${pkg.name}/${key.slice(2)}`));
writeFileSync(
  join(project, "esm.mjs"),
  `${entries.map((entry, i) => `import * as m${i} from ${JSON.stringify(entry)};`).join("\n")}
const all = [${entries.map((_, i) => `m${i}`).join(", ")}];
const names = ${JSON.stringify(entries)};
all.forEach((m, i) => { if (Object.keys(m).length === 0) throw new Error(names[i] + " exports nothing"); });
const { drawBracket, bracketTable, layoutBracket, playoffFormat, VERSION } = m0;
const input = ${JSON.stringify(input)};
if (drawBracket(input, { id: "pack" }) !== ${JSON.stringify(expected)}) throw new Error("the installed package drew another bracket");
if (drawBracket(input, { id: "pack", size: "phone", theme: "poster" }) !== ${JSON.stringify(expectedPhone)}) throw new Error("the installed package drew another phone bracket");
if (bracketTable(input) !== ${JSON.stringify(expectedTable)}) throw new Error("the installed package wrote another table");
if (VERSION !== ${JSON.stringify(pkg.version)}) throw new Error("VERSION is " + VERSION);
if (layoutBracket(input).champion?.id !== "a") throw new Error("the layout is wrong");
if (m1.layoutBracket !== layoutBracket && m1.layoutBracket(input).champion?.id !== "a") throw new Error("the layout entry is wrong");
if (playoffFormat("nhl", 2024)?.rounds.length !== 4 || m2.playoffFormat("worldcup", 2026)?.rounds.length !== 5) throw new Error("the formats are wrong");
console.log(names.join(" "));
`,
);
writeFileSync(
  join(project, "cjs.cjs"),
  `const names = ${JSON.stringify(entries)};
for (const name of names) { const m = require(name); if (Object.keys(m).length === 0) throw new Error(name + " exports nothing"); }
const { drawBracket } = require(${JSON.stringify(pkg.name)});
if (drawBracket(${JSON.stringify(input)}, { id: "pack" }) !== ${JSON.stringify(expected)}) throw new Error("require draws another bracket");
console.log(names.join(" "));
`,
);
console.log(`ok   import:  ${run(process.execPath, ["esm.mjs"], project).trim()}`);
console.log(`ok   require: ${run(process.execPath, ["cjs.cjs"], project).trim()}`);
console.log(`ok   ${packed[0].files.length} files, ${(packed[0].size / 1024).toFixed(0)} kB packed, ${(packed[0].unpackedSize / 1024).toFixed(0)} kB unpacked`);
