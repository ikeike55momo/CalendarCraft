import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";

// GASのWebアプリURL（デプロイ後に更新する）
// 注意: これは環境変数として管理するのがベストプラクティスです
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxYWbWl4nzLvRB0rz4NBs9IJINIpNnWktAq8PnR_TYIa8fDi46Cq5QQZSHpPCAhY-6e/exec';
const API_KEY = 'your-secret-api-key'; // こちらも環境変数として管理すべき

// ユーザー型の定義
interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  sheet_name?: string;
  google_sub?: string;
  created_at?: string;
  updated_at?: string;
}

const SpreadsheetImport: React.FC = () => {
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingSheets, setFetchingSheets] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { toast } = useToast();

  // スプレッドシートデータをアプリケーションで使用できる形式に変換
  const convertSheetDataToEvents = (rawData: any[], memberIds?: Map<string, number>) => {
    console.log('スプレッドシートの生データ:', rawData);
    // サンプルレコードを調査
    if (rawData.length > 0) {
      console.log('最初のレコードの構造:', rawData[0]);
    }
    
    // 空のデータの場合はすぐにリターン
    if (!rawData || rawData.length === 0) {
      return [];
    }
    
    const events: any[] = [];
    
    // スプレッドシートの構造を解析
    // シート名(yyyyMM)の取得 (例: "202401")
    const yearMonth = selectedSheet;
    
    // 参照ファイルのシート構造に基づいたデータ変換
    try {
      // 構造: 各メンバーは3行で表現され、1列目にメンバー名がある
      // 各日付はC列（3列目）から始まる
      
      // ヘッダー行を取得
      const headerRow = rawData[0] || [];
      
      // メンバー処理（3行ごとにまとめられている）
      for (let i = 1; i < rawData.length; i += 3) {
        // メンバー名を取得
        const memberName = rawData[i]?.[0]?.replace?.(/\n/g, ' ')?.trim() || '';
        if (!memberName) continue;
        
        console.log(`メンバー処理: ${memberName}`);
        
        // ユーザーIDを取得（メンバーマップから）
        // メンバーが見つからない場合は管理者ID（1）を使用
        let userId = 1; // デフォルト値（管理者ID）
        
        if (memberIds) {
          const mappedId = memberIds.get(memberName);
          if (mappedId) {
            userId = mappedId;
          } else {
            console.log(`警告: "${memberName}" のユーザーIDが見つかりません。管理者IDを使用します。`);
          }
        }
        
        // 各日の予定を処理
        for (let day = 1; day <= 31; day++) {
          const columnIndex = 2 + day; // C列（3列目）が1日目
          if (columnIndex >= headerRow.length) break; // シートの範囲外
          
          // 勤務形態を取得 (出社またはテレ)
          const workType = rawData[i + 2]?.[columnIndex];
          
          // 有効な勤務形態の場合のみイベントを作成
          if (workType === '出社' || workType === 'テレ') {
            // 日付の形式を整えて作成
            const dateStr = `${yearMonth}${String(day).padStart(2, '0')}`;
            const dateObj = new Date(
              parseInt(dateStr.substring(0, 4)), 
              parseInt(dateStr.substring(4, 6)) - 1, 
              parseInt(dateStr.substring(6, 8))
            );
            
            // ISO形式の日付を作成
            const formattedDate = dateObj.toISOString().split('T')[0];
            
            // イベントを作成
            const event = {
              userId,
              title: workType === '出社' ? '出勤' : 'テレワーク',
              startTime: `${formattedDate}T09:00:00`,
              endTime: `${formattedDate}T18:00:00`,
              workType: workType === '出社' ? 'office' : 'remote',
              description: `${memberName}の予定 (シート: ${selectedSheet})`
            };
            
            events.push(event);
          }
        }
      }
      
    } catch (error) {
      console.error('データ変換エラー:', error);
    }
    
    console.log(`変換後のイベント数: ${events.length}`);
    if (events.length > 0) {
      console.log('変換後の最初のイベント:', events[0]);
    }
    
    return events;
  };

  // 利用可能なシート名を取得
  const fetchSheetNames = async () => {
    setFetchingSheets(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      // 実際のGAS APIを呼び出す
      const url = `${GAS_API_URL}?apiKey=${API_KEY}&action=getSheetNames`;
      console.log('シート名取得リクエスト:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      console.log('シート名取得レスポンス:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.success && data.sheetNames) {
        setSheetNames(data.sheetNames);
        if (data.sheetNames.length > 0) {
          setSelectedSheet(data.sheetNames[0]);
          setSuccessMessage(`${data.sheetNames.length}件のシートを取得しました`);
          toast({
            title: "成功",
            description: `${data.sheetNames.length}件のシートを取得しました`,
            variant: "default"
          });
        } else {
          setErrorMessage("シートが見つかりませんでした。");
        }
      } else {
        setErrorMessage("シート名の取得に失敗しました。レスポンスが不正です。");
      }
    } catch (error) {
      console.error('シート名の取得に失敗しました:', error);
      setErrorMessage(error instanceof Error ? error.message : "シート名の取得に失敗しました");
      toast({
        title: "エラー",
        description: "シート名の取得に失敗しました",
        variant: "destructive"
      });
    } finally {
      setFetchingSheets(false);
    }
  };

  // スプレッドシートからデータをインポート
  const importData = async () => {
    if (!selectedSheet) {
      toast({
        title: "エラー",
        description: "シート名を指定してください",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      // 実際のGAS APIを呼び出す
      const url = `${GAS_API_URL}?apiKey=${API_KEY}&sheetName=${encodeURIComponent(selectedSheet)}`;
      console.log('データインポートリクエスト:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      console.log('データインポートレスポンス:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.success && data.data) {
        // ユーザー情報を事前に取得
        const { data: users, error } = await supabase.from('members').select('*');
        if (error) {
          throw new Error(`ユーザー情報の取得に失敗: ${error.message}`);
        }
        
        // メンバーIDマップを作成
        const memberIds = new Map<string, number>();
        if (users) {
          users.forEach((user: Member) => {
            // 名前でマッピング
            const memberName = user.name || '';
            if (memberName) {
              memberIds.set(memberName, user.id);
            }
            
            // sheet_nameでもマッピング（あれば）
            if (user.sheet_name) {
              memberIds.set(user.sheet_name, user.id);
            }
          });
        }
        
        console.log('ユーザーマッピング:', Object.fromEntries(memberIds));
        
        // データを変換（メンバーIDマップを渡す）
        const events = convertSheetDataToEvents(data.data, memberIds);
        
        if (events.length === 0) {
          setSuccessMessage("インポート可能なデータがありませんでした");
          toast({
            title: "注意",
            description: "インポート可能なデータがありませんでした",
            variant: "default"
          });
          return;
        }
        
        // Supabaseの実際のテーブル名に合わせる
        const tableName = 'calendar'; // 実際のテーブル名に合わせて変更
        
        // Supabaseに保存
        const { error: insertError } = await supabase
          .from(tableName)
          .upsert(events);
        
        if (insertError) {
          console.error('Supabaseエラー:', insertError);
          throw new Error(`データの保存に失敗しました: ${insertError.message}`);
        }
        
        setSuccessMessage(`${events.length}件のデータをインポートしました`);
        toast({
          title: "成功",
          description: `${events.length}件のデータをインポートしました`,
          variant: "default"
        });
      } else {
        setErrorMessage("データの取得に失敗しました。レスポンスが不正です。");
      }
    } catch (error) {
      console.error('インポートに失敗しました:', error);
      setErrorMessage(error instanceof Error ? error.message : "インポートに失敗しました");
      toast({
        title: "エラー",
        description: "インポートに失敗しました",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>スプレッドシートインポート</CardTitle>
        <CardDescription>
          Google スプレッドシートからスケジュールデータをインポートします
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラーが発生しました</AlertTitle>
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}
        
        {successMessage && (
          <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
            <Info className="h-4 w-4" />
            <AlertTitle>成功</AlertTitle>
            <AlertDescription>
              {successMessage}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Button 
            onClick={fetchSheetNames} 
            disabled={fetchingSheets}
            variant="outline"
            className="w-full"
          >
            {fetchingSheets ? "取得中..." : "利用可能なシート名を取得"}
          </Button>
          <p className="text-sm text-gray-500">
            注: このボタンを押すと、Google スプレッドシートから利用可能なシート名を取得します。
          </p>
        </div>

        {sheetNames.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="sheet-name">シート名</Label>
            <Select value={selectedSheet} onValueChange={setSelectedSheet}>
              <SelectTrigger>
                <SelectValue placeholder="シートを選択" />
              </SelectTrigger>
              <SelectContent>
                {sheetNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          onClick={importData}
          disabled={!selectedSheet || loading}
          className="w-full"
        >
          {loading ? "インポート中..." : "データをインポート"}
        </Button>
        
        <div className="mt-4 text-sm text-gray-500 bg-gray-50 p-3 rounded">
          <h4 className="font-medium">Google Apps Scriptの情報:</h4>
          <p className="mt-1 break-all">
            スクリプトID: <code>AKfycbxYWbWl4nzLvRB0rz4NBs9IJINIpNnWktAq8PnR_TYIa8fDi46Cq5QQZSHpPCAhY-6e</code>
          </p>
          <p className="mt-1">
            エラーが発生する場合は、APIキーが正しく設定されているか確認してください。
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpreadsheetImport; 