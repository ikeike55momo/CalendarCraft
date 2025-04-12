#!/usr/bin/env node

/**
 * Netlify環境変数更新スクリプト
 * 
 * このスクリプトは、Netlifyにデプロイされたアプリケーションの環境変数を更新します。
 * 使用方法: node update-netlify-env.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';

// 対話型インターフェースの設定
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// プロンプト関数（Promise化）
const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

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
  console.log('[Wado Team Scheduler CLI]> 環境変数更新ツール');
  console.log('==================================');

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

  // サイト名の入力
  let siteName = process.env.NETLIFY_SITE_NAME || '';
  if (!siteName) {
    siteName = await prompt('Netlifyサイト名を入力してください: ');
  }
  
  try {
    console.log(`サイト ${siteName} にリンクしています...`);
    if (siteName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      // UUIDの形式の場合はサイトIDとして扱う
      execSync(`npx netlify link --id ${siteName}`, { stdio: 'inherit' });
    } else {
      // 通常のサイト名として扱う
      execSync(`npx netlify link --name ${siteName}`, { stdio: 'inherit' });
    }
  } catch (error) {
    console.error('❌ サイトのリンクに失敗しました:', error.message);
    const createNew = await prompt('新しいサイトを作成しますか？ (y/n): ');
    if (createNew.toLowerCase() === 'y') {
      try {
        execSync(`npx netlify sites:create --name ${siteName}`, { stdio: 'inherit' });
        execSync(`npx netlify link --name ${siteName}`, { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ サイトの作成に失敗しました:', error.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
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
    console.log('⚠️ .envファイルの読み込みに失敗しました。手動で値を入力してください。');
  }

  // 値が空の場合は入力を求める
  if (!supabaseUrl) {
    supabaseUrl = await prompt('Supabase URL を入力してください: ');
  } else {
    const useDefault = await prompt(`Supabase URL [${supabaseUrl}] を使用しますか？ (y/n): `);
    if (useDefault.toLowerCase() !== 'y') {
      supabaseUrl = await prompt('Supabase URL を入力してください: ');
    }
  }

  if (!supabaseAnonKey) {
    supabaseAnonKey = await prompt('Supabase Anon Key を入力してください: ');
  } else {
    const useDefault = await prompt(`Supabase Anon Key [${supabaseAnonKey.substring(0, 10)}...] を使用しますか？ (y/n): `);
    if (useDefault.toLowerCase() !== 'y') {
      supabaseAnonKey = await prompt('Supabase Anon Key を入力してください: ');
    }
  }

  // 2. Google OAuth設定
  let googleClientId = '';
  let googleClientSecret = '';
  
  // .envファイルから値を読み込む
  try {
    const envContent = fs.readFileSync('./client/.env', 'utf8');
    const clientIdMatch = envContent.match(/VITE_GOOGLE_CLIENT_ID=(.+)/);
    
    if (clientIdMatch && clientIdMatch[1]) googleClientId = clientIdMatch[1];
  } catch (error) {
    console.log('⚠️ .envファイルの読み込みに失敗しました。手動で値を入力してください。');
  }

  // 値が空の場合は入力を求める
  if (!googleClientId) {
    googleClientId = await prompt('Google Client ID を入力してください: ');
  } else {
    const useDefault = await prompt(`Google Client ID [${googleClientId}] を使用しますか？ (y/n): `);
    if (useDefault.toLowerCase() !== 'y') {
      googleClientId = await prompt('Google Client ID を入力してください: ');
    }
  }
  
  // Google Client Secret
  googleClientSecret = await prompt('Google Client Secret を入力してください: ');

  // 3. Google Sheets API認証情報
  let googleCredentials = '';
  
  // .env.localファイルから値を読み込む
  try {
    const envLocalContent = fs.readFileSync('./client/.env.local', 'utf8');
    const credentialsMatch = envLocalContent.match(/GOOGLE_CREDENTIALS_JSON=(.+)/);
    
    if (credentialsMatch && credentialsMatch[1]) googleCredentials = credentialsMatch[1];
  } catch (error) {
    console.log('⚠️ .env.localファイルの読み込みに失敗しました。');
  }

  // サービスアカウントのJSONファイルから読み込む
  if (!googleCredentials) {
    const useJsonFile = await prompt('Google Sheets APIのサービスアカウントJSONファイルを使用しますか？ (y/n): ');
    if (useJsonFile.toLowerCase() === 'y') {
      const jsonPath = await prompt('JSONファイルのパスを入力してください: ');
      try {
        googleCredentials = fs.readFileSync(jsonPath, 'utf8');
      } catch (error) {
        console.error('❌ JSONファイルの読み込みに失敗しました:', error.message);
        googleCredentials = await prompt('Google Credentials JSON を直接入力してください: ');
      }
    } else {
      googleCredentials = await prompt('Google Credentials JSON を直接入力してください: ');
    }
  } else {
    const useDefault = await prompt(`既存のGoogle Credentials JSONを使用しますか？ (y/n): `);
    if (useDefault.toLowerCase() !== 'y') {
      const useJsonFile = await prompt('Google Sheets APIのサービスアカウントJSONファイルを使用しますか？ (y/n): ');
      if (useJsonFile.toLowerCase() === 'y') {
        const jsonPath = await prompt('JSONファイルのパスを入力してください: ');
        try {
          googleCredentials = fs.readFileSync(jsonPath, 'utf8');
        } catch (error) {
          console.error('❌ JSONファイルの読み込みに失敗しました:', error.message);
          googleCredentials = await prompt('Google Credentials JSON を直接入力してください: ');
        }
      } else {
        googleCredentials = await prompt('Google Credentials JSON を直接入力してください: ');
      }
    }
  }

  // 4. Web Push通知用のVAPIDキー
  const generateVapidKeys = await prompt('Web Push通知用のVAPIDキーを生成しますか？ (y/n): ');
  let vapidPublicKey = '';
  let vapidPrivateKey = '';
  
  if (generateVapidKeys.toLowerCase() === 'y') {
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
      vapidPublicKey = await prompt('VAPID Public Key を入力してください: ');
      vapidPrivateKey = await prompt('VAPID Private Key を入力してください: ');
    }
  } else {
    vapidPublicKey = await prompt('VAPID Public Key を入力してください: ');
    vapidPrivateKey = await prompt('VAPID Private Key を入力してください: ');
  }

  // 環境変数の設定
  console.log('\n環境変数を設定しています...');
  
  setEnvVariable('VITE_SUPABASE_URL', supabaseUrl);
  setEnvVariable('VITE_SUPABASE_ANON_KEY', supabaseAnonKey);
  setEnvVariable('VITE_GOOGLE_CLIENT_ID', googleClientId);
  setEnvVariable('GOOGLE_CLIENT_SECRET', googleClientSecret);
  setEnvVariable('GOOGLE_CREDENTIALS_JSON', googleCredentials);
  setEnvVariable('VAPID_PUBLIC_KEY', vapidPublicKey);
  setEnvVariable('VAPID_PRIVATE_KEY', vapidPrivateKey);

  console.log('\n✅ 環境変数の設定が完了しました');
  
  // Google OAuth リダイレクト URI の設定
  console.log('\n重要: Google Cloud Consoleで、以下のリダイレクト URIを追加してください:');
  console.log(`https://${siteName}.netlify.app/auth-callback`);

  // 再デプロイの確認
  const redeploy = await prompt('\nアプリケーションを再デプロイしますか？ (y/n): ');
  if (redeploy.toLowerCase() === 'y') {
    try {
      console.log('再デプロイを開始します...');
      execSync('npx netlify deploy --build --prod', { stdio: 'inherit' });
      console.log('✅ 再デプロイが完了しました');
    } catch (error) {
      console.error('❌ 再デプロイに失敗しました:', error.message);
    }
  }

  rl.close();
};

// スクリプトの実行
main().catch(error => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
