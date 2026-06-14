# Cornix Keymap Viewer

Vial で保存・管理しているキーマップを、スマホのブラウザで確認するための読み取り専用 Web アプリです。キーボード本体とは通信せず、WebHID も使いません。

## 使い方

`public/keymap.json` を自分の Cornix LP 用キーマップに置き換えると、レイヤーごとの配列が表示されます。起動後の画面へ `.vil` または `keymap.json` をドラッグ & ドロップして、一時的に表示へ反映することもできます。

```bash
npm install
npm run dev
```

静的ファイルだけで動くため、GitHub Pages、Cloudflare Pages、Vercel などにそのまま配置できます。

## keymap.json

アプリは次の正規化済み JSON を確実に読み込みます。画面へのドラッグ & ドロップでは、JSON ベースの `.vil` から keycode 配列らしき部分を探して、現在の Cornix LP レイアウトへ流し込む簡易変換も行います。

- `keyboard`: 表示名
- `layout.keys`: 物理キー配置
- `layers`: レイヤー名とキー ID ごとの raw keycode

Cornix LP の実際の物理配置に合わせたい場合は、`layout.keys` の `x`, `y`, `w`, `h` を調整してください。

## 表示仕様

- `Base / Lower / Raise / Adjust` などのレイヤータブで切り替え
- 左右分割キーボードを SVG で描画
- キーをタップすると表示ラベル、raw keycode、説明を表示
- `KC_TRNS` は `▽` として薄く表示
- `KC_NO` は空キーとして表示
- `MO(1)`, `TG(1)`, `LT(1, KC_SPC)`, `MT(MOD_LCTL, KC_ESC)` などを人間向けラベルに変換
- `?`, `!`, `"`, `:`, `_` などの Shift 付き記号を読みやすく表示
- `?layer=1` のように URL クエリで初期レイヤーを指定可能
- 最後に見たレイヤーを `localStorage` に保存
- `.vil` / JSON をドラッグ & ドロップしてブラウザ内で表示へ反映
- `Copy URL` で現在のキーマップを URL の `#keymap=` に埋め込んでコピー
- 左右のロータリーエンコーダ位置をノブとして表示

## URL 共有

`Copy URL` を押すと、現在表示しているキーマップを gzip + base64url で URL フラグメントへ埋め込みます。クリップボードに書き込めない環境では、画面上に生成URL欄を表示するので、そこかアドレスバーからコピーしてください。

`#keymap=` はサーバーへ送信されないため、静的ホスティングでもストレージなしで自分専用 URL として使えます。読み込み側は `#keymap=` と `?keymap=` の両方に対応していますが、発行する URL はプライバシー面から `#keymap=` を使います。

URL には長さ制限があります。大きすぎる `.vil` やレイヤー数が多いキーマップでは、ブラウザや共有先アプリによって開けない場合があります。

URL に入れるのは物理レイアウトではなく、レイヤー名と keycode 配列だけです。物理配置はアプリ側の Cornix LP レイアウトを使うため、URL を短く保てます。

## GitHub Pages

このリポジトリを GitHub に push したら、Repository Settings の Pages で Source を `GitHub Actions` に設定してください。

`main` ブランチへ push すると、`.github/workflows/deploy.yml` が `npm ci` と `npm run build` を実行し、`dist` を GitHub Pages に公開します。

## 将来拡張

`.vil` の形式差分に合わせた安定変換は `scripts/convert-vil.ts` などとして追加できます。Vial 形式の完全互換ではなく、自分の Cornix LP 用に必要な範囲から対応する想定です。
