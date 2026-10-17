# Theta.xxx.Hatch 要件に合わせる次の構想（案）

作成：2026-10-17。対象：おもいでクローゼット 1.3.0（versionCode 4）を Theta.Item.Hatch リポジトリで継続開発するための構想。
**これは提案です。** 06_USER_REQUESTS_TRANSCRIPT.md の確定要望ではありません。

## 1. 「Theta.xxx.Hatch」の要件をどう読み取ったか

明文化された要件書は見つからなかったため、同じシリーズの先行作 **DeskHatch**（`kiwiman0706-beep/deskhatch`、識別子 `Theta.DeskHatch`）の実装・運用から共通規約を抽出した。

| # | DeskHatch での実態 | Theta.Item.Hatch での要件（案） | 1.3.0 の現状 |
| --- | --- | --- | --- |
| T1 | 識別子 `Theta.DeskHatch`、Publisher `Theta`／`Theta Corp` | 製品名・識別子を `Theta.ItemHatch` 系に揃える | アプリ名「おもいでクローゼット」、package `jp.omoide.closet` |
| T2 | 公開リポジトリ＋GitHub Releases で配布 | APK を GitHub Releases で配布 | **v1.3.0 で対応**（release-apk ワークフロー） |
| T3 | タグ or 手動実行で Actions がビルド→Release 作成 | CI でビルド・署名・公開まで自動化 | 現状は署名済みAPKの公開のみ。CIビルドなし |
| T4 | stable／beta（`-beta` タグ＝プレリリース）の2チャネル | 同じ2チャネル運用 | 未対応 |
| T5 | アプリ内自動更新（Releases を確認→取得→適用） | アプリ内で新版を確認・ダウンロード・インストール | 未対応 |
| T6 | パッケージマネージャー登録（winget）、ストア（MSIX） | Android 相当：Obtainium 対応、将来 Google Play／F-Droid を検討 | 未対応 |
| T7 | 日本語／英語 UI（自動判定・切替・言語パック） | 日英 UI | 日本語のみ |
| T8 | README（バッジ・インストール手順）、CHANGELOG、PUBLISHING.md | 同等の文書一式 | 引き継ぎ用 README と CHANGELOG のみ |
| T9 | プライバシーポリシー、GitHub Pages のLP・ライブデモ | 同等。デモは既存のサンプルアルバムHTMLを流用 | サンプルHTMLはあるが未公開 |
| T10 | 単体＋E2E テストを CI で実行 | Gradle ビルド/Lint ＋既存ブラウザUIテストを CI 化 | テストコードはあるが CI なし |
| T11 | MIT License | ライセンスを明示 | 未設定（要判断） |
| T12 | 署名なしでも配布できる工夫（mac アドホック署名等）と、署名鍵をSecretsで受ける準備 | Android は署名必須・鍵の継続性が致命的。鍵を Secrets に置き CI で署名 | **元の鍵が所在不明** |

## 2. 最初に決めること（ユーザー判断が必要）

1. **元の署名鍵（signing/omoide-closet.jks）を持っているか。**
   - ある → GitHub Secrets（base64 化した keystore とパスワード）に登録し、以後 CI で同じ署名のAPKを出す。既存端末はそのまま上書き更新できる。
   - ない → 既存アプリへの上書き更新は不可能。新しい鍵で「新しいアプリ」として出し、旧アプリの「すべての思い出をバックアップ」ZIP から復元して移行する。
2. **ブランド名と package。**
   - 鍵がある場合：package `jp.omoide.closet` は維持し、表示名だけ「ItemHatch（おもいでクローゼット）」等へ変える案を推奨（データ・Drive同期・OAuth登録を壊さない）。
   - 鍵がない場合：どうせ別アプリになるので、このタイミングで package を `jp.theta.itemhatch` 等へ変えるのが合理的。Google OAuth クライアント（SHA-1）も新規登録が必要。
3. **ライセンス**（DeskHatch に揃えて MIT か、個人・家族用として非公開ライセンスか）。家族写真を扱うアプリなので、公開リポジトリにはサンプル以外の実データを絶対に入れない運用を明記する。
4. **配布先の範囲**：GitHub Releases＋Obtainium で十分か、Google Play（開発者登録 25 USD・審査・プライバシーポリシー必須）まで目指すか。

## 3. 段階的な構想

