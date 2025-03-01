import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Session, User } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// 未承認ユーザーの型定義
interface PendingUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export default function AdminPage() {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleSub, setGoogleSub] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [role, setRole] = useState("admin");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loadingPendingUsers, setLoadingPendingUsers] = useState(false);
  const [isPreRegistration, setIsPreRegistration] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // セッション情報の取得
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: authSession } }: { data: { session: Session | null } }) => {
      setSession(authSession);
      setUser(authSession?.user || null);
      
      // 現在のユーザー情報をフォームに設定
      if (authSession?.user) {
        setGoogleSub(authSession.user.id);
        setName(authSession.user.user_metadata?.full_name || "");
        setEmail(authSession.user.email || "");
        setSheetName(authSession.user.email?.split('@')[0] || "");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, authSession: Session | null) => {
      setSession(authSession);
      setUser(authSession?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ユーザー一覧を取得
  const fetchUsers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase.from('users').select('*');
      
      if (error) {
        console.error('ユーザー一覧取得エラー:', error);
        // RLSポリシーの無限再帰エラーの場合
        if (error.code === '42P17' && error.message.includes('infinite recursion')) {
          setFetchError("RLSポリシーエラー: ユーザーテーブルへのアクセス権限がありません。まずはユーザー登録を行ってください。");
        } else {
          setFetchError(`エラー: ${error.message}`);
        }
        // エラーがあっても空の配列を設定して表示を継続
        setUsersList([]);
      } else {
        setUsersList(data || []);
      }
    } catch (error) {
      console.error('ユーザー一覧取得エラー:', error);
      setFetchError("予期せぬエラーが発生しました。");
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  // 承認待ちユーザー一覧を取得（クライアントサイドで実行可能な方法に変更）
  const fetchPendingUsers = async () => {
    setLoadingPendingUsers(true);
    try {
      // 登録済みユーザーのGoogle Sub IDを取得
      const response = await fetch(`${supabase.supabaseUrl}/rest/v1/users`, {
        method: 'GET',
        headers: {
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`ユーザー一覧取得エラー: ${response.statusText}`);
      }
      
      const registeredUsers = await response.json();
      const registeredUserIds = registeredUsers.map((u: any) => u.google_sub).filter(Boolean);
      
      // 現在のセッションから自分自身の情報を取得
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('現在のユーザー情報を取得できません');
      }
      
      // 自分自身が登録済みかチェック
      const isCurrentUserRegistered = registeredUserIds.includes(currentUser.id);
      
      // 自分自身が登録されていない場合は、承認待ちユーザーとして表示
      if (!isCurrentUserRegistered) {
        setPendingUsers([{
          id: currentUser.id,
          email: currentUser.email || '',
          name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || '',
          created_at: currentUser.created_at || new Date().toISOString()
        }]);
      } else {
        // 自分自身は登録済みなので、空の配列を設定
        setPendingUsers([]);
        
        // 注意: Admin APIが使えないため、他のユーザーの承認待ち状態は取得できません
        toast({
          title: "情報",
          description: "クライアントサイドからは他のユーザーの承認待ち状態を取得できません。サーバーサイド機能が必要です。",
        });
      }
    } catch (error) {
      console.error('承認待ちユーザー取得エラー:', error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "承認待ちユーザーの取得に失敗しました。",
        variant: "destructive",
      });
      setPendingUsers([]);
    } finally {
      setLoadingPendingUsers(false);
    }
  };

  // 初回ロード時にユーザー一覧と承認待ちユーザーを取得
  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
  }, []);

  // フォームをリセット
  const resetForm = () => {
    if (isPreRegistration) {
      // 事前登録モードの場合は全てクリア
      setGoogleSub("");
      setName("");
      setEmail("");
      setSheetName("");
      setRole("member");
    } else if (user) {
      // 通常モードの場合は現在のユーザー情報をセット
      setGoogleSub(user.id);
      setName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
      setSheetName(user.email?.split('@')[0] || "");
      setRole("admin");
    }
  };

  // 事前登録モードの切り替え
  const togglePreRegistration = () => {
    setIsPreRegistration(!isPreRegistration);
    resetForm();
  };

  // ユーザー登録処理
  const handleRegisterUser = async () => {
    // 事前登録モードの場合はGoogle Sub IDは不要
    if (!isPreRegistration && !googleSub) {
      toast({
        title: "入力エラー",
        description: "Google Sub IDが必要です。",
        variant: "destructive",
      });
      return;
    }

    // 事前登録モードの場合はシート名のみ必須
    if (isPreRegistration && !sheetName) {
      toast({
        title: "入力エラー",
        description: "シート名は必須項目です。",
        variant: "destructive",
      });
      return;
    }

    // 通常モードの場合は名前、メール、シート名が必須
    if (!isPreRegistration && (!name || !email || !sheetName)) {
      toast({
        title: "入力エラー",
        description: "名前、メール、シート名は必須項目です。",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let existingUser = null;

      // メールアドレスが入力されている場合、メールアドレスで既存ユーザーを検索
      if (email) {
        const emailResponse = await fetch(`${supabase.supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
          method: 'GET',
          headers: {
            'apikey': supabase.supabaseKey,
            'Authorization': `Bearer ${supabase.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!emailResponse.ok) {
          throw new Error(`メールアドレス検索エラー: ${emailResponse.statusText}`);
        }
        
        const existingUsers = await emailResponse.json();
        if (existingUsers.length > 0) {
          existingUser = existingUsers[0];
        }
      }

      // メールアドレスで見つからず、シート名が入力されている場合はシート名で検索
      if (!existingUser && sheetName) {
        const sheetNameResponse = await fetch(`${supabase.supabaseUrl}/rest/v1/users?sheet_name=eq.${encodeURIComponent(sheetName)}`, {
          method: 'GET',
          headers: {
            'apikey': supabase.supabaseKey,
            'Authorization': `Bearer ${supabase.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!sheetNameResponse.ok) {
          throw new Error(`シート名検索エラー: ${sheetNameResponse.statusText}`);
        }
        
        const existingUsersBySheet = await sheetNameResponse.json();
        if (existingUsersBySheet.length > 0) {
          existingUser = existingUsersBySheet[0];
        }
      }

      if (existingUser) {
        // 既存ユーザーの更新
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        // 各フィールドが入力されている場合のみ更新
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (sheetName) updateData.sheet_name = sheetName;
        if (role) updateData.role = role;

        // 事前登録モードでない場合のみGoogle Sub IDを更新
        if (!isPreRegistration && googleSub) {
          updateData.google_sub = googleSub;
        }

        const updateResponse = await fetch(`${supabase.supabaseUrl}/rest/v1/users?id=eq.${existingUser.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabase.supabaseKey,
            'Authorization': `Bearer ${supabase.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(updateData)
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          throw new Error(`更新エラー: ${updateResponse.statusText} - ${errorText}`);
        }

        toast({
          title: "更新完了",
          description: "ユーザー情報を更新しました。",
        });
      } else {
        // 新規ユーザーの登録
        const userData: any = {
          sheet_name: sheetName,
          role: role || 'member'
        };

        // 各フィールドが入力されている場合のみ設定
        if (name) userData.name = name;
        if (email) userData.email = email;

        // 事前登録モードでない場合のみGoogle Sub IDを設定
        if (!isPreRegistration && googleSub) {
          userData.google_sub = googleSub;
        }

        const insertResponse = await fetch(`${supabase.supabaseUrl}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'apikey': supabase.supabaseKey,
            'Authorization': `Bearer ${supabase.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(userData)
        });

        if (!insertResponse.ok) {
          const errorText = await insertResponse.text();
          throw new Error(`登録エラー: ${insertResponse.statusText} - ${errorText}`);
        }

        toast({
          title: "登録完了",
          description: isPreRegistration ? "メンバーを事前登録しました。" : "ユーザーを登録しました。",
        });
        
        // 事前登録モードの場合はフォームをリセット
        if (isPreRegistration) {
          resetForm();
        }
      }

      // ユーザー一覧を再取得
      fetchUsers();
      // 承認待ちユーザー一覧も更新
      fetchPendingUsers();
    } catch (error) {
      console.error('ユーザー登録エラー:', error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "ユーザー登録に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ユーザー一覧をフィルタリング
  const filteredUsers = usersList.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.sheet_name && user.sheet_name.toLowerCase().includes(searchLower))
    );
  });

  // 承認待ちユーザーを承認する
  const handleApprovePendingUser = async (pendingUser: PendingUser) => {
    setLoading(true);
    try {
      // 新規ユーザーの登録
      const insertResponse = await fetch(`${supabase.supabaseUrl}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          google_sub: pendingUser.id,
          name: pendingUser.name,
          email: pendingUser.email,
          sheet_name: pendingUser.email.split('@')[0],
          role: 'member'
        })
      });

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        throw new Error(`承認エラー: ${insertResponse.statusText} - ${errorText}`);
      }

      toast({
        title: "承認完了",
        description: `${pendingUser.name}さんを承認しました。`,
      });

      // ユーザー一覧と承認待ちユーザー一覧を再取得
      fetchUsers();
      fetchPendingUsers();
    } catch (error) {
      console.error('ユーザー承認エラー:', error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "ユーザー承認に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 現在のユーザー情報を表示
  const handleShowCurrentUser = () => {
    if (user) {
      console.log('現在のユーザー情報:', user);
      toast({
        title: "現在のユーザー情報",
        description: `ID: ${user.id}, Email: ${user.email}`,
      });
    } else {
      toast({
        title: "エラー",
        description: "ログインしていません。",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">管理者ページ</h1>
      
      <Tabs defaultValue="users" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="users">ユーザー管理</TabsTrigger>
          <TabsTrigger value="pending">
            承認待ち
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingUsers.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {isPreRegistration ? "メンバー事前登録" : "ユーザー登録"}
              </CardTitle>
              <CardDescription>
                {isPreRegistration 
                  ? "Google認証前にメンバー情報を登録します（シート名を設定）" 
                  : "ユーザー情報を登録または更新します"}
              </CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="pre-registration"
                  checked={isPreRegistration}
                  onChange={togglePreRegistration}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="pre-registration" className="cursor-pointer">
                  事前登録モード
                </Label>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isPreRegistration && (
                <div className="space-y-2">
                  <Label htmlFor="google-sub">Google Sub ID</Label>
                  <Input
                    id="google-sub"
                    value={googleSub}
                    onChange={(e) => setGoogleSub(e.target.value)}
                    placeholder="Google Sub ID"
                  />
                  <p className="text-sm text-muted-foreground">
                    現在のID: {user?.id}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="名前"
                />
                {isPreRegistration && (
                  <p className="text-sm text-muted-foreground">
                    任意項目（後から更新可能）
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="メールアドレス"
                />
                {isPreRegistration && (
                  <p className="text-sm text-muted-foreground">
                    任意項目（後から更新可能）
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sheet-name">シート名 <span className="text-red-500">*</span></Label>
                <Input
                  id="sheet-name"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="シート名"
                />
                <p className="text-sm text-muted-foreground">
                  スプレッドシートのシート名と一致させてください（必須項目）
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">役割</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="admin">管理者</option>
                  <option value="member">メンバー</option>
                </select>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleRegisterUser} disabled={loading}>
                  {loading ? "処理中..." : isPreRegistration ? "メンバーを事前登録" : "登録/更新"}
                </Button>
                {!isPreRegistration && (
                  <Button variant="outline" onClick={handleShowCurrentUser}>
                    現在のユーザー情報
                  </Button>
                )}
                {isPreRegistration && (
                  <Button variant="outline" onClick={resetForm}>
                    フォームをクリア
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>ユーザー一覧</CardTitle>
              <CardDescription>登録済みのユーザー</CardDescription>
              <div className="mt-2">
                <Input
                  placeholder="名前、メール、シート名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">読み込み中...</div>
              ) : fetchError ? (
                <div className="text-center py-4 text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p>{fetchError}</p>
                  <p className="text-sm mt-2">RLSポリシーエラーが発生しています。まずは自分自身をユーザー登録してください。</p>
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="border p-3 rounded">
                      <div className="font-medium">{user.name || '名前未設定'}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {user.id}
                        {user.google_sub ? (
                          <span>, Google Sub: {user.google_sub}</span>
                        ) : (
                          <span className="text-amber-600"> (未認証)</span>
                        )}
                      </div>
                      <div className="text-sm">
                        {user.email && <span>メール: {user.email}, </span>}
                        <span className="font-medium">シート名: {user.sheet_name}</span>, 役割: {user.role}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {searchTerm ? "検索条件に一致するユーザーはいません" : "ユーザーが登録されていません"}
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={fetchUsers}
                disabled={loading}
              >
                更新
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>承認待ちユーザー</CardTitle>
              <CardDescription>
                Google認証済みで、システムへの登録承認待ちのユーザー一覧
              </CardDescription>
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-600">
                  <strong>注意:</strong> クライアントサイドからは他のユーザーの承認待ち状態を取得できません。
                  現在のユーザー（あなた自身）が未登録の場合のみ表示されます。
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPendingUsers ? (
                <div className="text-center py-4">読み込み中...</div>
              ) : pendingUsers.length > 0 ? (
                <div className="space-y-4">
                  {pendingUsers.map((pendingUser) => (
                    <div key={pendingUser.id} className="border p-4 rounded-md flex justify-between items-center">
                      <div>
                        <div className="font-medium">{pendingUser.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {pendingUser.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          登録日: {new Date(pendingUser.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleApprovePendingUser(pendingUser)}
                        disabled={loading}
                      >
                        承認
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  承認待ちのユーザーはいません
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={fetchPendingUsers}
                disabled={loadingPendingUsers}
              >
                更新
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 