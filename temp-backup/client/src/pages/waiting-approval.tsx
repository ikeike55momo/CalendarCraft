import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useLocation } from "wouter";
import { notifyAdminAboutPendingUser } from "@/lib/pushNotification";
import { useToast } from "@/components/ui/use-toast";

export default function WaitingApprovalPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [, setLocation] = useLocation();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [notificationSent, setNotificationSent] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // セッション情報の取得
    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      setSession(authSession);
      
      if (authSession?.user) {
        // ユーザーが登録済みかチェック
        checkUserRegistration(authSession.user.id);
        // 管理者ユーザーの取得
        fetchAdminUsers();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setSession(authSession);
      
      if (authSession?.user) {
        checkUserRegistration(authSession.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 管理者ユーザーを取得する関数
  const fetchAdminUsers = async () => {
    try {
      // RLSポリシーエラーを回避するため、REST APIを直接使用
      const response = await fetch(`${supabase.supabaseUrl}/rest/v1/users?role=eq.admin`, {
        method: 'GET',
        headers: {
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const admins = await response.json();
      setAdminUsers(admins || []);
    } catch (error) {
      console.error('管理者ユーザー取得エラー:', error);
    }
  };

  // ユーザーが登録済みかチェックする関数
  const checkUserRegistration = async (googleSub: string) => {
    setCheckingStatus(true);
    try {
      // RLSポリシーエラーを回避するため、REST APIを直接使用
      const response = await fetch(`${supabase.supabaseUrl}/rest/v1/users?google_sub=eq.${encodeURIComponent(googleSub)}`, {
        method: 'GET',
        headers: {
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const users = await response.json();
      
      if (users && users.length > 0) {
        // 登録済みユーザーはメインページへリダイレクト
        setLocation("/");
      }
    } catch (error) {
      console.error('ユーザー登録確認エラー:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  // 管理者に通知を送信する関数
  const handleNotifyAdmin = async () => {
    if (!session?.user) return;
    
    setLoading(true);
    try {
      // 管理者ユーザーがいない場合は処理を中止
      if (adminUsers.length === 0) {
        toast({
          title: "エラー",
          description: "管理者ユーザーが見つかりません。",
          variant: "destructive",
        });
        return;
      }
      
      // 最初の管理者に通知を送信
      const adminId = adminUsers[0].google_sub;
      const userName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '新規ユーザー';
      const userEmail = session.user.email || '';
      
      const success = await notifyAdminAboutPendingUser(adminId, userName, userEmail);
      
      if (success) {
        setNotificationSent(true);
        toast({
          title: "通知送信完了",
          description: "管理者に承認リクエストを送信しました。",
        });
      } else {
        toast({
          title: "通知送信エラー",
          description: "管理者への通知送信に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('管理者通知エラー:', error);
      toast({
        title: "エラー",
        description: "管理者への通知送信中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLocation("/");
  };

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">承認待ち</CardTitle>
          <CardDescription>
            管理者による承認をお待ちください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
            <p className="text-sm">
              あなたのアカウントは現在、管理者による承認待ちの状態です。
              管理者が承認するまでしばらくお待ちください。
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">ユーザー情報</h3>
            <div className="bg-gray-50 p-3 rounded-md">
              <p><span className="font-medium">名前:</span> {session?.user?.user_metadata?.full_name || '不明'}</p>
              <p><span className="font-medium">メール:</span> {session?.user?.email || '不明'}</p>
              <p><span className="font-medium">ID:</span> {session?.user?.id || '不明'}</p>
            </div>
          </div>
          
          <div className="pt-4 space-y-2">
            <Button 
              className="w-full" 
              onClick={handleNotifyAdmin}
              disabled={loading || notificationSent}
            >
              {loading ? "送信中..." : notificationSent ? "通知送信済み" : "管理者に承認リクエストを送信"}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleLogout}
            >
              ログアウト
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 