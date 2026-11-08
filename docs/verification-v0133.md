# v0.1.33 音楽：検証計画と結果

2026-11-08。**ローカル確認・公開・配信確認を完了。Pixel 9aは未確認。** v32の公開成功をこの版の公開成功として流用しない。[実装方針](implementation-v0133.md)。

## 確認済みの範囲

| 層 | 確認済み結果 | 証拠と境界 |
|---|---|---|
| 最終Node | 99 files / 691 pass。fail・cancelled・skipped・todo各0 | `.cache/v0133-units-final-results.json`。新しい準備中player取消の28条件を含む |
| sourceブラウザーの最終統合集計 | 全56 files / 390シナリオ。fail・flaky・skip・未実行・重複各0 | `.cache/v0133-final-source-audit.json`。**最終playerで25 files/122件を再確認＋歴史31 files/268件を変更境界レビュー付きで保持** |
| 最終build | 成功 | `.cache/v0133-final-build.log`。JS `index-B7R6GnY1.js`、CSS `index-98blNqvY.css`、Worklet `audio-worklet-ZwcZ0RjY.js` |
| 最終配信予定バイト | root配信31ファイルのmanifestを保存 | `.cache/v0133-release-dist-manifest.json`。作成時刻2026-11-08 11:48:10 UTC。公開先との一致はまだ未確認 |
| built PWA | 7/7 pass、skip・unexpected・flaky各0 | `.cache/v0133-built-pwa-report.json`。既存5＋通常導線2、rootと`/twist/`の相対配置・実SW・開始/操作/HUDを確認。公開サイトの成功とは別 |

sourceの390件をすべて最終バイトで再実行した、という意味ではない。最終playerの非同期取消修正に関係する音楽・設定・権限・AB・案内音・開始/再開・未完了ケースは122件で再確認した。物理・入力・コース・描画・案内/HUD等の過去268件は、変更範囲を読取確認した履歴証拠として保持する。各試験の実行時刻やhashを新しくしたとは扱わない。

最終auditは元の56 files/390件のシナリオ集合と一致すること、単回passed、重複なし、未実行/skipなし、最後のrun完了を要求する。product476ファイル、v32の保護証拠1338ファイルのhash guardも通過。途中で失敗した全体runや、別途の単件成功を総数へ足していない。

最後は成功済み385件にvisibility全5件を加えた。直前runで成功していたvisibilityの部分2件を重ねて足していない。詳細は`.cache/v0133-admit-visibility-tail.mjs`、`.cache/v0133-audit-final.mjs`と固有raw reportsに残す。

## 曲・個別試聴・音源の確認内容

- 通常採用は`rock/steel/horizon/storm/ignition/advance/overdrive`の7曲。旧3曲、クリア4曲、AB Pulse、比較曲を含む16曲を個別に試聴できる。集合を試聴playlistとして自動送りしない。
- 古い保存値・URL・不正値を用途別に解決し、ロードだけで本編保存値を書き換えない。個別試聴の選択は別keyへ保存。本編の曲順・時計・位置・振動・再生履歴を進めない。
- 試聴中の曲/音源切替、停止、設定を閉じる、飛行再開、hidden/pagehide、ロード途中取消、rapid stop/playを確認。clear4/AB/比較は実時間で自然終端し、idle contextがsuspendedになり、選択だけでは再発音しない。閉じる時はdisposeする。
- SCC/FMの選択・旧custom config互換・役割metadata・channel境界・音量適用・停止/予約取消・ループを確認。FMは指定された上の旋律/和音だけで、低音SCCと打楽器PSGを保つ。
- 既存13 MID原本保持と新3曲の音符/テンポ/終端、SCCの旧レジスター/PCM互換、FMの同時発音/余韻/有限値/停止等は各専用Nodeに含む。新3曲を作るために旧13曲を一括生成していない。
- クリア4曲のUI選択/保存・playerのclear用途・各曲の発音と終端の証拠を区別する。個別試聴の成功だけで「4曲すべてを実ゴールで総当りした」とは書かない。最終実main測定のゴール時条件はrootが結果欄へ追記する。

### native全曲64組の意味

実OfflineAudioContext/AudioWorkletで**16曲×SCC/FM×44.1kHz/48kHz＝64組**、ブラウザーケース4件が成功。音符を予約し、processorが受信したことを確認してから全長を処理し、全FM note-on数、同時発音不足/overflow、有限PCM、ピーク/clip、終端の余韻を確認した。

