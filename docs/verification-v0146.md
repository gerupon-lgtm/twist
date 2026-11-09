# v0.1.46 検証記録（公開・配信確認済み）

[変更範囲と生成指示](title-aircraft-v0146.md)。画像・縦横の配置・更新キャッシュ・公開ファイルを確認する。

- 生成画像を実際の背景色に重ね、透明部分の縁と機体の全体が見えることを目視確認。768px画像の透明画素396,169。`.cache/v0146-aircraft-on-sky.png`、`v0146-aircraft-asset.json`。
- JavaScriptは版番号を除いて前版と同一。音楽・CSS・音声処理も一致。`.cache/v0146-asset-scope.json`。
- ビルド148モジュール・581ファイル（本編33・過去18版548）、29,936,638 bytesを固定。`.cache/v0146-release-dist-manifest.json`。
- 実画面の12件（タイトル・6コース説明・設定・結果・3視点の操作・版表示）と、PWA13件、保存版45の起動を全件成功。

Pixel 9aで確認してほしい点：

- [ ] タイトルの機体が参考写真のイメージに近く、縦横とも機首や翼が切れていない。
- [ ] 透過部分の縁が目立たず、空色の画面になじむ。
- [ ] タイトルの版番号がv0.1.46で、新しい画像が表示される。

実機での見え方は未確認。ブラウザの確認と分ける。

公開用ビルドの12件・PWA13件・保存版45起動が成功し、最終581ファイルの長さ・SHAが固定時と一致。`.cache/v0146-built-checks.json`、`v0146-release-dist-manifest.json`。

公開アプリのコミット7a7669ac1202e8fb1664b20a8dee6d8c9e33eb9b。[Actions 42710250202](https://github.com/gerupon-lgtm/twist/actions/runs/42710250202)は再テスト・ビルド・公開を含む全12工程が成功。公開581ファイルの種類・長さ・SHAと21項目が成功し、実行・console・HTTP・要求エラー0。公開先の画面12件も全件成功。過去18版548ファイルと起動・飛行・専用SW・再読込の72項目が成功。直下33ファイルの配信確認済み控えを保存した。`.cache/v0146-public-checks.json`、`v0146-public-verification.json`、`archives-v0146-verification.json`、`v0146-published-root/receipt.json`、`v0146-final-audit.json`。

初回の照合では保存版31のadvance.midだけが503で失敗した。初回記録をv0146-public-first-attempt.jsonに残し、配信ファイルを変更せず再検証した。再検証では581個すべて初回取得で200、種類・長さ・SHAが一致した。502/503/504だけ最大3回とする再取得処理を検証補助へ設け、全試行を記録。条件を緩めたりファイルを除外したりしていない。

[公開URL](https://twist.sikumilab.com/?v=0.1.46)。実機の見え方は上記チェック項目で確認待ち。
