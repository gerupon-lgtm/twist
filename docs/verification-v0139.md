# v0.1.39 検証記録（公開・配信確認済み）

基準は公開済みv38のca6de12。アプリe53fce4の[Actions](https://github.com/gerupon-lgtm/twist/actions/runs/42533301468)全12ステップ、公開350ファイル/21項目、公開初回SCC/FM、手首6/試聴1、見本4、保存版11個の各4項目が成功。初回SCCでの遅延という利用者の観測を受領済み。修正版のPixel 9a確認は未完了。

- [x] 選択外のflight.midを止める単体試験で、選択したIgnition Skyの開始が待たされることを確認した。
- [x] 同じ条件の実ブラウザーで、飛行開始後3.5秒でもBGMが始まらない旧版を確認した。`.cache/music-start-native-before-fix.json`。
- [x] 曲別の読み込み共有・必要曲だけの準備・キャッシュ再利用・遅いABの合流/停止後の破棄を単体で確認した。
- [x] 候補版で開始音・取消・消音・試聴・センサーの関連5ファイル27件が成功。診断情報の1秒更新に対する待ち時間だけを2.5秒へ変更し、実際の音声投入時刻の上限2.1秒は変更していない。
- [x] v39の単体111ファイル791件が成功。最大5ファイル・同時1件・ヒープ384MBの23バッチで、失敗/取消/skip/todo0。途中の旧代役APIによる8失敗と、旧形式の代替順序による1失敗は別保存し、API代役と本体の分岐をそれぞれ直して全件を再実行した。
- [x] v39配信版の実音声処理・実時計で初回SCC/FMを確認。意図的に止めたAB MIDIを待たず、音声処理への最初の投入はGO開始からSCC1.528秒/FM1.520秒だった。これはスピーカーから聞こえた瞬間の測定ではない。読み込んだMIDIは選択曲・clear・afterburnerの3ファイルだけで、flight.midは取得していない。`.cache/v0139-built-latency-report.json`と各`v0139-built-music-start-native-*.json`。
- [x] build143 modules、root33ファイル/1,714,947 bytes＋保存版317＝350ファイル。PWA3ファイル13件成功。MIDI/config・音色・音声処理の28ファイルはv38とバイト単位で同一で、worklet/CSSのbuild名も不変。`.cache/v0139-release-dist-manifest.json`、`v0139-protected-audio.json`、`v0139-built-pwa-report.json`。曲の内容の全64組を新規に再描画したという意味ではない。
- [x] Actions全12ステップ成功。公開350ファイルの種類/長さ/SHAと21項目が成功。`.cache/v0139-actions-final.json`、`v0139-public-verification.json`。
- [x] 公開先の初回も、止めた別曲を待たず、GOからSCC1.520秒/FM1.53067秒でBGMを音声処理へ投入した。ネイティブの音声処理と通常のサービスワーカーは維持し、テストのfetch結果だけを一部遅らせた。`.cache/v0139-public-latency-summary.json`と各`v0139-public-music-start-native-*.json`。
- [x] 公開先の手首6条件/試聴1条件、独立した動く見本の3サイズ/動きを減らす設定の4条件も成功。`.cache/v0139-public-native-settings.json`、`v0139-public-briefing-preview.json`。
- [x] 旧保存版25/26/29/31/32/33/34/35/36/37/38の11個・317ファイルと各4項目が成功。公開済みv39の33原本も公開応答と照合してcacheへ保持した。`.cache/archives-v0139-verification.json`、`v0139-published-root/receipt.json`。

前版の全曲PCM検査は、通信で別の曲を待たされる問題を検査していなかった。音声内容の検証と初回読み込みの検証を別に扱う。新しい実ブラウザー試験ではfetchの結果を一部だけ意図的に遅らせ、選択曲・実AudioContext/AudioWorklet・サービスワーカーは通常の処理を使う。これは物理端末の聴感・回線品質の検証ではない。

## Pixel 9aで確認すること

- [ ] ページを更新して最初にSCCで飛び、GO音が終わった直後にBGMが始まる。
- [ ] 初回FM、別の曲、再挑戦、BGM曲順を変えた次の飛行でも同じ順序で始まる。
- [ ] 回線が遅い場合も、他の曲やAB音の待ちで選択BGMが遅れない。選択曲そのものの読み込み待ちは区別する。
- [ ] GO中や曲の読み込み中に停止・消音・画面離脱しても、後から勝手に再開しない。
- [ ] ABが遅れて準備できた場合の音、クリア曲・試聴・曲順・既存の音色が保たれる。