主証拠は`.cache/v0133-source-rest-native-whole-0-report.json`および同log、曲別出力。最終player修正はこのfixtureのimport先へ入っておらず、Synth/score/music-synth/preset/Worklet/mixer等の依存バイトが不変であることを最終auditで確認して、その音源層の履歴証拠を保持した。**最終playerを経由した64組のend-to-end再走、実時間の負荷、耳での評価、物理端末受入とは別。**

## 開始音と準備待機

数字3の前に、音源準備上限1500msと準備後最低500msの無音待機を設ける。既存の全画面待機とはmaxで重ね、待機を二重に足さない。数字3・2・1は各1秒、GOは実際のonRunning境界で一度だけ。準備/数字の時間は活動時間へ入れず、通常のpauseからの再開にcountdownや追加GOを入れない。

700ms音源準備のnative再現は旧版で3が抜け`[2,1,go]`になった。改修後は`[3,2,1,go]`を確認し、native10条件は最終player再検証範囲に含まれる。500ms待機・700ms準備・cancel/hidden/settings/dispose・late prepare・重複pose/onRunning・結果保持等のcontroller小試験37件も最終Node691に含む。nativeの物理スピーカーやPixel実機での聞こえは未確認。

## first-failと修正の経緯

失敗ログ・画像・context・raw JSONは固有名で保持し、後の成功で上書きしたり、失敗した全体runを成功へ変更したりしていない。

| 初回の事象 | 区分と対応 | 最新の確認 |
|---|---|---|
| metadata読込中に利用者が選んだ本編曲を、古いURL要求が後から上書きし得る | 製品P2。明示編集を記録し、古い読込結果の適用を止めた | late-catalogのfirst-red保持。関連unitと最終音楽/設定UI範囲で再確認 |
| preload/ready/resume待ち中、current未設定のためBGM/SFX/曲変更で旧再生要求を取り消せない | 製品P2。pending requestの同一性をawait前に保持、stopで無効化、古いfinallyが新要求を消さないよう修正 | new28条件はfirst-red16/12→関連green、最終Node691とplayer25/122で再確認。元`.cache/v0133-pending-player-first-red.log`保持 |
| 700msの音源準備で数字3の音だけ欠ける | 製品/開始境界。準備期限1500ms＋準備後最低500ms、準備中の表示を追加 | `.cache/v0133-countdown-wait-first-red-native.log`とunit first-red保持。native10と関連37 unitを再確認 |
| Offlineの速い処理がMessagePort受信を追い越す | 検証fixture側。予約列のprocessor受信をACKしてから全長render開始。音符数/clip/終端期待は維持 | 初回native SCC44.1k失敗と3未実行を保持。後続native全曲4ケース/64組で成功 |
| AB試験が旧曲の160BPMを固定期待し、採用rockの156BPMを受信 | 旧fixture期待。採用rockを明示し、実track metadataのテンポと厳密照合。基底曲の位置継続/AB予約/解除/警告assertは維持 | `.cache/v0133-source-rest-remaining-6.log`保持。speedfeel-audioは最終player範囲で成功 |
| 開始前の停止時計が新しい準備時間を進めず、表示が`…`またはphaseがreadyのまま | 旧fake-clock fixture。まず表示3まで時計を進め、そこから元の数字3秒/3100msを確認。飛行clockや力は変更しない | source-first45/1、cancel-budget94/1＋27未実行を保持。start-flowとSonic2specを再確認し、全シナリオへ統合 |
| 真後ろの厳密`後ろ`期待に`左の後ろ` | fixture境界。目標3.08rad±.06が175°の境を跨ぐため、目標をMath.PIにし同じ±.06を保持。`後ろ`assertを緩めない | sonic-clock25pass/1fail＋2未実行保持。部分visibility2を採らず、最後visibility全5件成功 |
| sandbox内Edge起動が失敗 | 実行環境。アプリ成功/失敗として数えず、既存合意のsandbox外ブラウザー専有枠で実行 | `.cache/v0133-source-cancel-final-summary.json`のexit-1を保持。そこでpassを計上しない |
| 実時間の操作がcase全体の30秒を使い切る | 試験予算。hardの実接地2回は各15秒枠＋開始/再開を含め60秒、visibilityは4回の12秒旋回枠＋開始等を含め75秒へ。各操作待ち/機能期待は維持 | cancel-final-liveのtimeout/15未実行と単件確認を保持。最終caseの単回passを採用し、単件成功を別加算しない |

最新成功は`.cache/v0133-final-source-audit.json`を正とする。途中のold first/ rest / cancel-final / cancel-budget / sonic-clock各summaryのcomplete=false、失敗・未実行は履歴のまま残す。再実行回数を足し合わせて390件より多い成功数を作らない。

## 最終負荷・公開