### Phase 0 — 済（今回）
- 引き継ぎ一式をリポジトリに登録（無改変、`tools/verify_bundle.py` で PASS）。
- `release-apk` ワークフロー：同梱APKを apksigner で検証し、証明書 SHA-256 が配布版と一致する時だけ Release を作る。
- 1.3.0 APK、サンプルHTML、SHA256 を v1.3.0 Release として公開。

### Phase 1 — CI 基盤（T3, T4, T10, T12）
- `build.yml`：push／PR ごとに JDK 17 で `assembleDebug assembleAndroidTest lintRelease`、Playwright で `tests/ui-smoke.cjs`・`family-ui.cjs` を実行。
- `release.yml` を「ビルドして署名して公開」に拡張：Secrets `OMOIDE_KEYSTORE_B64` / `OMOIDE_STORE_PASSWORD` / `OMOIDE_KEY_ALIAS` / `OMOIDE_KEY_PASSWORD` から keystore を復元。証明書ピン留めチェックは継続（鍵を取り違えたAPKは絶対に出さない）。
- versionCode はタグから自動算出（例 `1.4.0` → 10400）。現行 4 より必ず大きい。
- `v1.4.0-beta.1` のような `-` 付きタグはプレリリースとして公開。
- タグ push がプロキシで拒否される環境なので、DeskHatch と同じく手動実行（version 入力）でもタグを作れるようにする（済）。

### Phase 2 — 配布と更新（T5, T6）
- **アプリ内更新チェック**：設定画面に「アップデートを確認」。GitHub API `releases/latest`（beta 選択時は prerelease 含む）を見て、versionCode が新しければ APK をダウンロードし `PackageInstaller` でインストール（`REQUEST_INSTALL_PACKAGES` 権限、SHA-256 検証付き）。起動時の自動確認は1日1回程度・オフ可。
- **Obtainium** 用にリポジトリURLと APK 命名規則（`omoide-closet-x.y.z.apk` または `ItemHatch-x.y.z.apk`）を固定し、README に追加手順を書く。
- Google Play は Phase 5 で別途判断（Play App Signing に移るとGitHub配布版と署名が分かれる点に注意）。

### Phase 3 — Theta ブランドと文書（T1, T8, T9, T11）
- README を DeskHatch 形式に：ロゴ、バッジ（Release／Downloads／License）、スクリーンショット、インストール手順（提供元不明アプリの許可、Obtainium）。
- `docs/PUBLISHING.md`（リリース手順・Secrets 登録）、`docs/privacy.html`（写真は端末内保存、Gemini には表写真のみ送信、Drive は利用者自身のフォルダ、の明記）。
- GitHub Pages：`docs/index.html` LP ＋ ライブデモに `omoide-closet-sample-album.html` を使う（既にオフラインで動く閲覧用HTMLがあるので、ほぼ追加実装なしで「触れるデモ」になる）。
- 引き継ぎ用 README は `docs/00_HANDOFF_README.md` 等へ移し、`FILES_SHA256.json` は「1.3.0 スナップショット」の検証用と位置付ける（以後ソースを変えると当然一致しなくなるため、v1.3.0 タグを基準点とする）。

### Phase 4 — 日英対応（T7）
- WebView 側（`assets/app.js`・`index.html`）の文言を `locales/ja.json`・`en.json` へ抽出、端末ロケールで自動判定＋設定で切替。Android 側は `values/strings.xml` と `values-en/`。
- 書き出しHTML・ウィジェット・Daydream の文言も同じ辞書から生成。Gemini への指示文と分類ラベルの対応表も日英で揃える。

### Phase 5 — 実機・実サービス確認（既存の未確認事項）
05_KNOWN_ISSUES_AND_NEXT_STEPS.md の「高」項目（実機撮影〜保存、ML Kit、実 Gemini、2台での実 Drive 同期）を、Phase 1 の CI ビルド版で消化する。Google Play を目指すならここで判断。

## 4. 回帰させないこと（Theta 化でも維持）
表だけの簡単登録、手入力救済、写真の画素を保持する切り抜き、2段の独立操作、顔の複数選択、相互リンク、写真の説明、旧データ（DB v2・バックアップ v1/v2・Drive 記録 v1/v2）の移行、HTML のオフライン閲覧、秘密情報（鍵・APIキー）をリポジトリに入れないこと。
