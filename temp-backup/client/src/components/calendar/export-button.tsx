import { useState } from "react";
import { Calendar, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format, addDays } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

/**
 * Google Calendar Export Button Component
 * 
 * ユーザーのスケジュールをGoogleカレンダーにエクスポートする機能を提供します。
 * 連携ボタンを押すと、ユーザーのGoogle Calendarに「わどチーム」という新しいカレンダーを作成し、
 * 20日分の予定をエクスポートします。
 */
export function GoogleCalendarExportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [includePersonalEvents, setIncludePersonalEvents] = useState(true);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [exportProgress, setExportProgress] = useState(0);

  // エクスポート処理（実際の実装ではGoogle Calendar APIを使用）
  const handleExport = async () => {
    // APIリクエストをシミュレート
    setIsExporting(true);
    setExportProgress(0);
    
    // プログレスバーのアニメーション（実際はAPIの進捗に合わせる）
    const interval = setInterval(() => {
      setExportProgress(prev => {
        const next = prev + 10;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsExporting(false);
            setExportSuccess(true);
            
            // 成功メッセージを3秒後に閉じる
            setTimeout(() => {
              setIsOpen(false);
              setExportSuccess(false);
              setExportProgress(0);
            }, 3000);
          }, 500);
          return 100;
        }
        return next;
      });
    }, 300);
  };

  // 今日から20日間の日付範囲を取得
  const getDateRange = () => {
    const today = new Date();
    const endDate = addDays(today, 20);
    return `${format(today, "yyyy/MM/dd")} 〜 ${format(endDate, "yyyy/MM/dd")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800">
          <Calendar className="h-4 w-4" />
          Googleカレンダーに連携
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Googleカレンダーにエクスポート</DialogTitle>
          <DialogDescription>
            あなたの予定をGoogleカレンダーに「わどチーム」という名前で新しく作成された
            カレンダーにエクスポートします。
          </DialogDescription>
        </DialogHeader>

        {!isExporting && !exportSuccess ? (
          <>
            <div className="py-4 space-y-4">
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <h3 className="text-sm font-medium text-blue-900 mb-1">エクスポート範囲</h3>
                <p className="text-sm text-blue-800">
                  {getDateRange()}（20日間）の予定がエクスポートされます。
                </p>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium">エクスポート内容</h3>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="includePersonalEvents" 
                    checked={includePersonalEvents}
                    onCheckedChange={(checked) => setIncludePersonalEvents(!!checked)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="includePersonalEvents">予定（出勤/テレワーク）</Label>
                    <p className="text-sm text-muted-foreground">
                      カレンダーに登録されている出勤・テレワーク情報
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="includeTasks" 
                    checked={includeTasks}
                    onCheckedChange={(checked) => setIncludeTasks(!!checked)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="includeTasks">タスク</Label>
                    <p className="text-sm text-muted-foreground">
                      担当しているタスクの期限情報
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border bg-yellow-50 p-4 border-yellow-200">
                <div className="flex gap-3">
                  <div className="text-yellow-700">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5.99999V13.1667M12 17.1667V17.25M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-yellow-800">注意</h3>
                    <p className="text-sm mt-1 text-yellow-700">
                      既存のエクスポート内容は上書きされます。変更があった場合は再度エクスポートしてください。
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>キャンセル</Button>
              <Button onClick={handleExport}>エクスポート</Button>
            </DialogFooter>
          </>
        ) : exportSuccess ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-medium text-center">エクスポート完了</h3>
            <p className="text-center text-gray-500 mt-2">
              Googleカレンダーに正常にエクスポートされました。
            </p>
          </div>
        ) : (
          <div className="py-10 flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-xl font-medium text-center">エクスポート中...</h3>
            <p className="text-center text-gray-500 mt-2 mb-4">
              Googleカレンダーと連携しています。しばらくお待ちください。
            </p>
            <div className="w-full max-w-xs">
              <Progress value={exportProgress} className="h-2" />
              <p className="text-xs text-center mt-2 text-gray-500">{exportProgress}%</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 