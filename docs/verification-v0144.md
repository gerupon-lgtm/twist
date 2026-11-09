# v0.1.44 検証記録（公開・配信確認済み）

2026-11-10（日本時間）、公開先の確認まで完了。[TWIST VECTOR v0.1.44](https://twist.sikumilab.com/?v=0.1.44)。

- [x] 追加後の単体121ファイル829件が成功。5ファイル以下・同時1組・Node384MBで完了。`.cache/v0144-unit-results.json`。
- [x] 開発版の全71ファイル502件が成功。全15組を各5ファイル以下で完了し、全件の成功・重複なし・未実行/再試行なしを監査した。`.cache/v0144-browser-results.json`、`v0144-source-audit.json`。
- [x] 最終ビルド515ファイル（本編直下33、過去16版482）を長さとSHA-256で固定。147 modules、26,458,590 bytes。`.cache/v0144-release-dist-manifest.json`。
- [x] 全16曲×44.1/48kHz×SCC/FMの実AudioWorkletによる全曲計算が成功。前版v43とのSCC左右64本の音声SHAが一致。FMは同設定の混合信号RMSが全曲で1.41024倍以上、最大設定での最大出力0.521785・フルスケール到達0。音色の好みや実スピーカーでの音量感とは分ける。`.cache/v0144-audio-comparison.json`、`v0144-native-whole-*.json`。
- [x] 最終ビルドの本編25件、追加12件、PWA13件、曲欠落時2件、説明地図4条件、新保存版43の起動1件が成功。追加12件は3視点の実際の音速突破・炎、2コース×3視点の継続風、縦横3サイズの正式名称。最終の行間修正を含む同一515ファイルで完了し、確認後も長さ/SHAが一致。通常PWAは実SWを確認し、SWを無効にしたのは欠落曲の故障注入だけ。`.cache/v0144-built-checks.json`、`v0144-built-product-report.json`、`v0144-built-impact-report.json`、`v0144-built-pwa-report.json`、`v0144-built-fallback-report.json`、`v0144-built-briefing-preview.json`、`v0144-built-new-archive-entry.json`。
- [x] 仕様レビューの名称残り1件、風の描画範囲・透明度・検証の混同を修正し、再レビューで指摘解消を確認。
- [x] アプリのコミット`425776ccbd99e60372c32afd85c4f2cc1e526532`を公開。[Actions 42646760088](https://github.com/gerupon-lgtm/twist/actions/runs/42646760088)は再テスト・ビルド・公開を含む全12工程とrunが成功。`.cache/v0144-actions-final.json`、`v0144-actions-run.json`。
- [x] 公開515/515ファイルの種類・長さ・SHA-256、21画面項目が成功。実行/console/HTTP/要求エラー0。`.cache/v0144-public-verification.json`。
- [x] 公開URLで本編25件、今回の追加12件、欠落曲2件、説明地図4条件が成功。`.cache/v0144-public-product-report.json`、`v0144-public-impact-report.json`、`v0144-public-fallback-report.json`、`v0144-public-briefing-preview.json`。欠落曲の故障注入以外は実際のSWを許可し、開発用モジュールやローカルサーバーを介していない。
- [x] 過去16版の482ファイルが一致し、各版の起動・飛行・専用SW・再読込など4項目、計64項目が成功。新しい保存版43も公開時の33ファイルを変更せず配信。`.cache/archives-v0144-verification.json`、[保存版43](https://twist.sikumilab.com/versions/0.1.43/?v=0.1.43)。
- [x] 直下33ファイルの配信確認済み控えと署名情報を保存し、最終ビルドの515ファイルは全確認後も同じ長さ/SHAを保持。`.cache/v0144-published-root/receipt.json`、`v0144-final-audit.json`、`v0144-public-checks.json`。v44の版別URLは次版で控えを追加してから確認する。

風の回帰検証では、帯だけを描いて変更画素0の失敗を再現した。配置だけを修正すると暗い画素1,589の失敗を再現し、白い色と透明度を分離して修正。最終は変更3,783画素・暗転0・中央侵入0・透明化後の差分0。実際の両コース×追尾/操縦席でも中央の画素差0、周辺の差分あり。既存の細い直線が出るだけで合格できる試験とは分けた。`.cache/v0144-wind-near-red-report.json`、`v0144-wind-alpha-red-repeat-report.json`、`v0144-wind-green-repeat-report.json`、`v0144-wind-isolated-gpu.json`、`v0144-wind-gpu.json`。依存ファイルの初回再生成で画面が再読込された試行は合格に数えず、変更なしの再実行で2件成功。

全体試験で二段ロゴの高さ23.1pxと版番号の上端23pxが重なる不具合を発見し、行高を1へ変えて22pxにした。縦横3サイズと全体の該当組が成功。横画面の練習欄については、測定では速度欄の上端169.75px、直後の画像では139.75pxで正しく退避していた。既に真だった準備完了属性では新しい配置を待てないため、入力欄を開いた後に実際の描画更新を2回待ち、同じ全要素・同じ厳密な重なり判定で6回成功。位置や時刻は書き換えていない。再レビューでも待機方法が妥当と確認。コピーやPWAの試験に残っていた43の固定期待値もAPP_VERSION参照へ変更した。失敗組の途中分は成功数へ混ぜず同じ組を再実行し、最終502件を監査した。`.cache/v0144-brand-cockpit-fix-report.json`、`v0144-practice-layout-frames-report.json`、`v0144-copy-version-fix-report.json`、`v0144-pre-brand-fix/`、`v0144-pre-layout-frames/`、`v0144-pre-version-expectation/`。

Pixel 9aで確認してほしい点：

- [ ] 操縦席で音速突破の輪と霧が見え、操作・目標の視認を妨げない。
- [ ] 追尾3Dで衝撃波と長い噴射炎が見える。炎の色、長さが意図に合う。
- [ ] 高速空域で音速突破後も風が流れ続け、速度が上がると勢いが増す。シエラ1/10でも巡航時に控えめな風を感じる。
- [ ] 音速を上抜けした瞬間に爆発音と余韻が鳴る。警告・取得音や一時停止を優先する。
- [ ] FMでギターの歪み、ベースの硬さ・厚みとPSGドラムとの釣り合いが良い。
- [ ] SCCの音の印象が従来と同じ。
- [ ] TWIST VECTORのタイトルが縦横で収まり、縦スクロールが出ない。ホーム追加時の名前も更新される。

前版v43のきりもみ解消は今回利用者が確認済み。今回の音色や演出の実機確認とは分ける。
