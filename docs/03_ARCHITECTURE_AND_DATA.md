# 構成・保存形式・変更時の注意

## 全体構成

JavaのAndroidアプリが、ローカルのHTML/CSS/JavaScriptをWebViewで表示する。ReactやFlutterではない。
ローカル画面のURLはhttps://appassets.androidplatform.net/。HTMLと写真はWebViewClientがアプリ内ファイルから返す。
JSからwindow.ClosetNative.request(operation, JSON.stringify(payload), token)を呼び、window.nativeReplyで非同期に結果を受け取る。進捗等はwindow.nativeEvent。

| ファイル | 主な責務 |
| --- | --- |
| MainActivity.java | カメラ・選択、EXIF補正、AI処理、透明PNG、家族／所有者／関連リンク、JSブリッジ、設定・鍵暗号化、DB |
| assets/index.html / app.js / style.css | 3タブ、上下レール、ジェスチャー、フォーム、家族の顔、写真、関連品、閲覧用HTMLと共用のUI |
| ItemTypes.java | 種類・大分類・上下位置の正規化、旧記録の補完 |
| AlbumBackup.java | 全写真＋JSON＋closet.htmlのZIP、検証しながら追加復元 |
| PortableAlbum.java | 同じUIを単独HTMLにし、写真をdata URIとして埋め込む |
| DriveApi.java | Drive RESTのフォルダ確認、一覧、ダウンロード、アップロード |
| DriveSync.java | 写真と記録の統合、転送、DB反映 |
| SyncMerge.java | 不変リビジョン・祖先関係、同時編集、決定的な別版ID |
| SyncStore.java | 可変枚数のメディアパスとハッシュ、原子的なファイル保存 |
| AmbientStore.java / MemoryRenderer.java | 保存写真の選択と表示部品 |
| MemoryWidget.java | RemoteViewsによる最大3枚の切り替え |
| ClosetDreamService.java / MemorySlideView.java / DreamPreviewActivity.java | スクリーンセーバーとプレビュー |

## SQLiteと主要フィールド

DBはMainActivity.DB（SQLiteOpenHelper）、closet.db、version=2。garmentsとpeopleの両テーブルにid TEXT PRIMARY KEY、data TEXT NOT NULL、created INTEGER NOT NULLを持ち、dataにJSON全体を保存する。DB v1からの更新ではpeopleを追加し、garmentsを保持する。

| 品物のフィールド | 意味 |
| --- | --- |
| id | 品物のUUID |
| name / category / kind / wardrobeRole | 名前、種類、大分類、top/bottom/onepiece/none |
| ownerIds | 家族UUIDの配列。複数選択の基準 |
| children / child | 表示名配列と旧形式互換用の先頭名。名前の変更時には整合性を保つ |
| relatedIds | 関連品UUID配列。通常の保存では相手の配列も更新する |
| back | 任意の裏面情報。id、segmentation、revision、必要に応じsegmentError |
| memories | 関連写真の配列。id、caption、created |
| size / period / note / color | サイズ、使ったころ、思い出、色 |
| favorite / archived / created / updated | お気に入り、ごみ箱、作成・更新時刻 |
| segmentation / classification / revision | 切り抜き・分類の状態と表示用更新値 |
| _sync | revision、ancestors、assets、device。同期用の変更履歴 |

家族はentity="person"、id、name、aliases、created、archived、任意のavatarId、_syncを持つ。
旧名だけの記録に対しては、現在名とaliasesを照合する。初期の「長女」「次女」等のプロフィールは、名前から決定的UUIDを作り、端末間で揃える。名前変更後も同じ所有者IDを使い続ける。

## 画像ファイル

files/media/に保存。元のカメラファイル自体の完全保存ではなく、EXIFの方向を直し長辺1280px以下にした画像を扱う。

| 用途 | ファイル |
| --- | --- |
| 表の背景つき写真 | `<itemId>.jpg` |
| 表の余白除去済みPNG | `<itemId>.png` |
| 表の全画面透過PNG | `<itemId>_full.png` |
| 裏面 | 独立したback.idで上記と同じ3ファイル |
| 関連写真 | `<memoryId>.jpg` |
| 顔写真 | `<avatarId>.jpg`。トリミング等では新しい写真IDを発行 |

SyncStore.pathsが、表3枚、任意の裏3枚、関連写真、または家族の顔1枚を列挙する。メディア種類を追加する時はここだけでなくZIP、Drive、PortableAlbum、JSの参照方法を同時に見直す。
表と裏の補正は別の写真へ書き込み、片方の画素をもう片方へ上書きしない。同期で裏面の同時編集を別版化する時には、その別版の裏面IDも分ける。

## 保存のタイミング

写真取り込みは先に下書きまたは記録へ保存する。裏面・関連写真の追加／除外はその場で保存。名前・所有者・説明・関連リンク等はフォームの保存で確定する。途中のAI再実行や切り抜き補正で、JSの未保存入力を消さない処理がある。
関連リンクの追加／削除は、通常保存時にDBトランザクション内で相手側も更新する。

## 同期

- AndroidのAuthorizationClientで認可し、DriveApiへアクセストークンを渡す。スコープはhttps://www.googleapis.com/auth/drive。指定フォルダの同期ファイルを扱う。
- `omoide-record_<id>_<revision>.json`、家族は`omoide-person_...json`。写真は`omoide-photo_<sha256>.jpg/png`。
- リビジョンと祖先関係で新旧を判断し、端末の時計だけで新しい記録を選ばない。異なる同時編集は両方を保持し、別版IDを決定的に生成する。
- 写真の転送と検証後に端末の記録へ反映。ファイルとDBを跨ぐ完全な一括確定は保証しない。
- アプリ起動時、保存後、表示中の約5分ごとが自動同期。閉じている間の常時同期はない。
- APIキー、下書き、アクセストークンは同期しない。顔・裏面・関連写真・家族・複数所有者・関連リンクは含める。
- 別端末で同じ物を別々に撮った新しいUUID同士を、画像認識で自動重複統合する機能はない。

## ZIPとHTML

ZIP manifestはformat="omoide-closet"、version=2、items、families、children、exported。写真とcloset.htmlとREAD-ME.txtを含む。HTMLは読み取り専用で、ごみ箱を表示しない。ZIPの復元は既存IDをスキップして未登録品を追加するため、更新・マージ用途にはDrive同期を使う。
復元は旧version=1も対応。ZIP上限500MB、個々の写真は12MB以下、関連写真は1点50枚まで。主要パス・画像寸法・ハッシュを検証する。
HTMLのJSONはscript終端等をエスケープし、写真は埋め込む。文言をHTMLとして実行しないこと。

## 鍵・プライバシーと拡張時の制約

APIキーは端末内のAndroidKeyStore/AES-GCMで暗号化する。ManifestはallowBackup=false。写真アプリへ自動追加しない。
顔写真・着用写真・裏面はGemini分類へ送らない。バックアップHTMLとDrive同期にはこれらが含まれる。写真を外しても履歴やファイルが直ちに完全消去される設計ではない。
