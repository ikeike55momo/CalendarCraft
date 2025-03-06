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
interface User {
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
  const convertSheetDataToEvents = (
    rawData: any[], 
    memberIds?: Map<string, number>,
    memberNames?: Map<string, string>
  ) => {
    console.log('スプレッドシートの生データ:', rawData);
    console.log('生データの長さ:', rawData.length);
    
    // 空のデータの場合はすぐにリターン
    if (!rawData || rawData.length === 0) {
      return [];
    }
    
    // データ構造をより詳細に分析
    console.log('データ型:', typeof rawData);
    console.log('配列チェック:', Array.isArray(rawData));
    
    // 最初の数レコードを詳しく調査
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      console.log(`レコード[${i}]:`, rawData[i]);
      console.log(`レコード[${i}]のタイプ:`, typeof rawData[i]);
      console.log(`レコード[${i}]のキー:`, Object.keys(rawData[i]));
    }
    
    const events: any[] = [];
    
    // スプレッドシートの構造を解析
    // シート名(yyyyMM)の取得 (例: "202401")
    const yearMonth = selectedSheet;
    
    try {
      // 新しいデータ構造に基づいた変換処理
      // APIから返されるデータ構造に応じて調整
      
      // ステップ1: データ内のユーザー名/シート名を特定
      const memberSet = new Set<string>();
      
      // すべてのレコードからユーザー/シート名を抽出
      rawData.forEach((record: any) => {
        // 各レコードのキーをチェック
        const keys = Object.keys(record);
        keys.forEach(key => {
          // キーに含まれる可能性のあるユーザー名/シート名を検出
          if (typeof record[key] === 'string' && record[key].trim() !== '') {
            const possibleName = record[key].trim();
            if (possibleName.length > 1) { // 単一文字は除外
              memberSet.add(possibleName);
            }
          }
        });
      });
      
      console.log('検出された可能性のあるユーザー/シート名:', Array.from(memberSet));
      
      // ステップ2: 各ユーザーと日付の組み合わせからイベントを生成
      memberSet.forEach(memberName => {
        // 最初にユーザーIDとマッピングをチェック
        let userId = 1; // デフォルト値（管理者ID）
        let realName = memberName; // デフォルトではシートの名前をそのまま使用
        
        // 完全一致を最初に試す
        if (memberIds && memberIds.has(memberName)) {
          userId = memberIds.get(memberName) || 1;
          if (memberNames && memberNames.has(memberName)) {
            realName = memberNames.get(memberName) || memberName;
          }
        } else {
          // 完全一致しない場合、部分一致と特殊文字を除去した検索を試みる
          const cleanedMemberName = memberName.replace(/[\n（）()]/g, '').trim();
          
          // 部分一致検索
          if (memberIds) {
            // Map上のすべてのキーに対して部分一致をチェック
            let matched = false;
            
            // MapIteratorではなく配列に変換して反復処理
            Array.from(memberIds.entries()).some(([key, id]) => {
              // キーに指定された名前が含まれている、または逆に含まれている場合
              if (key.includes(cleanedMemberName) || cleanedMemberName.includes(key)) {
                userId = id;
                if (memberNames && memberNames.has(key)) {
                  realName = memberNames.get(key) || memberName;
                }
                matched = true;
                console.log(`部分一致: "${memberName}" → "${key}" (ID: ${id}, 表示名: ${realName})`);
                return true; // 一致したらループを終了
              }
              return false;
            });
            
            if (!matched) {
              console.log(`警告: "${memberName}" のユーザーIDが見つかりません。管理者IDを使用します。`);
            }
          }
        }
        
        // 日付を生成 - 月の初日から末日まで
        const year = parseInt(yearMonth.substring(0, 4));
        const month = parseInt(yearMonth.substring(4, 6)) - 1; // JSの月は0から始まる
        
        // 月の最終日を取得
        const lastDay = new Date(year, month + 1, 0).getDate();
        
        for (let day = 1; day <= lastDay; day++) {
          // 各日のデータを探す
          const dateObj = new Date(year, month, day);
          const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD形式
          
          // この日付におけるユーザーの勤務形態を探す
          // 様々な可能性のあるデータ構造に対応
          let workType = null;
          
          // データ構造1: 日付をキーとして持つオブジェクト
          rawData.forEach((record: any) => {
            const recordKeys = Object.keys(record);
            recordKeys.forEach(key => {
              // キーが日付の場合
              if (key.includes(dateObj.toDateString())) {
                if (record[key] === memberName || record[key] === '出社' || record[key] === 'テレ') {
                  workType = record[key] === memberName ? '出社' : record[key];
                }
              }
              
              // 値がユーザー名と一致し、キーが日付の場合
              if (record[key] === memberName) {
                // キーが日付かチェック
                try {
                  const keyDate = new Date(key);
                  if (!isNaN(keyDate.getTime()) && keyDate.getDate() === day) {
                    // デフォルトで「出社」と仮定
                    workType = '出社';
                  }
                } catch (e) {
                  // 日付でない場合は無視
                }
              }
            });
          });
          
          // workTypeが設定されていれば、イベントを作成
          if (workType) {
            const event = {
              // idはSupabaseが自動生成
              "user_id": userId,
              "title": workType === '出社' ? '出勤' : 'テレワーク',
              "description": `${realName}の予定 (シート: ${selectedSheet})`,
              "start_time": `${dateStr}T09:00:00`,
              "end_time": `${dateStr}T18:00:00`,
              "work_type": workType,
            };
            
            events.push(event);
            console.log(`イベント作成: ${dateStr} - ${realName} - ${workType}`);
          }
        }
      });
      
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
        const { data: users, error } = await supabase.from('users').select('*');
        if (error) {
          throw new Error(`ユーザー情報の取得に失敗: ${error.message}`);
        }
        
        // メンバーIDマップを作成（sheet_nameとユーザーIDのマッピング）
        const memberIds = new Map<string, number>();
        const memberNames = new Map<string, string>(); // sheet_nameから実際の名前へのマッピング
        
        console.log("取得したユーザー:", users);
        
        if (users) {
          users.forEach((user: User) => {
            // sheet_nameをキーにしてIDをマッピング
            if (user.sheet_name) {
              // 完全一致と部分一致の両方を考慮
              memberIds.set(user.sheet_name, user.id);
              memberNames.set(user.sheet_name, user.name);
              
              // 特殊文字や改行を除去した値でも検索できるように
              const cleanedSheetName = user.sheet_name.replace(/[\n（）()]/g, '').trim();
              if (cleanedSheetName !== user.sheet_name) {
                memberIds.set(cleanedSheetName, user.id);
                memberNames.set(cleanedSheetName, user.name);
              }
            }
            
            // 名前でもマッピング（代替手段として）
            if (user.name) {
              memberIds.set(user.name, user.id);
              // 特殊文字や改行を除去
              const cleanedName = user.name.replace(/[\n（）()]/g, '').trim();
              if (cleanedName !== user.name) {
                memberIds.set(cleanedName, user.id);
              }
            }
          });
        }
        
        console.log('ユーザーマッピング:', Object.fromEntries(memberIds));
        console.log('名前マッピング:', Object.fromEntries(memberNames));
        
        // データを変換（メンバーIDマップとメンバー名マップを渡す）
        const events = convertSheetDataToEvents(data.data, memberIds, memberNames);
        
        if (events.length === 0) {
          setSuccessMessage("インポート可能なデータがありませんでした");
          toast({
            title: "注意",
            description: "インポート可能なデータがありませんでした",
            variant: "default"
          });
          return;
        }
        
        // Supabaseの実際のテーブル名とフィールド名に合わせる
        const tableName = 'events'; // 正しいテーブル名
        
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