# v0.1.46 タイトル機体の描き直し

以前提示された2枚の戦闘機写真を、形状の参考として使用。細い機首、広い後退翼、離れた双発エンジンと双垂直尾翼を生かし、タイトルへ重ねる透過イラストを新規生成した。写真の切り抜きではない。

- 生成方法：内蔵の `image_gen`。CLI/APIの代替経路は使用していない。
- 参考：1154.jpgと1153.jpg。旧menu-aircraft.webpは構図・色味だけの参考。
- 最終画像：`public/menu-aircraft.webp`、768×768px、透過WebP、95,904 bytes。
- 生成原本：`.cache/v0146-aircraft-generated.png`。表示サイズと形式だけをブラウザのCanvasで変換し、透過を保持した。
- タイトルの写真参考の機体表示と、表示版・更新用URLをv0.1.46へ更新。前版45は公開確認済みの33ファイルをそのまま保存。
- 配信用JavaScriptは、版番号の文字列を除いて前版と完全一致。音楽・CSS・音声処理のファイルも一致を照合。`.cache/v0146-asset-scope.json`。

## 生成に使ったプロンプト

```text
Use case: stylized-concept. Asset type: a single transparent-background hero aircraft illustration for the existing TWIST VECTOR mobile game title screen. Input image 1 and image 2 are reference photos for the airframe silhouette; image 3 is the existing title asset, a composition and palette reference only. Redraw the aircraft from scratch, using the graceful long pointed nose, narrow forward fuselage, broad blended swept wings, widely spaced twin engines with clearly separated round exhaust nozzles, and two rear vertical fins of the photographed fighter as the motif. Give it recognizably convincing proportions like references 1 and 2, rather than the short thick toy-like shape of image 3. View from above and behind at a three-quarter angle, aircraft flying diagonally toward the upper-right corner so both the upper surfaces and rear twin exhausts are visible. Entire nose, both wing tips, both tails, and both nozzles must fit fully in the canvas with modest transparent padding. Original elegant game illustration / clean carefully modeled 3D-render style, with accurate readable fighter structure and restrained panel lines, smooth sculpted forms, moderately detailed rather than photorealistic. Pale blue-gray body and subtle desaturated sky-blue camouflage inspired by reference 2, dark graphite nose tip, deep teal canopy, metallic charcoal exhausts. Color and lighting must harmonize with the existing pale sky-blue UI and teal brand colors. Calm soft daylight, crisp silhouette, refined and attractive, dynamic but not aggressive. Exactly one aircraft only. Genuinely transparent background with clean alpha edges, no scenery, no sky, no backdrop, no shadow plane, no trail, no smoke, no text, no labels, no numbers, no emblems, no national markings, no stars, no external missiles or bombs. Square composition suitable for a 768x768 display asset. Do not include the title screen UI, lettering or route graphics.
```
