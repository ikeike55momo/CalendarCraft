import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // デバッグ情報を追加する関数
  const addDebugInfo = (info: string) => {
    console.log(info);
    setDebugInfo((prev) => [...prev, info]);
  };

  // ホームページにリダイレクトする関数
  const redirectToHome = () => {
    addDebugInfo('ホームページへリダイレクトします');
    window.location.href = '/?auth=success&t=' + new Date().getTime();
  };

  // 再ログイン画面にリダイレクトする関数
  const redirectToLogin = () => {
    addDebugInfo('ログイン画面へリダイレクトします');
    window.location.href = '/';
  };

  useEffect(() => {
    // 認証処理
    const handleAuthCallback = async () => {
      try {
        setIsProcessing(true);
        
        // URLからクエリパラメータを取得
        const queryParams = new URLSearchParams(window.location.search);
        const fullUrl = window.location.href;
        
        addDebugInfo('認証コールバック処理開始');
        addDebugInfo(`URL: ${fullUrl}`);
        addDebugInfo(`クエリパラメータ: ${queryParams.toString()}`);
        
        // ローカルストレージの状態をログ出力（デバッグ用）
        addDebugInfo('ローカルストレージの状態:');
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.startsWith('supabase.'))) {
            addDebugInfo(`- ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
          }
        }
        
        // 認証コードがURLに含まれているか確認
        if (queryParams.has('code')) {
          const code = queryParams.get('code') || '';
          addDebugInfo(`認証コードを検出しました: ${code.substring(0, 10)}...`);
          
          // Supabaseの認証状態を確認
          const { data: authData } = await supabase.auth.getSession();
          addDebugInfo(`現在の認証状態: ${authData.session ? 'セッションあり' : 'セッションなし'}`);
          
          if (authData.session) {
            // 既にセッションが存在する場合
            addDebugInfo('セッションが既に存在します');
            addDebugInfo(`ユーザーID: ${authData.session.user.id}`);
            addDebugInfo(`メールアドレス: ${authData.session.user.email}`);
            
            // ホームページにリダイレクト
            setTimeout(() => {
              redirectToHome();
            }, 1000);
            return;
          }
          
          // Supabaseに認証コードを交換させる
          addDebugInfo('認証コードを交換します...');
          
          // 認証コード交換処理を実行
          try {
            // 認証コードを交換してセッションを取得
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
              addDebugInfo(`認証コード交換エラー: ${error.message}`);
              setError(`認証に失敗しました: ${error.message}`);
              setIsProcessing(false);
              return;
            }
            
            if (data?.session) {
              addDebugInfo('認証成功: セッションが設定されました');
              addDebugInfo(`ユーザーID: ${data.session.user.id}`);
              addDebugInfo(`メールアドレス: ${data.session.user.email}`);
              
              // ホームページにリダイレクト
              setTimeout(() => {
                redirectToHome();
              }, 1000);
            } else {
              addDebugInfo('認証失敗: セッションが設定されませんでした');
              setError('認証に失敗しました。もう一度ログインしてください。');
              setIsProcessing(false);
            }
          } catch (exchangeError) {
            addDebugInfo(`認証コード交換例外: ${exchangeError instanceof Error ? exchangeError.message : String(exchangeError)}`);
            setError('認証処理中にエラーが発生しました。もう一度ログインしてください。');
            setIsProcessing(false);
          }
        } else {
          // Supabaseの認証状態を確認
          const { data: authData } = await supabase.auth.getSession();
          
          if (authData.session) {
            // 認証コードはないがセッションが既に存在する場合
            addDebugInfo('認証コードはありませんが、セッションが既に存在します');
            addDebugInfo(`ユーザーID: ${authData.session.user.id}`);
            addDebugInfo(`メールアドレス: ${authData.session.user.email}`);
            
            // ホームページにリダイレクト
            setTimeout(() => {
              redirectToHome();
            }, 1000);
          } else {
            addDebugInfo('認証コードが見つからず、セッションも存在しません');
            setError('認証情報が見つかりませんでした。もう一度ログインしてください。');
            setIsProcessing(false);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        addDebugInfo(`認証コールバック処理エラー: ${errorMessage}`);
        setError('認証処理中にエラーが発生しました。もう一度ログインしてください。');
        setIsProcessing(false);
      }
    };
    
    handleAuthCallback();
  }, [setLocation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-center">認証コールバック</h1>
        
        {isProcessing ? (
          <div className="text-center">
            <p className="text-lg">認証処理中...</p>
            <div className="mt-4 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-lg text-red-500">{error}</p>
            <div className="mt-4">
              <button 
                onClick={redirectToLogin}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                ログイン画面へ戻る
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg text-green-500">認証完了！</p>
            <p className="mt-2">ホームページにリダイレクトします...</p>
          </div>
        )}
        
        {/* デバッグ情報 */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="mb-2 text-lg font-semibold">デバッグ情報:</h2>
          <div className="overflow-auto max-h-60 text-xs font-mono">
            {debugInfo.map((info, index) => (
              <div key={index} className="py-1 border-b border-gray-200">
                {info}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
