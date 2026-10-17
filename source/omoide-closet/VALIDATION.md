# 検証記録 — 1.3.0

## APKと互換性

- clean assembleRelease assembleDebug assembleAndroidTest lintRelease 成功。minSdk 26 / targetSdk 35、versionCode 4、versionName 1.3.0。Android Lintは0エラー・27警告。
- 配布APKの署名検証成功。以前のAPKと同じ証明書SHA-256: `29bf75206503a4da8a01f2de381cd7dc31187c9520d20967b232c8004a4aaa0c`。
- 画面のHTML・JavaScript・CSS・サンプルSVGなど15ファイルが、配布APK内のアセットとバイト単位で一致。
- 服のJSON記録を維持し、DBバージョン2で家族テーブルを追加。v1のZIPを読める構成。家族・裏面・関連写真を含む新しいZIPとDrive同期は1.3.0以降が必要。
- ソースZIPに署名用秘密鍵やそのパスワードを含めない。ZIPを別のフォルダに展開して、署名用秘密鍵を置かずにassembleReleaseが成功し、署名なしAPKを生成することを確認。署名は外部の環境変数と手元の鍵がある場合だけ行う構成。

## 画面と単独HTML

- ui-smoke.cjs 成功。320 / 390 / 430 / 800pxで、上下の逆方向アニメーション・独立スワイプ／停止／送り、小物のクロスフェード、撮影ボタンの表示、分類、登録・編集・検索・お気に入り、テキストの安全な表示、ごみ箱復元、手動消去と取り消しを確認。
- family-ui.cjs 成功。登録前の顔の複数選択と所有者IDの受け渡し、AI処理・切り抜き・裏面追加時の入力保持、裏面のみの補正、ハンガーの縦スワイプ（上下段の水平位置を動かさない）、表／裏ボタン、表のみの品物、双方からのセット閲覧、関連写真と説明、説明文の検索、複数所有者でのフィルター、家族追加・呼び名編集・顔写真の位置と拡大・トリミングを確認。
- 上記画面操作はネイティブAPIの代役を使用する。実際の写真選択ダイアログやカメラアプリを検証した結果ではない。
- sync-ui.cjs 成功。Google接続・フォルダ作成後の通信中断と再試行・重複フォルダ作成の防止・共有URL・端末名・自動同期予約の取消・接続解除後のローカル記録保持を、通信代役で確認。
- portable-family.cjs 成功。新しいサンプルHTMLを、オフラインで320 / 390 / 800pxで開き、埋め込みの顔イラスト・複数所有者の絞り込み・裏面・関連写真・双方のセットへのリンク・表のみの品物・編集ボタン非表示を確認。HTTP/HTTPSリクエストは0。
- サンプルは展示用のSVGイラストで、実際のご家族の写真ではない。書き出しHTMLには、アプリで登録した表・裏・関連写真・顔写真を埋め込む。

## Android保存テスト

- Android 15仮想端末で21項目の同期・HTML生成テストが成功。隔離したSQLite・JPEG/PNGを使い、Drive通信だけをメモリ上の代役に置き換えた。既存IDの統合・同時編集の別版保存と収束・重複防止・ごみ箱と復元・お気に入り・通信断と転送途中中断からの再試行・新規端末への取得・写真を埋め込んだHTML・資格情報の除外・安全なテキスト格納を確認。
- Android 15仮想端末で29項目の追加機能テストが成功。旧DBからの移行、呼び名から家族への引き継ぎ、複数所有者と重複排除、表のみでの保存、セットの双方向追加／解除、裏面専用の写真IDと切り抜き補正（表のハッシュを維持）、関連写真と説明、顔写真のトリミングと独立ID、家族名変更後の所有者維持と旧呼び名からの復元、家族と全写真を含むv2 ZIPの復元と重複防止、v1 ZIPの復元、新しい端末への全写真と家族の同期を確認。
- 裏面の切り抜きを2台で同時に変えた場合、決定的な別版IDを作り、表・裏の写真を分けて保持する。双方の裏面が異なるハッシュのまま保たれ、それぞれの記録と写真が一致することを実際のファイルで確認。
- Androidが生成した追加機能付きHTMLを、オフラインのブラウザで320 / 390 / 800pxで開き、顔写真、複数所有者、裏面、関連写真、双方のセットリンク、表のみでの表示を確認。HTTP/HTTPSリクエストは0。
- Android 15仮想端末で19項目のウィジェット・スクリーンセーバーテストが成功。旧形式の分類補完、表示対象とお気に入り・ごみ箱、RemoteViewsの実際の展開と描画・切替間隔・自動切替、スクリーンセーバーの写真読み込み・描画・停止、マニフェストを確認。
- Android 15仮想端末で11項目の従来の写真データテストが成功。写真の取り込み・下書き・透過PNGと余白除去・SQLite再読み込み・AndroidKeyStore暗号化・HTML付きZIPのバックアップ復元・重複のスキップ・不正ZIPの拒否を確認。

ソフトウェアエミュレーターの初回起動ではシステムの起動時間制限で検証プロセスが停止した。検証用環境で`enable_wait_for_finish_attach_application=false`とし、不要な背景サービスを停止した後に上記テストが成功した。アプリのリリースコードや配布APKへ、この検証環境の設定は追加していない。実機の性能・起動時間は今回の検証結果に含めない。

## 未検証・制約

- 実際のGoogle Cloud登録・Googleアカウント認可・Drive REST通信は未実施。同期は通信代役によるテストであり、Googleとの接続成功を示すものではない。初回設定はgoogle-drive-setup.htmlを参照。
- この個人用版は既存・共有フォルダURLに対応するためDrive全体へのOAuth権限を要求する。読み書きは指定フォルダの同期ファイルに限定する。
- 実機カメラ／写真選択、Google Play開発者サービスの背景除去、実際のGemini分類、メーカーごとのウィジェットとスクリーンセーバーの起動条件は未検証。
- 顔写真は利用者が選択・位置調整する。顔認識で所有者を自動推定しない。顔写真・着用写真・裏面はGemini分類へ送らない。
- 同期するすべての端末を1.3.0以降に更新する。自動同期は起動時・保存時・表示中の約5分ごとで、閉じている間の常時同期はない。
- HTMLは書き出した時点の閲覧用。写真・顔写真を含むので、渡す相手を確認する。編集・撮影・同期はAndroidアプリで行う。
- 写真ファイルとSQLiteの更新全体について、電源断などの途中終了時の完全な一括確定は保証しない。写真の取り外し後も履歴用ファイルがすぐに消えるわけではない。

検証コマンド：

```sh
./gradlew clean assembleRelease assembleDebug assembleAndroidTest lintRelease
node tests/ui-smoke.cjs
node tests/family-ui.cjs
CLOSET_NATIVE_HTML=/path/to/portable-native.html node tests/sync-ui.cjs
CLOSET_SAMPLE_HTML=/path/to/sample.html CLOSET_FAMILY_HTML=/path/to/family-native.html node tests/portable-family.cjs
adb shell am instrument -w -e family true jp.omoide.closet.test/jp.omoide.closet.SmokeInstrumentation
adb shell am instrument -w -e sync true jp.omoide.closet.test/jp.omoide.closet.SmokeInstrumentation
adb shell am instrument -w -e data true jp.omoide.closet.test/jp.omoide.closet.SmokeInstrumentation
adb shell am instrument -w -e ambient true jp.omoide.closet.test/jp.omoide.closet.SmokeInstrumentation
apksigner verify --verbose --print-certs app/build/outputs/apk/release/app-release.apk
```
