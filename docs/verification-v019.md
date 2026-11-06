# v0.1.9 地面の配色変更と検証

2026-11-07。ユーザーの「地面が見えない、完全に違う色に」への対応。v0.1.8の青灰色を茶色・黄土色へ変更し、地面が48〜156mで空色へ溶ける処理も外した。

- 地面/外周面 `#9a502f`、市松 `#bf7742`、内外格子 `#4a2516`、道と横棒 `#f1c88b`。真下マークも濃茶と明るいベージュにし、地面一式に `fog:false` を指定。
- 操作、飛行の計算、地面距離・接近表示、地面の形と停止高さは変更しない。版番号、faviconと設定URL、package版を0.1.9に更新。
- `npm test`: 84件成功。`npx playwright test tests/ground-proximity.spec.js tests/visibility.spec.js`: 10件、40.0秒、終了コード0。
- 低空と接近、地面2m停止と手動再出発、低空からの回復、島外の床、3寸法の表示、目標と大型目印、見え方切替、全目標と出口を既存テストで確認。
- 390×844の低空、360×640の接近、東向きの画面画像を目視し、空の水色と地面の茶色/黄土色が分かれて描かれることを確認。画像名は既存テスト由来のv018/v016だが、画面の版表示はv0.1.9。
- `npm run build` 成功。最終JS `index-DflB3Fy5.js`、CSS `index-Ck8BSCuf.css`。CSSは変更なし、JSは新しい内容のファイル名でキャッシュ更新。

## 公開版

- アプリコミット `8ceb5bd58e39c66fb16242a34c084d35ff09232c`。[GitHub Pages公開処理](https://github.com/gerupon-lgtm/twist/actions/runs/42312999886) は全工程成功、CIの84件の単体テストとビルドも成功。
- [公開URL](https://gerupon-lgtm.github.io/twist/?mode=flight&view=assisted&steer=tilt&v=0.1.9) のHTTP200/HTML型、画面v0.1.9、JS/CSSがローカル最終ビルドと一致。実行エラー0、HTTP読込エラー0。
- 公開PCブラウザーの低空画像でも、空の水色と地面の茶色・黄土色、濃茶の格子を確認。
- 公開版の左右端上下と面内回転の比較、出力保持、登り減速/降り加速、センサー欠落時停止、タッチスロットル、探索、目標マーク、見え方比較、地面のclear→low→danger→stoppedと手動再出発が成功。
- スクリプト `node_modules/.cache/twist-public-check-v019.mjs`、結果 `test-results/public-v019-result.json`、画像 `test-results/public-v019-low.png` 等はGit管理外。次回Playwright実行で画像/結果フォルダーが初期化される。

スマホ実機での気づきやすさは未確認。機首や進行方向によって地面が視野外にある場合は、配色だけでは地面は映らない。今回の実機報告がその状態かは断定せず、地面距離と接近表示も確認対象に残す。
