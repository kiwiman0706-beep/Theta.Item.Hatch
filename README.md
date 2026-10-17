# おもいでクローゼット — 開発引き継ぎ一式

依頼日：2026-10-17（日本時間）／対象：最後に配布した **1.3.0、versionCode 4**。
このZIPを別スレに添付すれば、コンセプト・ご要望・画面案・コード・配布APKを一緒に渡せます。
今回の作業は保存済み成果物の回収と整理です。アプリの機能変更や再ビルドは行っていません。

## 最初に読むファイル

1. [NEXT_CHAT_PROMPT.md](NEXT_CHAT_PROMPT.md)：次のAIにそのまま渡す説明文。
2. [コンセプトと要望一覧](docs/01_CONCEPT_AND_REQUIREMENTS.md)：ご要望と現在の対応の対応表。
3. [実装状況と履歴](docs/02_STATUS_AND_HISTORY.md)：何ができ、何が未確認か。
4. [設計と保存形式](docs/03_ARCHITECTURE_AND_DATA.md)、[ビルド・テスト・署名](docs/04_BUILD_TEST_AND_SIGNING.md)。
5. [課題と次の着手点](docs/05_KNOWN_ISSUES_AND_NEXT_STEPS.md)。

## 同梱内容

| 場所 | 内容 |
| --- | --- |
| `source/omoide-closet/` | 1.3.0のソースを展開済み。Android Studioではこのフォルダを開く |
| `releases/omoide-closet-1.3.0.apk` | 最後に配布した署名済みAPK。保存済みのバイト列をそのまま収録 |
| `releases/omoide-closet-sample-album.html` | ネット接続なしで開ける展示用サンプル。家族はイラスト |
| `references/8268.jpg` | ユーザー提供の手描き画面案の元画像 |
| `docs/06_USER_REQUESTS_TRANSCRIPT.md` | この会話のユーザー要望原文。添付画像は上記参照 |
| `docs/07_UI_AND_BEHAVIOR.md` | 画面構成と操作の意味 |
| `docs/08_DATA_AND_SIGNING_NOT_INCLUDED.md` | 個人データ・署名鍵など、回収できていないもの |
| `source/omoide-closet/google-drive-setup.html` | 既存のGoogle Cloud設定手順書 |
| `source/omoide-closet/VALIDATION.md` | 1.3.0作成時の検証記録を原文のまま収録 |
| `archives/omoide-closet-source-1.3.0.zip` | 回収した元のソースZIPもそのまま保存 |
| `BUNDLE_PROVENANCE.json` | 回収したファイルの識別情報・ハッシュ・今回の確認範囲 |
| `FILES_SHA256.json`、`SHA256SUMS.txt`、`tools/verify_bundle.py` | 同梱ファイルの整合性確認 |

## 継続開発上の重要事項

- **配布APKの署名秘密鍵は同梱できていません。** 保存済みソースには元々入っておらず、今回回収した成果物からも取得できません。同じ署名で上書き更新するには、その元の鍵が別途必要です。鍵の場所と更新方針を確認してから、新しいリリースAPKを配布してください。
- スマホに登録済みの写真・データベースやAPIキーは、この開発ZIPには含まれません。実データを引き継ぐ場合は、アプリ内のバックアップZIPを別途用意します。
- AIの実認識、実際のGoogle認可とDrive通信、実機カメラ・メーカー別の表示条件は未確認です。同期テストは通信の代役を使用しています。
- 家族・裏面・関連写真に対応した同期／復元には、関係する端末をすべて1.3.0以降へ更新する必要があります。
- 最新ソースとAPKはそのまま収録しています。旧版ごとの完全なソース履歴・ビルドキャッシュ・過去の一時テストログは収録していません。版ごとの要約は履歴文書を参照してください。

## ZIPを展開した後の確認

```sh
python3 tools/verify_bundle.py
```

追加ライブラリ不要のSHA-256検査です。APKの署名検証や実機動作検証の代わりにはなりません。
