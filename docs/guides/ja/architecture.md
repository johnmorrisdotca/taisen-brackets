---
title: 設計：対戦の一覧から SVG 文字列まで
section: explanation
order: 21
description: このガイドは、パッケージを変更したい人、またはその振る舞いの理由を知りたい人のためのものです。
---

このガイドは、パッケージを変更したい人、またはその振る舞いの理由を知りたい人のためのものです。一回の呼び出し `drawBracket(ties)` を、入力から文字列まで追い、正しさを保つ規則を示します。

## パイプライン

```text
ties ──► matchup.ts ──► seeding.ts ──► layout.ts ──► render.ts ──► one string of SVG
         (a tie's        (a tree for     (rounds, halves,   (boxes, lines,     │
          result)         any teams)      byes, who feeds    marks, text)       ├─ layouts.ts: the boxes of rows, shields, update, columns, series
                                          whom)                                 ├─ marks.ts, text.ts: marks made safe, text measured and cut
                                                                                └─ theme.ts, family-backgrounds.ts: colours and backgrounds
```

- **`matchup.ts`** は一つの対戦を読みます。種類（一試合、シリーズ、合計スコアの 2 試合、再試合）、スコア、勝者、注記です。以降の処理はすべてこのモジュールに尋ねます。勝者を決めるモジュールはほかにありません。
- **`layout.ts`** は競技に依存しない部分です。対戦から（チームを渡せばそれも使って）、ラウンド（誰が誰と戦うかから求めるか、指定されたもの）、どの対戦がどこにつながるか、二つの半分とその名前、バイ、3 位決定戦、優勝者を求めます。描画は含まず、`/layout` エントリーポイントとして単独で公開されています。
- **`render.ts`** は、サイズと形に応じてボックスと接続線を配置し、対戦を独自に描くレイアウトでは `layouts.ts` に一つのボックスを埋めさせます。すべてのマーク、テキスト、欄は渡された長方形の内側に収まり、テストがすべてのレイアウト、サイズ、見た目でそれを測っています。
- **`road.ts`** は同じレイアウトから決勝への道を描きます（`/road` エントリーポイント）。**`presets.ts`** は年代ごとのフォーマットを持ち（`/presets`）、**`family-backgrounds.ts`** は 25 の背景を持ちます（`/backgrounds`）。

## 四つの規則

1. **純粋で決定的。** 描画は入力とオプションだけで決まる関数です。時計も乱数もカウンターも DOM も使いません。描画の中の ID は入力のハッシュから作られるので、同じ入力からは同じ文字列ができ、同じページの二つの描画で ID がぶつかりません。だから出力をキャッシュし、比較し、スナップショットテストできます。
2. **依存はなく、プラグインは関数。** 旗とエンブレムはインポートしません。コードから SVG 文字列を返す、ただの同期関数 `flags` と `emblems` を渡します。パッケージは小さいままで、例外を投げたりおかしなものを返したりする描画関数があっても、失敗せず代わりの描画になります。
3. **外から来るものはすべて、入る時点で安全にされる。** テキストはエスケープされます。SVG として渡したマークやトロフィーは `cleanSvg` を、画像の URL は `safeUrl` を、リンクは `safeHref` を通ります。`id` は英数字と `-` と `_` に絞られます。マークアップに届く新しいオプションには、悪意のある値を使ったテストが付きます（`test/hostile-id.test.ts`）。
4. **テキストは測るのではなく見積もる。** 行の幅はフォントのファイルではなく文字の種類から求めるので、文字列はどのマシンでも同じです。長い名前は数パーセント早く、または遅く省略記号で切られますが、これが第一の規則を守るための代償です。

```js
import { drawBracket } from "@johnmorrisdotca/taisen-brackets";

const ties = [{ sides: ["A", "B"], score: [1, 0], date: "1" }, { sides: ["C", "D"], score: [0, 2], date: "1" }, { sides: ["A", "D"], score: [2, 1], date: "2" }];
console.log(drawBracket(ties) === drawBracket(ties)); // true
console.log(drawBracket(ties, { id: "x" }).includes('id="x'));
```

## エントリーポイント

| エントリーポイント | 含むもの |
| --- | --- |
| `@johnmorrisdotca/taisen-brackets` | すべて |
| `/layout` | レイアウトとその補助関数。描画なし |
| `/presets` | 年代ごとのフォーマット |
| `/road` | 決勝への道 |
| `/backgrounds` | 25 の背景だけ |

必要なものを持ついちばん狭いエントリーポイントからインポートしてください。

## データはスクリプトから、ドキュメントはデータから

`docs/formats.md` と `docs/languages.md` は、`src/presets.ts` と `src/locales.ts` から `scripts/make-formats-doc.mjs` と `scripts/make-languages-doc.mjs` が書き出します。`pnpm test:readme` はそれらを `--check` つきで実行するので、表がコードに遅れることはありません。API リファレンスも、ソースのドキュメントコメントから `scripts/docs-site.mjs` が書き出します。生成されたファイルは直接編集せず、元を変えてスクリプトを実行してください。

## 正しさを保つしくみ

| 検査 | 何を確かめるか |
| --- | --- |
| `pnpm check` | lint、型、単体テスト（全レイアウトのスナップショット、全描画のジオメトリ、全背景のコントラスト、悪意のある入力）、ビルド、パックしたパッケージ |
| `pnpm test:readme` | 生成されたドキュメント。続いて README、ドキュメント、これらのガイドのすべての例を、ビルドしたパッケージに対して実行し、コメントに書かれた出力と比べる |
| `pnpm test:demo` | デモを実ブラウザーで、スマートフォンの幅とデスクトップの幅で確認 |
| `pnpm docs:check` | ドキュメントサイトの検査：すべてのエクスポートにドキュメントコメントと実行できる例があり、すべてのガイドにフロントマターがあり、リンクの先が存在する |

`family-backgrounds.ts` など、ファミリーで共有するファイルは、パッケージ間でバイト単位で同じコピーです。ここでは編集せず、すべてのリポジトリで同時に変更してください。
