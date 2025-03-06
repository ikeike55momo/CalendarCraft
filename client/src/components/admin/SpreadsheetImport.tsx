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

const SpreadsheetImport: React.FC = () => {
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingSheets, setFetchingSheets] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { toast } = useToast();

  // スプレッドシートデータをアプリケーションで使用できる形式に変換
  const convertSheetDataToEvents = (rawData: any[]) => {
    console.log('スプレッドシートの生データ:', rawData);
    // サンプルレコードを調査
    if (rawData.length > 0) {
      console.log('最初のレコードの構造:', rawData[0]);
    }
    
    // 必要なフィールドが存在するかどうかをチェック
    const validRows = rawData.filter(row => {
      const hasDate = row && (row['日付'] || row['date'] || row['Date']);
      const hasName = row && (row['名前'] || row['name'] || row['Name']);
      return hasDate && hasName;
    });
    
    console.log('有効と判断されたレコード数:', validRows.length);
    
    if (validRows.length === 0) {
      return [];
    }
    
    // フィールド名を特定（最初の有効なレコードを基準に）
    const firstRow = validRows[0];
    const dateField = firstRow['日付'] !== undefined ? '日付' : 
                     firstRow['date'] !== undefined ? 'date' : 'Date';
    const nameField = firstRow['名前'] !== undefined ? '名前' : 
                     firstRow['name'] !== undefined ? 'name' : 'Name';
    const workTypeField = firstRow['勤務形態'] !== undefined ? '勤務形態' : 
                         firstRow['workType'] !== undefined ? 'workType' : 
                         firstRow['WorkType'] !== undefined ? 'WorkType' : '';
    
    console.log('使用するフィールド名:', { dateField, nameField, workTypeField });
    
    return validRows.map(row => {
      // データが存在することが保証されている
      const date = row[dateField] || '';
      const userName = row[nameField] || '';
      
      // 勤務形態フィールドが存在する場合は使用、存在しない場合はデフォルト値
      let workType = 'office'; // デフォルト値
      if (workTypeField && row[workTypeField]) {
        const typeValue = row[workTypeField].toString().toLowerCase();
        workType = (typeValue.includes('テレ') || typeValue.includes('リモート') || typeValue.includes('remote')) ? 'remote' : 'office';
      }
      
      // 日付形式の処理（yyyy/mm/dd や mm/dd/yyyy などの形式に対応）
      let formattedDate = date;
      if (typeof date === 'string') {
        // 日付文字列のフォーマットを調整
        const dateParts = date.split(/[\/\-]/);
        if (dateParts.length === 3) {
          // yyyy/mm/dd の形式に変換
          if (dateParts[0].length === 4) {
            formattedDate = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
          } else if (dateParts[2].length === 4) {
            // mm/dd/yyyy の形式を yyyy-mm-dd に変換
            formattedDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
          }
        }
      }
      
      // デフォルトの勤務時間を設定（9:00-18:00）
      const startTime = `${formattedDate}T09:00:00`;
      const endTime = `${formattedDate}T18:00:00`;
      
      const event = {
        userId: 1, // 実装時は適切にユーザーIDを解決する
        title: workType === 'office' ? '出勤' : 'テレワーク',
        startTime,
        endTime,
        workType,
        description: `${userName}の予定`
      };
      
      console.log('生成されたイベント:', event);
      return event;
    });
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
        // データを変換
        const events = convertSheetDataToEvents(data.data);
        
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
        const { error } = await supabase
          .from(tableName)
          .upsert(events);
        
        if (error) {
          console.error('Supabaseエラー:', error);
          throw new Error(`データの保存に失敗しました: ${error.message}`);
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