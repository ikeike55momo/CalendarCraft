import { useState, useEffect } from "react";
import { format, differenceInMinutes, parseISO, addDays } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dataService } from "@/lib/dataService";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Session, User } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";

type AttendanceLogEntry = {
  type: "check_in" | "check_out" | "break_start" | "break_end";
  time: string;
};

type Attendance = {
  id?: string;
  user_id: string;
  date: string;
  attendance_log: AttendanceLogEntry[];
  created_at?: string;
  updated_at?: string;
};

// 勤務時間計算用の型
type WorkTimeCalculation = {
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  actualWorkMinutes: number;
  formattedWorkTime: string;
  formattedBreakTime: string;
  formattedActualWorkTime: string;
  checkInTime?: string;
  checkOutTime?: string;
};

export default function AttendancePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [manualTime, setManualTime] = useState<string>(format(new Date(), "HH:mm"));
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [weeklyWorkTime, setWeeklyWorkTime] = useState<number>(0);
  const [monthlyWorkTime, setMonthlyWorkTime] = useState<number>(0);

  // セッション情報の取得
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      setSession(authSession);
      setUser(authSession?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, authSession: Session | null) => {
      setSession(authSession);
      setUser(authSession?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 勤怠データの取得
  const { data: attendanceResponse, isLoading } = useQuery({
    queryKey: ["attendance", user?.id],
    queryFn: () => dataService.attendance.getByUserId(user?.id || ""),
    enabled: !!user?.id,
  });

  // データの配列部分を取得
  const attendanceData = attendanceResponse?.data || [];

  // 選択した日付の勤怠データ
  const selectedDateAttendance = attendanceData.find(
    (a: Attendance) => a.date === format(selectedDate, "yyyy-MM-dd")
  );

  // 勤務時間の計算
  const calculateWorkTime = (attendanceLog: AttendanceLogEntry[]): WorkTimeCalculation => {
    if (!attendanceLog || attendanceLog.length === 0) {
      return {
        totalWorkMinutes: 0,
        totalBreakMinutes: 0,
        actualWorkMinutes: 0,
        formattedWorkTime: "00:00",
        formattedBreakTime: "00:00",
        formattedActualWorkTime: "00:00"
      };
    }

    // 日付文字列を作成（現在の日付を使用）
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    
    // 出勤・退勤時間を取得
    const checkInEntry = attendanceLog.find(log => log.type === "check_in");
    const checkOutEntry = attendanceLog.find(log => log.type === "check_out");
    
    let totalWorkMinutes = 0;
    if (checkInEntry && checkOutEntry) {
      const checkInTime = parseISO(`${dateStr}T${checkInEntry.time}`);
      const checkOutTime = parseISO(`${dateStr}T${checkOutEntry.time}`);
      totalWorkMinutes = differenceInMinutes(checkOutTime, checkInTime);
    }
    
    // 休憩時間を計算
    let totalBreakMinutes = 0;
    let breakStart: Date | null = null;
    
    attendanceLog.forEach(log => {
      if (log.type === "break_start") {
        breakStart = parseISO(`${dateStr}T${log.time}`);
      } else if (log.type === "break_end" && breakStart) {
        const breakEnd = parseISO(`${dateStr}T${log.time}`);
        totalBreakMinutes += differenceInMinutes(breakEnd, breakStart);
        breakStart = null;
      }
    });
    
    // 実働時間（総勤務時間 - 休憩時間）
    const actualWorkMinutes = Math.max(0, totalWorkMinutes - totalBreakMinutes);
    
    // 時間のフォーマット（HH:MM形式）
    const formatMinutes = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };
    
    return {
      totalWorkMinutes,
      totalBreakMinutes,
      actualWorkMinutes,
      formattedWorkTime: formatMinutes(totalWorkMinutes),
      formattedBreakTime: formatMinutes(totalBreakMinutes),
      formattedActualWorkTime: formatMinutes(actualWorkMinutes),
      checkInTime: checkInEntry?.time,
      checkOutTime: checkOutEntry?.time
    };
  };

  // 週間・月間の勤務時間集計
  useEffect(() => {
    if (attendanceData && attendanceData.length > 0) {
      const now = new Date();
      const startOfWeek = addDays(now, -7); // 過去7日間
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // 今月の初日
      
      let weeklyMinutes = 0;
      let monthlyMinutes = 0;
      
      attendanceData.forEach((attendance: Attendance) => {
        const attendanceDate = new Date(attendance.date);
        const workTime = calculateWorkTime(attendance.attendance_log);
        
        // 週間集計
        if (attendanceDate >= startOfWeek && attendanceDate <= now) {
          weeklyMinutes += workTime.actualWorkMinutes;
        }
        
        // 月間集計
        if (attendanceDate >= startOfMonth && attendanceDate <= now) {
          monthlyMinutes += workTime.actualWorkMinutes;
        }
      });
      
      setWeeklyWorkTime(weeklyMinutes);
      setMonthlyWorkTime(monthlyMinutes);
    }
  }, [attendanceData]);

  // 勤怠データの作成・更新
  const upsertAttendance = useMutation({
    mutationFn: (data: Partial<Attendance>) => {
      if (selectedDateAttendance) {
        return dataService.attendance.upsert({
          ...selectedDateAttendance,
          ...data,
        });
      } else {
        return dataService.attendance.upsert({
          user_id: user?.id || "",
          date: format(selectedDate, "yyyy-MM-dd"),
          attendance_log: data.attendance_log || [],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({
        title: "勤怠を記録しました",
        description: `${format(selectedDate, "yyyy年MM月dd日")}の勤怠を記録しました。`,
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: "勤怠の記録に失敗しました。",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // 勤怠記録の追加
  const handleAddAttendanceLog = (type: "check_in" | "check_out" | "break_start" | "break_end") => {
    const timeStr = `${manualTime}:00`;
    
    const updatedLog = [
      ...(selectedDateAttendance?.attendance_log || []),
      { type, time: timeStr }
    ];
    
    upsertAttendance.mutate({
      attendance_log: updatedLog
    });
  };

  // 勤怠ログの表示名
  const getLogTypeName = (type: string) => {
    switch (type) {
      case "check_in": return "出勤";
      case "check_out": return "退勤";
      case "break_start": return "休憩開始";
      case "break_end": return "休憩終了";
      default: return type;
    }
  };

  // 選択した日の勤務時間計算
  const selectedDateWorkTime = selectedDateAttendance 
    ? calculateWorkTime(selectedDateAttendance.attendance_log)
    : null;

  // 時間のフォーマット（HH:MM形式）
  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">勤怠管理</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>日付選択</CardTitle>
              <CardDescription>勤怠を記録する日付を選択してください</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>勤務時間集計</CardTitle>
              <CardDescription>期間ごとの勤務時間</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">今週の勤務時間:</span>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {formatMinutes(weeklyWorkTime)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">今月の勤務時間:</span>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {formatMinutes(monthlyWorkTime)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>{format(selectedDate, "yyyy年MM月dd日")}の勤怠</CardTitle>
            <CardDescription>勤怠の記録と確認</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="record" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="record">勤怠記録</TabsTrigger>
                <TabsTrigger value="history">記録履歴</TabsTrigger>
                <TabsTrigger value="summary">勤務時間</TabsTrigger>
              </TabsList>
              
              <TabsContent value="record" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="time-input">時間</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="time-input"
                      type="time"
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Button 
                    onClick={() => handleAddAttendanceLog("check_in")}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    出勤
                  </Button>
                  <Button 
                    onClick={() => handleAddAttendanceLog("check_out")}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    退勤
                  </Button>
                  <Button 
                    onClick={() => handleAddAttendanceLog("break_start")}
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                  >
                    休憩開始
                  </Button>
                  <Button 
                    onClick={() => handleAddAttendanceLog("break_end")}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    休憩終了
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="history">
                {isLoading ? (
                  <div className="text-center py-4">読み込み中...</div>
                ) : selectedDateAttendance?.attendance_log && selectedDateAttendance.attendance_log.length > 0 ? (
                  <div className="space-y-2">
                    <div className="rounded-md border">
                      <div className="grid grid-cols-2 bg-muted p-3 font-medium">
                        <div>種類</div>
                        <div>時間</div>
                      </div>
                      {selectedDateAttendance.attendance_log.map((log: AttendanceLogEntry, index: number) => (
                        <div key={index} className="grid grid-cols-2 p-3 border-t">
                          <div>{getLogTypeName(log.type)}</div>
                          <div>{log.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    この日の勤怠記録はありません
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="summary">
                {isLoading ? (
                  <div className="text-center py-4">読み込み中...</div>
                ) : selectedDateWorkTime ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-md border p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">出勤時間</h3>
                        <p className="text-2xl font-bold">{selectedDateWorkTime.checkInTime || "未記録"}</p>
                      </div>
                      <div className="rounded-md border p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">退勤時間</h3>
                        <p className="text-2xl font-bold">{selectedDateWorkTime.checkOutTime || "未記録"}</p>
                      </div>
                    </div>
                    
                    <div className="rounded-md border p-4 space-y-4">
                      <h3 className="text-lg font-medium">勤務時間集計</h3>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-muted-foreground">総勤務時間:</div>
                        <div className="text-sm font-medium">{selectedDateWorkTime.formattedWorkTime}</div>
                        
                        <div className="text-sm text-muted-foreground">休憩時間:</div>
                        <div className="text-sm font-medium">{selectedDateWorkTime.formattedBreakTime}</div>
                        
                        <div className="text-sm text-muted-foreground">実働時間:</div>
                        <div className="text-sm font-medium">{selectedDateWorkTime.formattedActualWorkTime}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    この日の勤務時間データはありません
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>勤怠履歴</CardTitle>
          <CardDescription>過去の勤怠記録</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">読み込み中...</div>
          ) : attendanceData && attendanceData.length > 0 ? (
            <div className="rounded-md border">
              <div className="grid grid-cols-3 bg-muted p-3 font-medium">
                <div>日付</div>
                <div>記録</div>
                <div>勤務時間</div>
              </div>
              {attendanceData
                .sort((a: Attendance, b: Attendance) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((attendance: Attendance) => {
                  const workTime = calculateWorkTime(attendance.attendance_log);
                  return (
                    <div key={attendance.id} className="grid grid-cols-3 p-3 border-t">
                      <div>{format(new Date(attendance.date), "yyyy年MM月dd日")}</div>
                      <div>
                        {attendance.attendance_log && attendance.attendance_log.length > 0 ? (
                          <div className="space-y-1">
                            {attendance.attendance_log.map((log: AttendanceLogEntry, index: number) => (
                              <div key={index} className="text-sm">
                                {getLogTypeName(log.type)}: {log.time}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">記録なし</span>
                        )}
                      </div>
                      <div>
                        <div className="space-y-1">
                          <div className="text-sm">実働: {workTime.formattedActualWorkTime}</div>
                          <div className="text-sm text-muted-foreground">休憩: {workTime.formattedBreakTime}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              勤怠記録はありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 