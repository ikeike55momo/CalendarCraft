#!/usr/bin/env node

/**
 * Wado Team Scheduler CLI
 * 
 * このCLIツールは、Wado Team Schedulerの管理タスクを実行するためのコマンドラインインターフェースを提供します。
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 現在のファイルのディレクトリパスを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .clinerules ファイルを読み込む
let clinerules = {};
try {
  const clinerulesPath = path.join(__dirname, '.clinerules');
  const clinerulesContent = fs.readFileSync(clinerulesPath, 'utf8');
  // コメントを削除して JSON としてパース
  const jsonContent = clinerulesContent.replace(/\/\/.*$/gm, '');
  clinerules = JSON.parse(jsonContent);
} catch (error) {
  console.error('Error loading .clinerules file:', error.message);
  process.exit(1);
}

// コマンドラインの引数を取得
const args = process.argv.slice(2);
const command = args[0];

// ヘルプメッセージを表示
function showHelp() {
  console.log(clinerules.helpTemplate.header);
  console.log('\n利用可能なコマンド:\n');
  
  clinerules.commands.forEach(cmd => {
    console.log(`  ${cmd.name}`);
    console.log(`    ${cmd.description}`);
    
    if (cmd.options && cmd.options.length > 0) {
      console.log('    オプション:');
      cmd.options.forEach(opt => {
        console.log(`      ${opt.flag}: ${opt.description}`);
      });
    }
    console.log('');
  });
  
  console.log(clinerules.helpTemplate.footer);
}

// コマンドの実行
function executeCommand(command, args) {
  const promptPrefix = clinerules.cliBehavior.promptPrefix;
  
  switch (command) {
    case 'updateEnv':
      console.log(`${promptPrefix} Netlify環境変数を更新します...`);
      
      // サイト名オプションの処理
      let siteNameArg = '';
      const siteNameIndex = args.indexOf('--site');
      if (siteNameIndex !== -1 && args.length > siteNameIndex + 1) {
        siteNameArg = args[siteNameIndex + 1];
      }
      
      try {
        // update-netlify-env.js スクリプトを実行
        execSync(`node ${path.join(__dirname, 'update-netlify-env.js')}`, { 
          stdio: 'inherit',
          env: {
            ...process.env,
            NETLIFY_SITE_NAME: siteNameArg
          }
        });
      } catch (error) {
        console.error(`${promptPrefix} エラー: 環境変数の更新に失敗しました`);
        process.exit(1);
      }
      break;
      
    case 'importSheet':
      console.log(`${promptPrefix} Google Sheetsからデータをインポートします...`);
      console.log(`${promptPrefix} この機能は現在実装中です。`);
      break;
      
    case 'exportCalendar':
      console.log(`${promptPrefix} Googleカレンダーへデータをエクスポートします...`);
      console.log(`${promptPrefix} この機能は現在実装中です。`);
      break;
      
    case 'listProjects':
      console.log(`${promptPrefix} プロジェクト一覧を表示します...`);
      console.log(`${promptPrefix} この機能は現在実装中です。`);
      break;
      
    case 'listTasks':
      console.log(`${promptPrefix} タスク一覧を表示します...`);
      console.log(`${promptPrefix} この機能は現在実装中です。`);
      break;
      
    case clinerules.cliBehavior.helpCommand:
      showHelp();
      break;
      
    case clinerules.cliBehavior.exitCommand:
      console.log(`${promptPrefix} 終了します。`);
      process.exit(0);
      break;
      
    default:
      console.log(clinerules.systemMessages.invalidCommand);
      break;
  }
}

// ウェルカムメッセージを表示
console.log(clinerules.systemMessages.welcome);

// コマンドがない場合はヘルプを表示
if (!command) {
  showHelp();
} else {
  executeCommand(command, args.slice(1));
}