実時間の音源比較32条件（16曲×SCC/FM、実48kHz）は全件成功。同じ曲の同じ音符密度の高い2秒を再構成し、実AudioContext/Workletへ予約して比較した。master/BGMとも100%、SFXなしの音源部品測定であり、全長64組や本編・実機とは分ける。ピーク最大0.4437（1未満）、平均音源負荷の条件間範囲6.41〜11.24%。全FM note-on受信数一致、overflow/invalid/終端active voice/実行エラー各0。

最終dist31ファイルのSHAを各測定の前後に照合し、実mainを専有Edge/software WebGL・390×844操縦席・rock BGMで8条件測った。FM条件も実Workletのnote-on受信を確認し、overflow/invalidと実行エラーは0。

| モード | 音源 | 出力 | 秒 | 主処理ms/描画 | 描画間隔p95 ms | 平均音源負荷 | 開始以来の最大音源負荷 |
|---|---|---|---:|---:|---:|---:|---:|
| 通常 | SCC | 通常出力 | 18.00 | 4.625 | 16.80 | 1.43% | 2.20% |
| 通常 | SCC | AB | 8.01 | 4.914 | 16.80 | 1.94% | 2.60% |
| 通常 | FM | 通常出力 | 18.01 | 4.513 | 16.80 | 4.67% | 5.60% |
| 通常 | FM | AB | 8.00 | 4.600 | 16.90 | 5.30% | 5.86% |
| 高速 | SCC | 通常出力 | 18.06 | 5.005 | 16.90 | 2.43% | 3.40% |
| 高速 | SCC | AB | 61.84 | 4.595 | 16.80 | 1.37% | 3.90% |
| 高速 | FM | 通常出力 | 18.07 | 4.903 | 16.90 | 2.74% | 3.40% |
| 高速 | FM | AB | 61.86 | 4.650 | 16.80 | 5.30% | 6.70% |

通常ABは取得した燃料の短い8秒窓で、持続45m/sの合格とは扱わない。高速ABはSCC/FMとも680m/s・M2で全6門を完走（約61.85秒）。音源最大はsnapshotの開始以来の累積最大で、平均の測定窓と区別する。PC/software WebGLの結果をPixelの性能・聴感・発熱の受入にはしない。証拠は`.cache/v0133-measurements-summary.json`、liveおよび4つのperformance JSON。

| 公開項目 | 状態 |
|---|---|
| commit / Actions | app commit `44f44ddf059438b9e27707dc676d411661ec0ae0`。[Actions 42478053998](https://github.com/gerupon-lgtm/twist/actions/runs/42478053998)の全12ステップが成功 |
| v33公開バイト・実画面 | 全157ファイルのサイズ・SHA・MIME、21項目が成功。実mainのFM note-on、個別試聴、開始4音、3寸法×3視点、M1/M2、実SW、旧URL転送を確認。runtime/console/HTTP/request failure各0。公開の設定/試聴・小画面追尾・横操縦席の画像も実見 |
| 保存版25/26/29/31/32 | 各21/21/28/28/28ファイルと各4条件が成功。公開バイトは保持し、先行版の未検証の実機受入を成功へ書き換えない |

[公開版を開く](https://twist.sikumilab.com/?v=0.1.33)。公開証拠は`.cache/v0133-public-verification.json`、`.cache/v0133-actions-final.json`、`.cache/archives-v0133-verification.json`。v33のroot31ファイルは公開検査済みバイトから保存し、次の版の配信へ同梱する。保存版33の専用URLは、その次版の公開までは提供しない。

## Pixel 9a（すべて未確認）

- [ ] 設定で曲ごとの試聴を選べ、旧3曲とクリア4曲もそれぞれ聴ける。
- [ ] SCC/FMを切り替え、旋律・和音の違いが分かる。低音と打楽器が保たれ、音割れ・高音の耳障りな雑音・音切れがない。
- [ ] 新3クリア曲の違いと終わりが分かり、主旋律が伴奏に埋もれない。好みの曲を明示選択できる。
- [ ] 試聴を止める／閉じる／飛行へ戻る／画面を離れる操作で残音や古い曲の再生がない。
- [ ] 飛行中の採用曲・AB・警告・取得・クリアが適切に共存する。
- [ ] 通常と高速空域で長く遊び、入力・表示・音・発熱・電池の状態を確認する。
- [ ] 「開始の準備」の短い待機後、3の表示から音が鳴り、2・1・発進音も合う。待機中の取消で後から音や飛行が始まらない。

数値による発音確認を、耳で聴いた曲の好みの合格として扱わない。実機の難しい確認もこの範囲から除外しない。SMF/ZIP書出しは利用者の明示取消により対象外。次のギター版、後続UIの候補はこのv33製品に含めない。
