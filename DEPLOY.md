# Netlifyへのデプロイ手順

このプロジェクトをNetlifyにデプロイするための手順を説明します。

## 前提条件

- Netlify CLIがインストールされていること
- Netlifyアカウントを持っていること
- Supabaseプロジェクトが設定済みであること

## デプロイ手順

### 1. Netlify CLIでログイン

```bash
npx netlify login
```

### 2. 新しいNetlifyサイトを作成

```bash
npx netlify sites:create --name wado-team-scheduler
```

### 3. プロジェクトをNetlifyサイトにリンク

```bash
npx netlify link --name wado-team-scheduler
```

### 4. 環境変数の設定

Netlifyダッシュボードで以下の環境変数を設定します：

- `VITE_SUPABASE_URL`: Supabaseプロジェクトの URL
- `VITE_SUPABASE_ANON_KEY`: Supabaseプロジェクトの匿名キー
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth クライアントID
- `VAPID_PUBLIC_KEY`: Web Push通知用の公開キー
- `VAPID_PRIVATE_KEY`: Web Push通知用の秘密キー

または、Netlify CLIを使用して環境変数を設定することもできます：

```bash
npx netlify env:set VITE_SUPABASE_URL "https://your-project.supabase.co"
npx netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key"
npx netlify env:set VITE_GOOGLE_CLIENT_ID "your-google-client-id"
npx netlify env:set VAPID_PUBLIC_KEY "your-vapid-public-key"
npx netlify env:set VAPID_PRIVATE_KEY "your-vapid-private-key"
```

### 5. デプロイ

```bash
npx netlify deploy --build
```

プレビューデプロイが成功したら、本番環境にデプロイします：

```bash
npx netlify deploy --build --prod
```

### 6. Google OAuth リダイレクト URI の設定

Google Cloud Consoleで、以下のリダイレクト URIを追加します：

```
https://your-netlify-site.netlify.app/auth/callback
```

## トラブルシューティング

### Row Level Security (RLS) ポリシーエラー

ユーザー登録時に RLS ポリシーエラーが発生する場合は、Supabaseダッシュボードで以下のポリシーが設定されていることを確認してください：

```sql
-- usersテーブルに対するポリシー
CREATE POLICY "認証済みユーザーはユーザーを作成できる" ON public.users
FOR INSERT WITH CHECK (true);

CREATE POLICY "ユーザーは自分のデータのみ読み取り可能" ON public.users
FOR SELECT USING (auth.uid() = id);
```

### ビルドエラー

ビルド時にエラーが発生した場合は、以下を確認してください：

1. `package.json` の `build:netlify` スクリプトが正しく設定されていること
2. `netlify.toml` ファイルが正しく設定されていること
3. 必要なパッケージがすべてインストールされていること

## 参考リンク

- [Netlify CLI ドキュメント](https://docs.netlify.com/cli/get-started/)
- [Supabase ドキュメント](https://supabase.com/docs)
- [Netlify Functions ドキュメント](https://docs.netlify.com/functions/overview/) 