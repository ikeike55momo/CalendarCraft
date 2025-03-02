import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // URLからハッシュフラグメントを取得
    const hashFragment = window.location.hash;
    
    // ハッシュフラグメントがある場合は処理
    if (hashFragment) {
      // Supabaseの認証状態を更新
      supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
        console.log('認証コールバック処理完了:', session ? 'セッションあり' : 'セッションなし');
        
        // ホームページにリダイレクト
        setLocation('/');
      }).catch((error: Error) => {
        console.error('認証コールバック処理エラー:', error);
        setLocation('/');
      });
    } else {
      // ハッシュフラグメントがない場合はホームページにリダイレクト
      setLocation('/');
    }
  }, [setLocation]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">認証処理中...</p>
    </div>
  );
} 