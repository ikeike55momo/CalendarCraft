import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { adminService } from "@/lib/adminService";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// GASのWebアプリURLと認証キーを環境変数から取得
const GAS_API_URL = import.meta.env.VITE_GAS_API_URL || 'https://script.google.com/macros/s/AKfycbxsva5mdKNLFYosW-1cgt6LVItPEs-gGcIB-21YS2zZIhaxac17M3EZPj0oqvKq2-ly/exec';
const API_KEY = import.meta.env.VITE_GAS_API_KEY || 'app-schedule-ririaru';

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

// スキップするメンバー名のリスト
const SKIP_MEMBERS = ['わど'];

// ユーザーデータをハードコード（一時的な対応）
const MOCK_USERS: User[] = [
  { id: 1, name: "山田太郎", email: "yamada@example.com", role: "admin", sheet_name: "ユーザー1", google_sub: "google_sub_1" },
  { id: 2, name: "佐藤花子", email: "sato@example.com", role: "member", sheet_name: "ユーザー2", google_sub: "google_sub_2" },
  { id: 3, name: "鈴木一郎", email: "suzuki@example.com", role: "member", sheet_name: "ユーザー3", google_sub: "google_sub_3" },
  { id: 4, name: "太田", email: "ota@example.com", role: "admin", sheet_name: "太田\n（金）", google_sub: "9cfe0821-c3e6-493f-b38a-8ce293222b62" },
  { id: 13, name: "いさた", email: "isata@example.com", role: "member", sheet_name: "いさた\n（三井）", google_sub: "pre_registered_1740930828651" },
  { id: 14, name: "がみ", email: "gami@example.com", role: "member", sheet_name: "がみ", google_sub: "pre_registered_1740969805411" },
  { id: 15, name: "レールマン", email: "railman@example.com", role: "member", sheet_name: "レールマン\n（中井）", google_sub: "pre_registered_1740969849667" },
  { id: 16, name: "ゆき", email: "yuki@example.com", role: "member", sheet_name: "ゆき", google_sub: "pre_registered_1740969871192" },
  { id: 17, name: "小林", email: "kobayashi@example.com", role: "member", sheet_name: "小林", google_sub: "pre_registered_1740969888810" },
  { id: 18, name: "月井", email: "tsukii@example.com", role: "member", sheet_name: "月井\n（月）", google_sub: "pre_registered_1740969918891" },
  { id: 19, name: "是永", email: "korenaga@example.com", role: "member", sheet_name: "是永", google_sub: "pre_registered_1740969934173" },
  { id: 20, name: "田島", email: "tajima@example.com", role: "member", sheet_name: "田島", google_sub: "pre_registered_1740969994421" },
  { id: 21, name: "宮城", email: "miyagi@example.com", role: "member", sheet_name: "宮城", google_sub: "pre_registered_1740970012558" }
];

