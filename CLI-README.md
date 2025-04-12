# Wado Team Scheduler CLI

このCLIツールは、Wado Team Schedulerアプリケーションの管理タスクを実行するためのコマンドラインインターフェースを提供します。

## インストール

このリポジトリをクローンした後、以下のコマンドを実行してください：

```bash
npm install
```

## 使用方法

### CLIの起動

```bash
npm run cli
```

または

```bash
node cli.js
```

### 利用可能なコマンド

#### 環境変数の更新

Netlifyにデプロイされたアプリケーションの環境変数を更新します。

```bash
npm run updateEnv
```

または

```bash
node cli.js updateEnv
```

オプション：
- `--site <サイト名>`: Netlifyサイト名を指定

#### 環境変数の自動更新

対話なしで環境変数を自動的に更新します。サイトID「aba3dd29-7800-46e3-86e4-feb973775cd0」を使用します。

```bash
npm run updateEnvAuto
```

または

```bash
node update-netlify-env-auto.js
```

#### 環境変数の直接更新

より確実に環境変数を更新するための直接更新スクリプトです。サイトID「aba3dd29-7800-46e3-86e4-feb973775cd0」を使用します。

```bash
npm run updateEnvDirect
```

または

```bash
node update-env-direct.js
```

#### Google Sheetsからのデータインポート（実装予定）

```bash
node cli.js importSheet
```

オプション：
- `--manual`: 手動インポート実行

#### Googleカレンダーへのエクスポート（実装予定）

```bash
node cli.js exportCalendar
```

オプション：
- `--range <日数>`: エクスポートする日数を指定 (デフォルト: 20)

#### プロジェクト一覧の表示（実装予定）

```bash
node cli.js listProjects
```

#### タスク一覧の表示（実装予定）

```bash
node cli.js listTasks
```

オプション：
- `--status <ステータス>`: タスクのステータス(open/done)を指定して絞り込み

### ヘルプの表示

```bash
node cli.js help
```

## 環境変数の更新について

`updateEnv`コマンドを実行すると、以下の環境変数をNetlifyに設定することができます：

1. **Supabase接続情報**
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

2. **Google OAuth設定**
   - VITE_GOOGLE_CLIENT_ID

3. **Google Sheets API認証情報**
   - GOOGLE_CREDENTIALS_JSON

4. **Web Push通知用のVAPIDキー**
   - VAPID_PUBLIC_KEY
   - VAPID_PRIVATE_KEY

コマンドを実行すると、対話形式で各環境変数の値を入力または確認することができます。既存の値が.envファイルから自動的に読み込まれ、それを使用するかどうかを選択できます。

### 注意事項

1. このコマンドを実行するには、Netlify CLIがインストールされている必要があります。インストールされていない場合は、自動的にインストールされます。

2. Netlifyにログインしている必要があります。ログインしていない場合は、ログインプロンプトが表示されます。

3. Google OAuth リダイレクト URIの設定を忘れないでください。環境変数の設定後、Google Cloud Consoleで以下のリダイレクト URIを追加する必要があります：
   ```
   https://<サイト名>.netlify.app/auth/callback
   ```

4. 環境変数の設定後、アプリケーションを再デプロイするかどうかを選択できます。
