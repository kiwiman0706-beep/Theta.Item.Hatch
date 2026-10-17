# ビルド・テスト・署名

## 既存ビルドの構成

JDK 17、Gradle 8.10.2（wrapper同梱）、Android Gradle Plugin 8.7.3、SDK Platform 35。compileSdk/targetSdk=35、minSdk=26。Kotlin BOM 1.9.24、AndroidX Core 1.13.1、ExifInterface 1.3.7、play-services-auth 22.0.0、Subject Segmentation 16.0.0-beta1を使う。
これらは保存済みコードの指定値であり、今回最新SDK等へ更新していない。依存の取得・APIの利用可否は継続開発先の環境で確認する。

Android Studioでsource/omoide-closet/を開く。local.propertiesは自分のSDKの場所に合わせて生成する。以前の一時パスを流用しない。

```sh
cd source/omoide-closet
chmod +x gradlew
./gradlew --no-daemon --max-workers=2 clean assembleRelease assembleDebug assembleAndroidTest lintRelease
```

Windowsではgradlew.batを使う。JDK 17のJAVA_HOMEとSDKの場所、依存ダウンロード可能なネット環境が必要。
署名鍵がないこの一式からは、releaseは署名なしAPKになる。debug APKはデバッグ用としてインストールできるが、配布済みリリースAPKへの更新署名にはならない。

## 署名と上書き更新

| 項目 | 値 |
| --- | --- |
| package | jp.omoide.closet |
| 同梱APK | versionName 1.3.0、versionCode 4 |
| 配布証明書 SHA-256（過去検証記録） | 29bf75206503a4da8a01f2de381cd7dc31187c9520d20967b232c8004a4aaa0c |
| Google登録に記載した SHA-1 | E6:C0:02:3F:71:1E:23:5D:18:97:A5:ED:8E:74:BD:D9:C1:5F:6E:35 |
| ソースの署名鍵パス | signing/omoide-closet.jks |
| 環境変数 | OMOIDE_STORE_PASSWORD、任意のOMOIDE_KEY_ALIASとOMOIDE_KEY_PASSWORD |

**証明書の指紋とAPKだけから署名秘密鍵は復元できない。このZIPに鍵とパスワードはない。**
同じpackageで既存APKへ上書きするには元の署名鍵が必要。次の公開版ではversionCodeを4より大きくする。元の鍵が回収できない場合は、記録のバックアップを確保した上で、新しい署名・別package等の移行方針をユーザーと決める。新しい鍵を作って同じ署名の更新と称しない。別署名ならGoogle OAuthクライアントの指紋も見直す。

署名検査例：

```sh
apksigner verify --verbose --print-certs app/build/outputs/apk/release/app-release.apk
```

## Android上のテスト

以下は**テスト用アプリデータだけ**を使う。データを消したり書き換えるテストなので個人データのある普段のスマホでそのまま実行しない。
debugとandroidTestを同じ検証用端末へ入れ、プロジェクト内のSmokeInstrumentationを使う。機能群は同一パッケージなので、同時には起動せず順番に実行する。

```sh
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb shell am instrument -w -e sync true jp.omoide.closet.test/jp.omoide.closet.SmokeInstrumentation
adb shell pm clear jp.omoide.closet
adb shell am instrument -w -e family true jp.omoide.closet.test/jp.omoide.closet.SmokeInstrumentation
```

familyテストの出力HTMLは、pm clearする前に取り出す。

```sh
adb exec-out run-as jp.omoide.closet cat cache/family-portable-check.html > family-portable-native.html
adb shell pm clear jp.omoide.closet
adb shell am instrument -w -e data true jp.omoide.closet.test/jp.omoide.closet.SmokeInstrumentation
adb shell am instrument -w -e ambient true jp.omoide.closet.test/jp.omoide.closet.SmokeInstrumentation
```

syncテストのcache/portable-check.htmlも、必要ならクリア前に取り出す。過去の一時HTMLそのものは今回の一式に回収していない。再生成できるコードとテストを同梱した。

過去のソフトウェアエミュレーターでは、システムやLauncherが起動時に応答停止した。検証用環境の起動待ち設定を変えてテストが通ったが、その設定は配布APKには入っていない。実機の起動性能やAndroid WebView上の全操作が検証済みという意味ではない。

## ブラウザUIのテスト

Node.js、PlaywrightとChromium、Pythonを用意。テストはsource/omoide-closet/を作業フォルダにして実行する。ブラウザ実行ファイルを指定する場合はCLOSET_CHROMIUMを設定し、日本語が読めるフォントも用意する。依存インストール例は継続開発先で実行するためのもので、今回実行していない。

```sh
npm install --no-save playwright
npx playwright install chromium
python3 -m http.server 8765 --bind 127.0.0.1 --directory app/src/main/assets
```

別ターミナルで：

```sh
node tests/ui-smoke.cjs
node tests/family-ui.cjs
CLOSET_SAMPLE_HTML=/absolute/path/to/releases/omoide-closet-sample-album.html node tests/portable-family.cjs
```

sync-ui.cjsはCLOSET_NATIVE_HTMLにsyncテストから取得したHTMLを指定する。CLOSET_SAMPLE_HTMLを指定すると展示用HTMLを生成・上書きするので、再生成先を意図して指定する。nativeの追加写真HTMLをportable-family.cjsで見る場合はCLOSET_FAMILY_HTMLも指定する。テストはスクリーンショットも生成するが、それらは一時検証用で、同梱成果物の一部ではない。

## 外部API設定

- Gemini：実際のAPIキーをアプリの設定から入力して送信を有効にする。ソースに埋め込まない。保存コードの既定モデルはgemini-3.5-flash-lite、エンドポイントはv1beta/interactions。実際のモデル・API利用可否は未確認なので、実接続時に公式資料と照合する。
- Drive：source/omoide-closet/google-drive-setup.htmlを参照。CloudプロジェクトとDrive API、同意画面・テストユーザー、Android OAuthクライアントと署名指紋の登録が必要という既存手順。現在のGoogle側設定の実在・登録完了は確認していない。

Google設定やSDKバージョンを変えた時は、設定手順書とAPK側の設定表示も揃えて更新する。
