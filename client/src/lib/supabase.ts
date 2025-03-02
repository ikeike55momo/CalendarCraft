import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { mockAuthService } from './mockService';
import { Session } from '@supabase/supabase-js';

// 環境変数からSupabaseの設定を取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 開発環境かどうかを判定
const isDevelopment = import.meta.env.DEV;

// Supabaseクライアントの作成
export const supabase = isDevelopment && (supabaseUrl === 'https://your-supabase-project-url.supabase.co' || !supabaseUrl)
  ? { auth: mockAuthService } as any
  : createClient<Database>(supabaseUrl, supabaseAnonKey);

// 認証状態の変更を監視する関数
export const setupAuthListener = (callback: (session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
    callback(session);
  });
};

// Googleでログイン
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('Google認証エラー:', error);
    throw error;
  }

  return data;
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