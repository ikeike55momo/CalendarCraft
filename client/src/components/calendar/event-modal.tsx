import { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertEventSchema, type InsertEvent, insertAttendanceSchema, type InsertAttendance, insertTaskSchema, type InsertTask, type Project, type Event } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EventModalProps {
  date: Date;
  onClose: () => void;
  events: Event[];
}

export function EventModal({ date, onClose, events }: EventModalProps) {
  const [tab, setTab] = useState<"schedule" | "attendance" | "task">("schedule");
  const { toast } = useToast();
  const [manualTime, setManualTime] = useState<string | null>(null);

  const form = useForm<InsertEvent>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      startTime: format(date, "yyyy-MM-dd'T'09:00"),
      endTime: format(date, "yyyy-MM-dd'T'17:00"),
      workType: "office",
    },
  });

  const attendanceForm = useForm<InsertAttendance>({
    resolver: zodResolver(insertAttendanceSchema),
    defaultValues: {
      date: format(date, "yyyy-MM-dd"),
      attendanceLog: [],
    },
  });

  const taskForm = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      detail: "",
      dueDate: format(date, "yyyy-MM-dd"),
      status: "open",
    },
  });

  const createEvent = useMutation({
    mutationFn: async (data: InsertEvent) => {
      console.log("送信データ:", data);
      try {
        const response = await apiRequest("POST", "/api/events", data);
        console.log("APIレスポンス:", response);
        return response;
      } catch (error) {
        console.error("APIエラー:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("イベント作成成功");
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "イベントを作成しました",
        description: "スケジュールが正常に追加されました。",
      });
      onClose();
    },
    onError: (error) => {
      console.error("イベント作成エラー:", error);
      toast({
        title: "エラー",
        description: "イベントの作成に失敗しました。",
        variant: "destructive",
      });
    }
  });

  const createAttendance = useMutation({
    mutationFn: async (data: InsertAttendance) => {
      console.log("勤怠データ送信:", data);
      try {
        const response = await apiRequest("POST", "/api/attendance", data);
        console.log("勤怠APIレスポンス:", response);
        return response;
      } catch (error) {
        console.error("勤怠APIエラー:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({
        title: "勤怠情報を登録しました",
        description: "勤怠情報が正常に追加されました。",
      });
      onClose();
    },
    onError: (error) => {
      console.error("勤怠登録エラー:", error);
      toast({
        title: "エラー",
        description: "勤怠情報の登録に失敗しました。",
        variant: "destructive",
      });
    }
  });

  const createTask = useMutation({
    mutationFn: async (data: InsertTask) => {
      await apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "タスクを作成しました",
        description: "タスクが正常に追加されました。",
      });
      onClose();
    },
  });

  // プロジェクトリストを取得
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新規予定登録</DialogTitle>
          <DialogDescription>
            {format(date, "yyyy年MM月dd日")}の予定を登録します
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">スケジュール</TabsTrigger>
            <TabsTrigger value="attendance">勤怠</TabsTrigger>
            <TabsTrigger value="task">タスク</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === "schedule" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => {
                // 日付文字列をISOString形式に変換
                const formattedData = {
                  ...data,
                  // startTimeとendTimeはすでに文字列なので変換不要
                };
                console.log("送信データ:", formattedData);
                createEvent.mutate(formattedData);
              })} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>タイトル</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="予定のタイトルを入力" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>詳細</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="予定の詳細を入力"
                          className="min-h-[100px]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>開始時間</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            value={field.value || ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>終了時間</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            value={field.value || ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="workType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>勤務形態</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="勤務形態を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="office">出社</SelectItem>
                          <SelectItem value="remote">リモート</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        出社かリモートワークかを選択してください
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={createEvent.isPending}>
                  {createEvent.isPending ? "作成中..." : "予定を作成"}
                </Button>
              </form>
            </Form>
          </motion.div>
        )}

        {tab === "attendance" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <Form {...attendanceForm}>
              <form onSubmit={attendanceForm.handleSubmit((data) => {
                const now = new Date();
                const timeStr = manualTime || format(now, "HH:mm:ss");
                const type = document.querySelector<HTMLInputElement>('input[name="attendance-type"]:checked')?.value as "check_in" | "check_out" | "break_start" | "break_end";
                
                if (!type) {
                  toast({
                    title: "エラー",
                    description: "勤怠タイプを選択してください。",
                    variant: "destructive",
                  });
                  return;
                }
                
                // 必ず配列として扱う
                const currentLog = Array.isArray(data.attendanceLog) ? data.attendanceLog : [];
                
                const updatedLog = [
                  ...currentLog,
                  { type, time: timeStr }
                ];
                
                console.log("送信前の勤怠データ:", {
                  ...data,
                  attendanceLog: updatedLog
                });
                
                createAttendance.mutate({
                  ...data,
                  attendanceLog: updatedLog
                });
              })} className="space-y-4">
                <FormField
                  control={attendanceForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>日付</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>時間</FormLabel>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="time" 
                      id="manual-time" 
                      name="manual-time" 
                      className="w-full"
                      defaultValue={format(new Date(), "HH:mm")}
                      onChange={(e) => {
                        const manualTime = e.target.value + ":00";
                        setManualTime(manualTime);
                      }}
                    />
                    <div className="text-sm text-gray-500">
                      現在時刻を使用しない場合は時間を入力してください
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel>勤怠タイプ</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="check-in" name="attendance-type" value="check_in" className="h-4 w-4 text-blue-600" />
                      <label htmlFor="check-in" className="text-sm font-medium">出勤</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="check-out" name="attendance-type" value="check_out" className="h-4 w-4 text-blue-600" />
                      <label htmlFor="check-out" className="text-sm font-medium">退勤</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="break-start" name="attendance-type" value="break_start" className="h-4 w-4 text-blue-600" />
                      <label htmlFor="break-start" className="text-sm font-medium">休憩開始</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="break-end" name="attendance-type" value="break_end" className="h-4 w-4 text-blue-600" />
                      <label htmlFor="break-end" className="text-sm font-medium">休憩終了</label>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={createAttendance.isPending}>
                  {createAttendance.isPending ? "登録中..." : "勤怠を登録"}
                </Button>
              </form>
            </Form>
          </motion.div>
        )}

        {tab === "task" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <Form {...taskForm}>
              <form onSubmit={taskForm.handleSubmit((data) => createTask.mutate(data))} className="space-y-4">
                <FormField
                  control={taskForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>タスク名</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="タスク名を入力" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={taskForm.control}
                  name="detail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>詳細</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="タスクの詳細を入力"
                          className="min-h-[100px]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={taskForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>期限日</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={taskForm.control}
                  name="tag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>タグ</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="タグを入力" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={taskForm.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>プロジェクト</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="プロジェクトを選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">プロジェクトなし</SelectItem>
                          {projects?.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={createTask.isPending}>
                  {createTask.isPending ? "作成中..." : "タスクを作成"}
                </Button>
              </form>
            </Form>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}