const SpreadsheetImport: React.FC = () => {
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingSheets, setFetchingSheets] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const [selectedMonthToDelete, setSelectedMonthToDelete] = useState<string>('');
  const [deletingEvents, setDeletingEvents] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    
    const events: any[] = [];
    
    try {
      // データ構造の詳細なデバッグ
      console.log("=== データ構造の詳細 ===");
      
      // データ内の各オブジェクトの値を確認（最初の10件）
      for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const item = rawData[i];
        console.log(`データ項目[${i}]:`, item);
        
        if (typeof item === 'object' && item !== null) {
          Object.entries(item).forEach(([key, value]) => {
            console.log(`  キー: "${key}" => 値: "${value}" (型: ${typeof value})`);
          });
        }
      }
      
      // GASから取得したデータの処理
      // 各ユーザーごとにデータを処理
      for (const userItem of rawData) {
        // _userキーにはユーザー名が入っている
        const memberName = userItem._user;
        
        if (!memberName || typeof memberName !== 'string' || SKIP_MEMBERS.includes(memberName)) {
          continue; // スキップすべきメンバーや無効なデータはスキップ
        }
        
        console.log(`メンバー処理: ${memberName}`);
        
        // ユーザーIDとマッピングをチェック
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
          
          // メンバー名から括弧内の文字を除去したバージョンも試す
          const nameWithoutParentheses = memberName.replace(/[（）()\n].*$/g, '').trim();
          
          // 部分一致検索
          if (memberIds) {
            // Map上のすべてのキーに対して部分一致をチェック
            let matched = false;
            
            // MapIteratorではなく配列に変換して反復処理
            Array.from(memberIds.entries()).some(([key, id]) => {
              // キーに指定された名前が含まれている、または逆に含まれている場合
              if (
                key.includes(cleanedMemberName) || 
                cleanedMemberName.includes(key) || 
                key.includes(nameWithoutParentheses) || 
                nameWithoutParentheses.includes(key)
              ) {
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
        
        // このユーザーの勤務情報を処理
        let foundWorkInfo = false;
        
        // 各日付キーを処理
        for (const [key, value] of Object.entries(userItem)) {
          // _userキーはスキップ
          if (key === '_user' || key === '_noWorkInfo') continue;
          
          // valueが勤務形態を示す文字列
          const workTypeValue = value as string;
          
          try {
            // 日付の解析
            const dateObj = new Date(key);
            
            if (isNaN(dateObj.getTime())) {
              console.error("無効な日付:", key);
              continue; // 無効な日付はスキップ
            }
            
            console.log(`日付処理: ${key}, 勤務形態: ${workTypeValue}`);
            
            // 勤務形態の判定
            const lowerWorkType = workTypeValue.toLowerCase();
            const isOfficeWork = lowerWorkType.includes('出社') || 
                               lowerWorkType.includes('出勤') || 
                               lowerWorkType === '出';
            const isTelework = lowerWorkType.includes('テレ') || 
                             lowerWorkType.includes('リモート');
            
            // 有効な勤務形態の場合のみイベントを作成
            if (isOfficeWork || isTelework) {
              foundWorkInfo = true;
              const formattedDate = dateObj.toISOString().split('T')[0];
              const title = isOfficeWork ? '出勤' : 'テレワーク';
              const actualWorkType = isOfficeWork ? '出社' : 'テレ';
              
              // イベントを作成
              const event = {
                user_id: userId,
                title: title,
                description: `${realName}の予定 (シート: ${selectedSheet})`,
                start_time: `${formattedDate}T09:00:00`,
                end_time: `${formattedDate}T18:00:00`,
                work_type: actualWorkType,
              };
              
              events.push(event);
              console.log(`イベント作成: ${formattedDate} - ${realName} - ${title}`);
            } else if (workTypeValue === '休み') {
              // 休みは記録しない
              console.log(`スキップ: "${workTypeValue}" は休みです`);
            } else if (workTypeValue === '') {
              // 空欄は休みとして扱う
              console.log(`スキップ: "${workTypeValue}" は空欄（休み）です`);
            } else {
              console.log(`スキップ: "${workTypeValue}" は有効な勤務形態ではありません`);
            }
          } catch (e) {
            console.error('日付の処理中にエラーが発生:', e);
          }
        }
        
        if (!foundWorkInfo) {
          console.warn(`${memberName} の勤務情報が見つかりませんでした`);
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
      // キャッシュ回避のためのタイムスタンプを追加
      const timestamp = new Date().getTime();
      const url = `${GAS_API_URL}?apiKey=${API_KEY}&action=getSheetNames&_=${timestamp}`;
      console.log('シート名取得リクエスト:', url);
      
      // CORSヘッダーを設定
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
      
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
      // キャッシュ回避のためのタイムスタンプを追加
      const timestamp = new Date().getTime();
      const url = `${GAS_API_URL}?apiKey=${API_KEY}&sheetName=${encodeURIComponent(selectedSheet)}&_=${timestamp}`;
      console.log('データインポートリクエスト:', url);
      
      // CORSヘッダーを設定
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
      
      const data = await response.json();
      console.log('データインポートレスポンス:', data);
      
      // データ構造を詳しく調査
      if (data.data && data.data.length > 0) {
        console.log('最初の5件のデータサンプル:');
        for (let i = 0; i < Math.min(5, data.data.length); i++) {
          const item = data.data[i];
          console.log(`データ[${i}]:`, item);
          console.log(`データ[${i}]のキー:`, Object.keys(item));
          console.log(`データ[${i}]の値の数:`, Object.keys(item).length);
          
          // 各キーの値を表示
          Object.entries(item).forEach(([key, value]) => {
            console.log(`  ${key} => ${value}`);
          });
        }
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.success && data.data) {
        // usersテーブルのRLSエラーを回避するためモックデータを使用
        const users = MOCK_USERS;
        
        // 確認のために詳細なユーザーデータを出力
        console.log("すべてのユーザー:", users);
        console.log("取得したユーザー数:", users?.length || 0);
        
        // メンバーIDマップを作成（sheet_nameとユーザーIDのマッピング）
        const memberIds = new Map<string, number>();
        const memberNames = new Map<string, string>(); // sheet_nameから実際の名前へのマッピング
        
        if (users) {
          users.forEach((user: User) => {
            // ユーザー情報をログに出力
            console.log(`ユーザー情報: ID=${user.id}, Name=${user.name}, SheetName=${user.sheet_name || 'なし'}`);
            
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
              
              // 部分一致のための追加キー（括弧内の文字を除去）
              const nameWithoutParentheses = user.sheet_name.replace(/[（）()\n].*$/g, '').trim();
              if (nameWithoutParentheses !== user.sheet_name && nameWithoutParentheses !== cleanedSheetName) {
                memberIds.set(nameWithoutParentheses, user.id);
                memberNames.set(nameWithoutParentheses, user.name);
              }
            }
            
            // 名前でもマッピング（代替手段として）
            if (user.name) {
              memberIds.set(user.name, user.id);
              // 特殊文字や改行を除去
              const cleanedName = user.name.replace(/[\n（）()]/g, '').trim();
              if (cleanedName !== user.name) {
                memberIds.set(cleanedName, user.id);
                memberNames.set(cleanedName, user.name);
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
        
        // RLSポリシーが変更されたため、直接Supabaseを使用
        const { error: insertError } = await supabase
          .from('events')
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

  // 月別に削除するイベントの開始日を計算
  const getMonthDates = (month: string): {startDate: string, endDate: string} => {
    if (!month) return {startDate: '', endDate: ''};
    
    // 月の形式は "YYYYMM" と仮定
    const year = parseInt(month.substring(0, 4));
    const monthIndex = parseInt(month.substring(4, 6)) - 1; // JavaScriptの月は0-11
    
    // 月の初日
    const startDate = new Date(year, monthIndex, 1);
    // 次の月の初日 - 1日 = 月の最終日
    const endDate = new Date(year, monthIndex + 1, 0);
    
    // ISO形式の日付文字列に変換 (YYYY-MM-DD)
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // 選択した月のイベントを削除
  const deleteEventsByMonth = async () => {
    if (!selectedMonthToDelete) {
      toast({
        title: "エラー",
        description: "削除する月を指定してください",
        variant: "destructive"
      });
      return;
    }

    try {
      setDeletingEvents(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      const { startDate, endDate } = getMonthDates(selectedMonthToDelete);
      
      // 削除範囲の条件を作成
      const startDateTime = `${startDate}T00:00:00`;
      const endDateTime = `${endDate}T23:59:59`;
      
      console.log(`削除範囲: ${startDateTime} から ${endDateTime}`);
      
      // Supabaseで該当期間のイベントを削除
      const { data, error, count } = await supabase
        .from('events')
        .delete()
        .gte('start_time', startDateTime)
        .lte('start_time', endDateTime)
        .select();
      
      if (error) {
        throw new Error(`イベントの削除に失敗しました: ${error.message}`);
      }
      
      // 削除された件数を表示
      const deletedCount = data?.length || 0;
      setSuccessMessage(`${selectedMonthToDelete}の${deletedCount}件のイベントを削除しました`);
      toast({
        title: "成功",
        description: `${selectedMonthToDelete}の${deletedCount}件のイベントを削除しました`,
        variant: "default"
      });
      
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('イベント削除エラー:', error);
      setErrorMessage(error instanceof Error ? error.message : "イベントの削除に失敗しました");
      toast({
        title: "エラー",
        description: "イベントの削除に失敗しました",
        variant: "destructive"
      });
    } finally {
      setDeletingEvents(false);
    }
  };

  // 月の選択肢を生成（現在月から前後6ヶ月分）
  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    // 6ヶ月前から6ヶ月後まで
    for (let i = -6; i <= 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const value = `${year}${month}`;
      const label = `${year}年${month}月`;
      
      options.push({ value, label });
    }
    
    return options;
  };

  return (
    <>
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
              スクリプトID: <code>AKfycbxsva5mdKNLFYosW-1cgt6LVItPEs-gGcIB-21YS2zZIhaxac17M3EZPj0oqvKq2-ly</code>
            </p>
            <p className="mt-1">
              エラーが発生する場合は、APIキーが正しく設定されているか確認してください。
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>月別イベント削除</CardTitle>
          <CardDescription>
            特定の月のすべてのイベント（予定）を一括削除します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="month-select">削除する月</Label>
            <Select value={selectedMonthToDelete} onValueChange={setSelectedMonthToDelete}>
              <SelectTrigger>
                <SelectValue placeholder="月を選択" />
              </SelectTrigger>
              <SelectContent>
                {generateMonthOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogTrigger asChild>
              <Button 
                variant="destructive" 
                disabled={!selectedMonthToDelete || deletingEvents}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {selectedMonthToDelete ? `${selectedMonthToDelete.substring(0, 4)}年${selectedMonthToDelete.substring(4, 6)}月のイベントを削除` : 'イベントを削除'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>削除の確認</DialogTitle>
                <DialogDescription>
                  {selectedMonthToDelete && `${selectedMonthToDelete.substring(0, 4)}年${selectedMonthToDelete.substring(4, 6)}月のすべてのイベントを削除しますか？`}
                  <p className="mt-2 text-red-500 font-medium">この操作は元に戻せません。</p>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>キャンセル</Button>
                <Button 
                  variant="destructive" 
                  onClick={deleteEventsByMonth}
                  disabled={deletingEvents}
                >
                  {deletingEvents ? '削除中...' : '削除する'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <p className="text-sm text-muted-foreground mt-2">
            注意: 削除したイベントは復元できません。慎重に操作してください。
          </p>
        </CardContent>
      </Card>
    </>
  );
};

export default SpreadsheetImport; 