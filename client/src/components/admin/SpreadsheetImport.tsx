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
const GAS_API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYED_SCRIPT_ID/exec';
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
    return rawData.filter(row => row && row['日付'] && row['名前']).map(row => {
      // スプレッドシートの構造に合わせて調整する必要があります
      const date = row['日付'] || '';
      const userName = row['名前'] || '';
      const workType = row['勤務形態'] === '出社' ? 'office' : 'remote';
      
      // デフォルトの勤務時間を設定（9:00-18:00）
      const startTime = `${date}T09:00:00`;
      const endTime = `${date}T18:00:00`;
      
      // TODO: ユーザー名からユーザーIDを解決する処理が必要
      // 仮実装としてユーザー名をそのままIDとして使用
      return {
        userId: 1, // 実装時は適切にユーザーIDを解決する
        title: workType === 'office' ? '出勤' : 'テレワーク',
        startTime,
        endTime,
        workType,
        description: `${userName}の予定`
      };
    });
  };

  // 利用可能なシート名を取得
  const fetchSheetNames = async () => {
    setFetchingSheets(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      // デモ用に仮のシート名を設定
      // 実際の実装ではGASへのAPIリクエストを行う
      // const url = `${GAS_API_URL}?apiKey=${API_KEY}&action=getSheetNames`;
      // const response = await fetch(url);
      // const data = await response.json();
      
      // デモ用の仮データ
      const mockData = {
        success: true,
        sheetNames: ['2024年5月', '2024年6月', '2024年7月']
      };
      
      if (mockData.success && mockData.sheetNames) {
        setSheetNames(mockData.sheetNames);
        if (mockData.sheetNames.length > 0) {
          setSelectedSheet(mockData.sheetNames[0]);
          setSuccessMessage(`${mockData.sheetNames.length}件のシートを取得しました`);
          toast({
            title: "成功",
            description: `${mockData.sheetNames.length}件のシートを取得しました`,
            variant: "default"
          });
        } else {
          setErrorMessage("シートが見つかりませんでした。");
        }
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
      // 実際の実装ではGASへのAPIリクエスト
      // const url = `${GAS_API_URL}?apiKey=${API_KEY}&sheetName=${encodeURIComponent(selectedSheet)}`;
      // const response = await fetch(url);
      // const data = await response.json();
      
      // デモ用の仮データ
      const mockData = {
        success: true,
        data: [
          { '日付': '2024-05-01', '名前': '山田太郎', '勤務形態': '出社' },
          { '日付': '2024-05-01', '名前': '鈴木花子', '勤務形態': 'テレワーク' },
          { '日付': '2024-05-02', '名前': '山田太郎', '勤務形態': 'テレワーク' },
          { '日付': '2024-05-02', '名前': '鈴木花子', '勤務形態': '出社' }
        ]
      };
      
      if (mockData.success && mockData.data) {
        // データを変換
        const events = convertSheetDataToEvents(mockData.data);
        
        // Supabaseに保存
        const { error } = await supabase
          .from('events')
          .upsert(events);
        
        if (error) {
          throw new Error(`データの保存に失敗しました: ${error.message}`);
        }
        
        setSuccessMessage(`${events.length}件のデータをインポートしました`);
        toast({
          title: "成功",
          description: `${events.length}件のデータをインポートしました`,
          variant: "default"
        });
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
          <h4 className="font-medium">デプロイ手順:</h4>
          <ol className="list-decimal ml-5 space-y-1">
            <li>スプレッドシートを開く</li>
            <li>メニューから「拡張機能」→「Apps Script」を選択</li>
            <li>スプレッドシートのデータを返すスクリプトを作成</li>
            <li>「デプロイ」→「新しいデプロイ」→「ウェブアプリ」を選択</li>
            <li>「アクセスできるユーザー」で適切な設定を選択</li>
            <li>生成されたURLをコードの <code>GAS_API_URL</code> に設定</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpreadsheetImport; 