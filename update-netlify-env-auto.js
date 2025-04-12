#!/usr/bin/env node

/**
 * Netlify環境変数自動更新スクリプト
 * 
 * このスクリプトは、Netlifyにデプロイされたアプリケーションの環境変数を自動的に更新します。
 * 使用方法: node update-netlify-env-auto.js
 */

import { execSync } from 'child_process';
import fs from 'fs';

// Netlify CLIがインストールされているか確認
const checkNetlifyCLI = () => {
  try {
    execSync('npx netlify --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
};

// Netlifyにログインしているか確認
const checkNetlifyLogin = () => {
  try {
    const output = execSync('npx netlify status').toString();
    return output.includes('Logged in');
  } catch (error) {
    return false;
  }
};

// 環境変数を設定
const setEnvVariable = (name, value) => {
  try {
    execSync(`npx netlify env:set ${name} "${value}"`, { stdio: 'inherit' });
    console.log(`✅ ${name}を設定しました`);
    return true;
  } catch (error) {
    console.error(`❌ ${name}の設定に失敗しました:`, error.message);
    return false;
  }
};

// メイン処理
const main = async () => {
  console.log('[Wado Team Scheduler CLI]> 環境変数自動更新ツール');
  console.log('==================================');

  // サイトID
  const siteId = '34698b41-a11f-4f1b-9e48-644f90c46e18';

  // Netlify CLIの確認
  if (!checkNetlifyCLI()) {
    console.log('❌ Netlify CLIが見つかりません。インストールします...');
    try {
      execSync('npm install -g netlify-cli', { stdio: 'inherit' });
      console.log('✅ Netlify CLIをインストールしました');
    } catch (error) {
      console.error('❌ Netlify CLIのインストールに失敗しました:', error.message);
      process.exit(1);
    }
  }

  // Netlifyログインの確認
  if (!checkNetlifyLogin()) {
    console.log('❌ Netlifyにログインしていません。ログインしてください...');
    try {
      execSync('npx netlify login', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Netlifyへのログインに失敗しました:', error.message);
      process.exit(1);
    }
  }

  try {
    console.log(`サイト ${siteId} にリンクしています...`);
    execSync(`npx netlify link --id ${siteId}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ サイトのリンクに失敗しました:', error.message);
    process.exit(1);
  }

  console.log('環境変数の設定を開始します...');

  // 環境変数の設定
  // 1. Supabase接続情報
  let supabaseUrl = '';
  let supabaseAnonKey = '';
  
  // .envファイルから値を読み込む
  try {
    const envContent = fs.readFileSync('./client/.env', 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
    
    if (urlMatch && urlMatch[1]) supabaseUrl = urlMatch[1];
    if (keyMatch && keyMatch[1]) supabaseAnonKey = keyMatch[1];
  } catch (error) {
    console.log('⚠️ .envファイルの読み込みに失敗しました。');
    process.exit(1);
  }

  // 2. Google OAuth設定
  let googleClientId = '';
  
  // .envファイルから値を読み込む
  try {
    const envContent = fs.readFileSync('./client/.env', 'utf8');
    const clientIdMatch = envContent.match(/VITE_GOOGLE_CLIENT_ID=(.+)/);
    
    if (clientIdMatch && clientIdMatch[1]) googleClientId = clientIdMatch[1];
  } catch (error) {
    console.log('⚠️ .envファイルの読み込みに失敗しました。');
    process.exit(1);
  }

  // 3. Google Sheets API認証情報
  let googleCredentials = '';
  
  // .env.localファイルから値を読み込む
  try {
    const envLocalContent = fs.readFileSync('./client/.env.local', 'utf8');
    const credentialsMatch = envLocalContent.match(/GOOGLE_CREDENTIALS_JSON=(.+)/);
    
    if (credentialsMatch && credentialsMatch[1]) googleCredentials = credentialsMatch[1];
  } catch (error) {
    console.log('⚠️ .env.localファイルの読み込みに失敗しました。');
    process.exit(1);
  }

  // 4. Web Push通知用のVAPIDキーを生成
  let vapidPublicKey = '';
  let vapidPrivateKey = '';
  
  try {
    console.log('VAPIDキーを生成しています...');
    // web-push パッケージをインストール
    execSync('npm install -g web-push', { stdio: 'inherit' });
    
    // キーを生成
    const vapidOutput = execSync('npx web-push generate-vapid-keys --json').toString();
    const vapidKeys = JSON.parse(vapidOutput);
    
    vapidPublicKey = vapidKeys.publicKey;
    vapidPrivateKey = vapidKeys.privateKey;
    
    console.log('✅ VAPIDキーを生成しました');
    console.log(`公開キー: ${vapidPublicKey}`);
    console.log(`秘密キー: ${vapidPrivateKey}`);
  } catch (error) {
    console.error('❌ VAPIDキーの生成に失敗しました:', error.message);
    process.exit(1);
  }

  // 環境変数の設定
  console.log('\n環境変数を設定しています...');
  
  // --forceフラグを使用して確認なしで上書き
  const setEnvWithForce = (name, value) => {
    try {
      execSync(`npx netlify env:set ${name} "${value}" --force`, { stdio: 'inherit' });
      console.log(`✅ ${name}を設定しました`);
      return true;
    } catch (error) {
      console.error(`❌ ${name}の設定に失敗しました:`, error.message);
      return false;
    }
  };
  
  setEnvWithForce('VITE_SUPABASE_URL', supabaseUrl);
  setEnvWithForce('VITE_SUPABASE_ANON_KEY', supabaseAnonKey);
  setEnvWithForce('VITE_GOOGLE_CLIENT_ID', googleClientId);
  setEnvWithForce('GOOGLE_CREDENTIALS_JSON', googleCredentials);
  setEnvWithForce('VAPID_PUBLIC_KEY', vapidPublicKey);
  setEnvWithForce('VAPID_PRIVATE_KEY', vapidPrivateKey);

  console.log('\n✅ 環境変数の設定が完了しました');
  
  // Google OAuth リダイレクト URI の設定
  console.log('\n重要: Google Cloud Consoleで、以下のリダイレクト URIを追加してください:');
  console.log(`https://${siteId}.netlify.app/auth/callback`);

  // 再デプロイ
  try {
    console.log('\n再デプロイを開始します...');
    execSync('npx netlify deploy --build --prod', { stdio: 'inherit' });
    console.log('✅ 再デプロイが完了しました');
  } catch (error) {
    console.error('❌ 再デプロイに失敗しました:', error.message);
  }
};

// スクリプトの実行
main().catch(error => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
