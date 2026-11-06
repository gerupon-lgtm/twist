# v0.1.6 見失い対策の比較

2026-11-07。ユーザーは「方向・速度高度の両方が難しく、周囲を見失いやすい」と報告。視野を広げる、色形の違う大きな目印、画面外の目標マークの3点を入れた比較版と更新公開を依頼した。

## 比較する内容

- `?mode=flight&view=assisted&v=0.1.6` を今回の確認先にする。`view=classic` はv0.1.5の見せ方。指定なしはassisted。開始/一時停止画面の「見え方」で切替でき、同じ現在位置・向きのまま比較する。
- 操縦・飛行の計算・出力・目標位置/半径はv0.1.5を使う。見え方の切替で速度や位置を変えない。探索でも同じ表示比較を使える。
- 従来は縦画角64度、390×844では横約32度。対策版では横45度を下限に縦画角を調整する。縦画角は64〜100度に収め、極端に細い画面での歪みを抑える。通常の横持ちは従来の画角を使う。
- ステージの4方向に色・形が異なる大型の目印を追加する。例: 青い三角塔・赤い四角塔・紫のひし形・緑のアーチ。地理センサーの北ではなく、ステージ内で覚える目印。金色の取得物とは区別する。従来表示では追加目印を隠す。
- 次の目標が見える範囲から外れたら、端に矢印・目標名・上下/後ろ・距離を表示する。自機、上の案内、下の操作パネルを避けた空き領域の端を使う。再び見えれば消す。到着・一時停止・従来表示では消す。
- 真後ろ±5度では左右の揺れを抑えるため右へ回る案内に揃える。上の方角表示も左右を付けない「後ろ」にして、同じ目標に左右が混在しないようにする。従来表示の方角表記は維持する。

## 共有契約

- `src/visibility.js`: `computeFieldOfView(width,height,visibility='assisted') -> {vertical,horizontal}`。角度degree。従来はvertical64、対策版は横45を下限に計算してverticalを64..100へ制限。
- 同module: `projectEdgeTarget({target:{x,y,z},width,height,verticalFov,bounds:{left,top,right,bottom},avoid?:{left,top,right,bottom}}) -> {visible,x,y,rotation,behind,inView}`。targetはcameraの座標（正面z<0、右x>0、上y>0）、px単位boundsはマーク中心の許容範囲、avoidはマーク中心を入れない拡張済み領域。rotationは上向き矢印から時計回りdegree。背面で鏡写しにしない。無効値/目標0は有限の非表示結果。
- `createStage(canvas,{visibility='assisted'}={})`、`stage.setVisibility(profile)`を追加。resizeと切替でcamera投影と目印の表示だけ変更し、位置・姿勢・物理速度・出力を変えない。
- `getStatus()`に `{visibility,fieldOfView:{vertical,horizontal},targetLocal:{x,y,z},landmarks:[{id,label,color,shape,position:{x,y,z}}]}` を追加。追加目印が非表示ならlandmarksは空。
- UI: 見え方ボタン`view-assisted`/`view-classic`、説明`view-note`。画面端マーク`target-edge-marker`（100×50 CSSpx、pointer-events:none）、内側に`edge-arrow`、`edge-label`、`edge-detail`。mainはcanvas寸法と実際のHUD位置からboundsを作り、中心の自機を避ける。

## 確認すること

視野角とリサイズ、前後左右上下/裏側の目標投影、無効値、画面内復帰時の消去、目標切替と出口、空き領域への配置、スマホ3寸法、同じ状態での比較、物理と操縦の回帰、全目標/出口、公開URLの版と実動作を確認する。スマホ実機の見やすさ・方向/速度高度の難しさは検証範囲に残し、疑似入力で改善したと断定しない。
