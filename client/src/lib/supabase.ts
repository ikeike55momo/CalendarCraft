import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { mockAuthService } from './mockService';
import { Session } from '@supabase/supabase-js';

// 環境変数からSupabaseの設定を取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 開発環境かどうかを判定
const isDevelopment = import.meta.env.DEV;

// 現在のドメインを取得
const domain = window.location.hostname;

// 環境変数のログ出力（本番環境ではURLのみ表示）
console.log('Supabase URL:', supabaseUrl);
console.log('環境:', isDevelopment ? '開発環境' : '本番環境');
console.log('ドメイン:', domain);

// Supabaseクライアントの作成
export const supabase = isDevelopment && (supabaseUrl === 'https://your-supabase-project-url.supabase.co' || !supabaseUrl)
  ? { auth: mockAuthService } as any
  : createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true, // URLからのセッション検出を有効化（認証コードを検出するため）
        storageKey: `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`, // 明示的にストレージキーを設定
        flowType: 'pkce', // PKCE認証フローを使用（認証コードフローに適している）
        storage: {
          getItem: (key) => {
            try {
              const itemStr = localStorage.getItem(key);
              if (!itemStr) {
                return null;
              }
              
              // コード・ベリファイアの特別処理
              if (key.endsWith('-code-verifier')) {
                console.log(`ストレージから読み込み (コード・ベリファイア 生値): ${key}`, itemStr);
                
                // 余分な引用符を削除する処理
                let cleanedValue = itemStr;
                
                try {
                  // JSONとしてパースを試みる（余分な引用符がある場合）
                  const parsedValue = JSON.parse(itemStr);
                  
                  // パースした結果が文字列なら、それを使用
                  if (typeof parsedValue === 'string') {
                    cleanedValue = parsedValue;
                    console.log(`コード・ベリファイア JSONパース成功: ${cleanedValue}`);
                  }
                } catch (parseError) {
                  // パースに失敗した場合は、手動で引用符を削除
                  if (itemStr.startsWith('"') && itemStr.endsWith('"')) {
                    cleanedValue = itemStr.substring(1, itemStr.length - 1);
                    console.log(`コード・ベリファイア 引用符手動削除: ${cleanedValue}`);
                  }
                }
                
                // エスケープされた引用符を削除（\"）
                cleanedValue = cleanedValue.replace(/\\"/g, '');
                
                console.log(`ストレージから読み込み (コード・ベリファイア 処理後): ${key}`, cleanedValue);
                return cleanedValue;
              }
              
              console.log(`ストレージから読み込み: ${key}`, itemStr);
              
              try {
                // 通常のJSONデータとしてパース
                return JSON.parse(itemStr);
              } catch (parseError) {
                // パースに失敗した場合は文字列をそのまま返す
                console.log(`JSONパース失敗、文字列として返します: ${key}`);
                return itemStr;
              }
            } catch (error) {
              console.error('ストレージからの読み込みエラー:', error);
              return null;
            }
          },
          setItem: (key, value) => {
            try {
              // コード・ベリファイアの特別処理
              if (key.endsWith('-code-verifier')) {
                // 文字列としてそのまま保存
                if (typeof value === 'string') {
                  localStorage.setItem(key, value);
                  console.log(`ストレージに保存 (コード・ベリファイア): ${key}`, value);
                } else {
                  // 文字列でない場合はJSON文字列化（通常は起きないはず）
                  localStorage.setItem(key, JSON.stringify(value));
                  console.log(`ストレージに保存 (コード・ベリファイア、JSON変換): ${key}`, value);
                }
                return;
              }
              
              // 通常のデータはJSON文字列化して保存
              localStorage.setItem(key, JSON.stringify(value));
              console.log(`ストレージに保存: ${key}`, value);
            } catch (error) {
              console.error('ストレージへの書き込みエラー:', error);
            }
          },
          removeItem: (key) => {
            try {
              localStorage.removeItem(key);
              console.log(`ストレージから削除: ${key}`);
            } catch (error) {
              console.error('ストレージからの削除エラー:', error);
            }
          }
        }
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-js/2.x'
        }
      }
    });

// 現在のセッション状態をコンソールに出力
supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
  console.log('初期セッション状態:', data.session ? 'セッションあり' : 'セッションなし');
  if (data.session) {
    console.log('セッション詳細:', data.session);
  }
});

// 認証状態の変更を監視する関数
export const setupAuthListener = (callback: (session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
    callback(session);
  });
};

// Googleでログイン
export const signInWithGoogle = async () => {
  console.log('Google認証開始');
  
  // 本番環境のURLを使用
  const redirectUrl = 'https://schedule.ririaru-stg.cloud/auth-callback';
  console.log('Google認証リダイレクトURL:', redirectUrl);
  
  // 認証前にローカルストレージをクリア
  try {
    // 既存のセッションをログアウト
    await supabase.auth.signOut();
    console.log('既存のセッションをクリア');
    
    // ローカルストレージからSupabase関連のキーをすべて削除
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.startsWith('supabase.'))) {
        console.log(`ストレージキーを削除: ${key}`);
        localStorage.removeItem(key);
      }
    }
    
    console.log('認証関連のストレージをクリア完了');
  } catch (e) {
    console.error('ストレージクリアエラー:', e);
  }
  
  try {
    console.log('Google OAuthログイン開始');
    
    // Supabaseの標準OAuth機能を使用（シンプルに保つ）
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: redirectUrl,
        // 最小限のパラメータのみ指定
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    
    if (error) {
      console.error('Google OAuth 認証エラー:', error);
      throw error;
    }
    
    console.log('認証リクエスト成功、リダイレクト先:', data?.url);
    
    // この行は実行されない（リダイレクトのため）
    return null;
  } catch (error) {
    console.error('Google認証処理エラー:', error);
    throw error;
  }
};

// ログアウト
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('ログアウトエラー:', error);
    throw error;
  }
};

// 現在のユーザーセッションを取得
export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('セッション取得エラー:', error);
    throw error;
  }
  
  return data.session;
};

// 現在のユーザーを取得
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('ユーザー取得エラー:', error);
    throw error;
  }
  
  return data.user;
};

// サービスロールクライアント（管理者操作用）
// 注意: このクライアントはサーバーサイドでのみ使用するべきです
// クライアントサイドでの使用は緊急措置として、本番環境では適切なバックエンド実装に置き換えてください
export const getAdminApiHeaders = () => {
  return {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json'
  };
};

// URLをエクスポート
export { supabaseUrl };
