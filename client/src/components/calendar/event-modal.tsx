import { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertEventSchema, type InsertEvent } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
}

export function EventModal({ date, onClose }: EventModalProps) {
  const [tab, setTab] = useState<"schedule" | "attendance" | "task">("schedule");
  const { toast } = useToast();

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

  const createEvent = useMutation({
    mutationFn: async (data: InsertEvent) => {
      await apiRequest("POST", "/api/events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "イベントを作成しました",
        description: "スケジュールが正常に追加されました。",
      });
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新規予定登録</DialogTitle>
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
              <form onSubmit={form.handleSubmit((data) => createEvent.mutate(data))} className="space-y-4">
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
                          <Input type="datetime-local" {...field} />
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
                          <Input type="datetime-local" {...field} />
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

        {/* Attendance and Task forms would go here */}
      </DialogContent>
    </Dialog>
  );
}