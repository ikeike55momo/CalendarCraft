import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

const SpreadsheetImport: React.FC = () => {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingSheets, setFetchingSheets] = useState(false);
  const { toast } = useToast();

  // スプレッドシートIDが変更されたときにシート名を取得
  const handleSpreadsheetIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpreadsheetId(e.target.value);
    setSheetNames([]);
    setSelectedSheet('');
  };

  // シート名一覧を取得
  const fetchSheetNames = async () => {
    if (!spreadsheetId) {
      toast({
        title: "エラー",
        description: "スプレッドシートIDを入力してください",
        variant: "destructive"
      });
      return;
    }

    setFetchingSheets(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-sheet-names', {
        body: { spreadsheetId }
      });

      if (error) throw error;
      
      if (data && data.sheetNames) {
        setSheetNames(data.sheetNames);
        if (data.sheetNames.length > 0) {
          setSelectedSheet(data.sheetNames[0]);
        }
      }
    } catch (error) {
      console.error('シート名の取得に失敗しました:', error);
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
    if (!spreadsheetId || !selectedSheet) {
      toast({
        title: "エラー",
        description: "スプレッドシートIDとシート名を指定してください",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const range = `${selectedSheet}!A2:E`; // ヘッダーを除く範囲
      
      const { data, error } = await supabase.functions.invoke('import-sheets', {
        body: { spreadsheetId, range }
      });

      if (error) throw error;
      
      toast({
        title: "成功",
        description: `${data.count}件のデータをインポートしました`,
        variant: "default"
      });
    } catch (error) {
      console.error('インポートに失敗しました:', error);
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
        <div className="space-y-2">
          <Label htmlFor="spreadsheet-id">スプレッドシートID</Label>
          <div className="flex gap-2">
            <Input
              id="spreadsheet-id"
              placeholder="スプレッドシートIDを入力"
              value={spreadsheetId}
              onChange={handleSpreadsheetIdChange}
            />
            <Button 
              onClick={fetchSheetNames} 
              disabled={!spreadsheetId || fetchingSheets}
              variant="outline"
            >
              {fetchingSheets ? "取得中..." : "シート名を取得"}
            </Button>
          </div>
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
          disabled={!spreadsheetId || !selectedSheet || loading}
          className="w-full"
        >
          {loading ? "インポート中..." : "データをインポート"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SpreadsheetImport; 