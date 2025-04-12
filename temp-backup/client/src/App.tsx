import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/layout/layout";
import Calendar from "@/pages/calendar";
import Tasks from "@/pages/tasks";
import Projects from "@/pages/projects";
import Admin from "@/pages/admin";
import Attendance from "@/pages/attendance";
import NotFound from "@/pages/not-found";
import WaitingApproval from "@/pages/waiting-approval";
import AuthCallback from "@/pages/auth-callback";
import { supabase, setupAuthListener } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";

function Router() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegisteredUser, setIsRegisteredUser] = useState<boolean | null>(null);

  useEffect(() => {
    // 初期セッションの取得
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      if (session?.user) {
        checkAndUpdateUserRegistration(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // 認証状態の変更を監視
    const { data: { subscription } } = setupAuthListener((session: Session | null) => {
      setSession(session);
      if (session?.user) {
        checkAndUpdateUserRegistration(session.user);
      } else {
        setIsRegisteredUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ユーザーが登録済みかチェックし、必要に応じてGoogle Sub IDを更新する関数
  const checkAndUpdateUserRegistration = async (user: User) => {
    try {
      // まず、Google Sub IDで検索
      const subResponse = await fetch(`${supabase.supabaseUrl}/rest/v1/users?google_sub=eq.${encodeURIComponent(user.id)}`, {
        method: 'GET',
        headers: {
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const usersBySub = await subResponse.json();
      
      // Google Sub IDで見つかった場合は登録済み
      if (usersBySub && usersBySub.length > 0) {
        setIsRegisteredUser(true);
        setIsLoading(false);
        return;
      }
      
      // Google Sub IDで見つからない場合は、メールアドレスで検索
      if (user.email) {
        const emailResponse = await fetch(`${supabase.supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(user.email)}`, {
          method: 'GET',
          headers: {
            'apikey': supabase.supabaseKey,
            'Authorization': `Bearer ${supabase.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        const usersByEmail = await emailResponse.json();
        
        // メールアドレスで見つかった場合は、承認待ちステータスにする
        if (usersByEmail && usersByEmail.length > 0) {
          const existingUser = usersByEmail[0];
          
          // 管理者による承認が必要なため、未登録状態にして承認待ちページに誘導
          setIsRegisteredUser(false);
          setIsLoading(false);
          
          // 承認待ちユーザーとして記録（オプション）
          try {
            // 承認待ちテーブルに登録するなどの処理をここに追加
            console.log('メールアドレスが一致するユーザーが見つかりました。管理者の承認待ちです:', existingUser.name);
          } catch (error) {
            console.error('承認待ちユーザー登録エラー:', error);
          }
          
          return;
        }
      }
      
      // どちらでも見つからない場合は未登録
      setIsRegisteredUser(false);
    } catch (error) {
      console.error('ユーザー登録確認エラー:', error);
      setIsRegisteredUser(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ユーザーが管理者かどうかを判定
  const isAdmin = session?.user?.user_metadata?.role === 'admin';
  
  // ローディング中はスケルトンを表示
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">読み込み中...</div>;
  }

  // 未認証の場合はログイン画面にリダイレクト
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/30">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Wado Team Scheduler</h1>
            <p className="mt-2 text-gray-600">チームの出勤管理・スケジュール管理アプリ</p>
          </div>
          <button
            onClick={() => {
              import("./lib/supabase").then(({ signInWithGoogle }) => {
                signInWithGoogle().catch(error => {
                  console.error("Google認証エラー:", error);
                  alert("認証に失敗しました。もう一度お試しください。");
                });
              });
            }}
            className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-gray-700 font-medium">Googleでログイン</span>
          </button>
        </div>
      </div>
    );
  }

  // 認証済みだが未登録の場合は承認待ちページにリダイレクト
  if (isRegisteredUser === false) {
    return <WaitingApproval />;
  }
  
  return (
    <Layout isAdmin={isAdmin}>
      <Switch>
        <Route path="/" component={Calendar} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/projects" component={Projects} />
        <Route path="/attendance" component={Attendance} />
        <Route path="/admin" component={Admin} />
        <Route path="/waiting-approval" component={WaitingApproval} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
