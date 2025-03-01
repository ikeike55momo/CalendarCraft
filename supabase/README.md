# Supabase設定手順

このディレクトリには、Supabaseのデータベース設定に必要なSQLスクリプトが含まれています。

## 手順

1. [Supabaseのダッシュボード](https://app.supabase.io/)にログインします。
2. プロジェクトを選択または新規作成します。
3. 左側のメニューから「SQL Editor」を選択します。
4. 以下の順序でSQLスクリプトを実行します：
   - `migrations/create_tables.sql` - テーブルの作成
   - `migrations/seed_data.sql` - テストデータの投入（必要な場合のみ）

## 環境変数の設定

Supabaseの接続情報を設定するために、以下の手順を実行します：

1. Supabaseのダッシュボードから「Project Settings」→「API」を選択します。
2. 「Project URL」と「anon public」キーをコピーします。
3. プロジェクトのルートディレクトリにある `client/.env.local` ファイルを編集し、以下の変数を設定します：

```
VITE_SUPABASE_URL=あなたのプロジェクトURL
VITE_SUPABASE_ANON_KEY=あなたの匿名キー
```

## Google OAuth設定（オプション）

Google認証を使用する場合は、以下の手順を実行します：

1. [Google Cloud Console](https://console.cloud.google.com/)で新しいプロジェクトを作成します。
2. 「APIとサービス」→「認証情報」を選択します。
3. 「認証情報を作成」→「OAuthクライアントID」を選択します。
4. アプリケーションタイプとして「ウェブアプリケーション」を選択します。
5. 承認済みのリダイレクトURIとして、以下を追加します：
   - `https://あなたのプロジェクトURL.supabase.co/auth/v1/callback`
6. クライアントIDとクライアントシークレットを取得します。
7. Supabaseのダッシュボードから「Authentication」→「Providers」→「Google」を選択します。
8. Googleプロバイダーを有効にし、クライアントIDとクライアントシークレットを入力します。
9. `client/.env.local` ファイルに以下の変数を追加します：

```
VITE_GOOGLE_CLIENT_ID=あなたのGoogleクライアントID
```

## Row Level Security (RLS)ポリシー

テーブル作成スクリプトには、適切なRLSポリシーが含まれています。これにより、ユーザーは自分のデータのみにアクセスでき、管理者は全データにアクセスできます。

## トラブルシューティング

- **テーブル作成エラー**: 既存のテーブルがある場合は、スクリプトの最初にある `DROP TABLE` ステートメントを使用して削除してください。
- **RLSエラー**: RLSポリシーが正しく設定されていることを確認してください。
- **認証エラー**: Supabaseの認証設定とGoogle OAuthの設定が正しいことを確認してください。 