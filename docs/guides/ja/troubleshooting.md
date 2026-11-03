---
title: 困ったとき
section: troubleshooting
order: 30
description: トーナメント表が空のとき、名前が出ないとき、ページに何も出ないときに確かめること。
---

## 何も表示されない

- `drawBracket` の結果は文字列です。ページに入れてください (`element.innerHTML = svg`)。ログに出しても描かれません。
- 通常のページでは、スクリプトに `type="module"` が要ります。アドレスはビルド済みのファイルで終わる必要があります ([通常の HTML と CDN](html-and-cdn.md))。
- フレームワークでは、文字列を HTML として渡します ([React・Vue・Svelte・Angular](frameworks.md))。

## チームの名前ではなく id が出る

一覧にない id で書かれた側は、その名前のチームになります。チームを一度だけ名前つきで挙げ、側は id で書いてください (`{ matchups, teams }`)。

## 2つの対戦が同じ id になる

対戦の id はそれぞれ別でなければなりません。同じ id が2つあると、レイアウトが断ります。`id` を省けば、パッケージが番号を付けます。

## 旗やトロフィーが出ない

パッケージは旗もトロフィーも自分では描きません。`flags` に旗の SVG を返す関数 (Hata から作ったものなど) を、`emblems` にエンブレムを描く関数を渡してください。マークのないチームは頭文字で描かれます。

## 絵がページより広い

SVG は拡大縮小できます。CSS で `width: 100%; height: auto` を指定するか、別の `size` (`wide`、`square`、`card`、`phone`) を選びます。
