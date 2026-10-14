// The demo's one page, made from demo/index.html and the family's shared head, header, footer and language chooser
// (family-template.mjs). The Pages build (site.mjs) writes it into site/, and the dev server (dev.mjs) serves the same
// text, so the tests play the page that is published.
import { readFileSync } from "node:fs";

import { FAMILY_SCRIPT, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";

const id = "taisen-brackets";
const TITLE = "Taisen 対戦: knockout brackets as SVG";
const DESCRIPTION = "Knockout brackets as SVG strings: halves that meet at the final, series, two legs, replays, byes, a third-place match, light, dark and a gold-on-navy poster look. Zero dependencies.";

/** The words the shared header and footer say for this page, in both languages. The playground below them is English. */
const WORDS = {
  en: {
    pitch: "Knockout brackets as SVG, from a list of ties.",
    name: "Taisen (対戦, たいせん) is Japanese for a matchup: two sides facing each other.",
    nameLink: "The name",
    foot: "Brackets as SVG, with no dependencies.",
  },
  ja: {
    pitch: "対戦の一覧から、トーナメント表をSVGで描きます。",
    name: "対戦（たいせん）は、二者が向かい合って勝負することです。",
    nameLink: "名前について",
    foot: "SVGでトーナメント表を描きます。依存パッケージはありません。",
  },
};

/** demo/index.html with the family's blocks put in where its comments say. */
export function renderIndex() {
  return readFileSync(new URL("../demo/index.html", import.meta.url), "utf8")
    .replace("<!--family:head-->", familyHead({ id, title: TITLE, description: DESCRIPTION }))
    .replace("<!--family:header-->", familyHeader({ id }))
    .replace("<!--family:unreviewed-->", familyUnreviewed({ id }))
    .replace("<!--family:footer-->", familyFooter({ id }))
    .replace(
      /<!--family:scripts ([\w.-]+)-->/,
      (_, script) => `<script>${FAMILY_SCRIPT}</script>\n<script>familyLanguage({ id: ${JSON.stringify(id)}, words: ${JSON.stringify(WORDS)} });</script>\n<script type="module" src="${script}"></script>`,
    );
}
