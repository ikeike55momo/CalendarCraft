#!/usr/bin/env node

/**
 * Netlify環境変数直接更新スクリプト
 * 
 * このスクリプトは、指定されたNetlifyサイトの環境変数を直接更新します。
 * 使用方法: node update-env-direct.js
 */

import { execSync } from 'child_process';
import fs from 'fs';

// サイトID
const SITE_ID = '34698b41-a11f-4f1b-9e48-644f90c46e18';

console.log(`[Wado Team Scheduler CLI]> サイト ${SITE_ID} の環境変数を直接更新します`);
console.log('==================================');

try {
  // サイトにリンク
  console.log(`サイト ${SITE_ID} にリンクしています...`);
  execSync(`npx netlify link --id ${SITE_ID}`, { stdio: 'inherit' });
  
  // .envファイルから値を読み込む
  console.log('\n.envファイルから環境変数を読み込んでいます...');
  const envContent = fs.readFileSync('./client/.env', 'utf8');
  
  // Supabase URL
  const supabaseUrlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
  if (supabaseUrlMatch && supabaseUrlMatch[1]) {
    const supabaseUrl = supabaseUrlMatch[1];
    console.log(`VITE_SUPABASE_URL: ${supabaseUrl}`);
    execSync(`npx netlify env:set VITE_SUPABASE_URL "${supabaseUrl}" --force`, { stdio: 'inherit' });
    console.log('✅ VITE_SUPABASE_URLを設定しました');
  }
  
  // Supabase Anon Key
  const supabaseKeyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
  if (supabaseKeyMatch && supabaseKeyMatch[1]) {
    const supabaseKey = supabaseKeyMatch[1];
    console.log(`VITE_SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 10)}...`);
    execSync(`npx netlify env:set VITE_SUPABASE_ANON_KEY "${supabaseKey}" --force`, { stdio: 'inherit' });
    console.log('✅ VITE_SUPABASE_ANON_KEYを設定しました');
  }
  
  // Google Client ID
  const googleClientIdMatch = envContent.match(/VITE_GOOGLE_CLIENT_ID=(.+)/);
  if (googleClientIdMatch && googleClientIdMatch[1]) {
    const googleClientId = googleClientIdMatch[1];
    console.log(`VITE_GOOGLE_CLIENT_ID: ${googleClientId}`);
    execSync(`npx netlify env:set VITE_GOOGLE_CLIENT_ID "${googleClientId}" --force`, { stdio: 'inherit' });
    console.log('✅ VITE_GOOGLE_CLIENT_IDを設定しました');
  }
  
  // .env.localファイルから値を読み込む
  console.log('\n.env.localファイルから環境変数を読み込んでいます...');
  const envLocalContent = fs.readFileSync('./client/.env.local', 'utf8');
  
  // Google Credentials JSON
  const googleCredentialsMatch = envLocalContent.match(/GOOGLE_CREDENTIALS_JSON=(.+)/);
  if (googleCredentialsMatch && googleCredentialsMatch[1]) {
    const googleCredentials = googleCredentialsMatch[1];
    console.log('GOOGLE_CREDENTIALS_JSON: [長いJSONデータ]');
    execSync(`npx netlify env:set GOOGLE_CREDENTIALS_JSON '${googleCredentials}' --force`, { stdio: 'inherit' });
    console.log('✅ GOOGLE_CREDENTIALS_JSONを設定しました');
  }
  
  // Web Push通知用のVAPIDキーを生成
  console.log('\nVAPIDキーを生成しています...');
  const vapidOutput = execSync('npx web-push generate-vapid-keys --json').toString();
  const vapidKeys = JSON.parse(vapidOutput);
  
  const vapidPublicKey = vapidKeys.publicKey;
  const vapidPrivateKey = vapidKeys.privateKey;
  
  console.log(`VAPID_PUBLIC_KEY: ${vapidPublicKey}`);
  execSync(`npx netlify env:set VAPID_PUBLIC_KEY "${vapidPublicKey}" --force`, { stdio: 'inherit' });
  console.log('✅ VAPID_PUBLIC_KEYを設定しました');
  
  console.log(`VAPID_PRIVATE_KEY: ${vapidPrivateKey}`);
  execSync(`npx netlify env:set VAPID_PRIVATE_KEY "${vapidPrivateKey}" --force`, { stdio: 'inherit' });
  console.log('✅ VAPID_PRIVATE_KEYを設定しました');
  
  console.log('\n✅ すべての環境変数の設定が完了しました');
  
  // 環境変数の一覧を表示
  console.log('\n現在の環境変数一覧:');
  execSync(`npx netlify env:list`, { stdio: 'inherit' });
  
} catch (error) {
  console.error('エラーが発生しました:', error.message);
  process.exit(1);
}
