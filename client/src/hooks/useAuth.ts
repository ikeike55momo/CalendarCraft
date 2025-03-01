import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, setupAuthListener } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 初期セッションの取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // 認証状態の変更を監視
    const { data } = setupAuthListener(setSession);

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // ユーザー情報とロール
  const user = session?.user || null;
  const isAdmin = user?.user_metadata?.role === 'admin';

  return {
    session,
    user,
    isLoading,
    isAdmin,
  };
} 