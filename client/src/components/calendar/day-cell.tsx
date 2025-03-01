import { format } from "date-fns";
import { motion } from "framer-motion";
import { MapPin, Home, Clock } from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger,
  TooltipProvider 
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import type { Event, Task, Attendance } from "@shared/schema";

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  events: Event[];
  tasks: Task[];
  attendance?: Attendance;
  isLoading: boolean;
  isTeamView: boolean;
  onClick: () => void;
}

export function DayCell({
  date,
  isCurrentMonth,
  events,
  tasks,
  attendance,
  isLoading,
  isTeamView,
  onClick,
}: DayCellProps) {
  if (isLoading) {
    return (
      <div className="min-h-[140px] bg-white/20 p-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: 0.98 }}
            onClick={onClick}
            className={`
              min-h-[140px] p-4 cursor-pointer transition-all
              ${isCurrentMonth 
                ? "bg-gradient-to-br from-white to-blue-50/30" 
                : "bg-gradient-to-br from-gray-50/80 to-gray-50/30"}
              ${isToday 
                ? "ring-2 ring-blue-400 ring-inset bg-gradient-to-br from-blue-50 to-indigo-50/30" 
                : ""}
              hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50/50
              relative overflow-hidden
            `}
          >
            {/* 日付表示 */}
            <div className={`
              text-2xl font-bold mb-3 relative z-10
              ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}
              ${isToday ? "text-blue-500" : ""}
            `}>
              {format(date, "d")}
            </div>

            {/* イベントリスト */}
            <div className="space-y-1.5 relative z-10">
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    flex items-center gap-2 text-xs p-1.5 rounded-lg
                    ${event.workType === "office"
                      ? "bg-gradient-to-r from-blue-100/80 to-blue-50/80 text-blue-700"
                      : "bg-gradient-to-r from-green-100/80 to-green-50/80 text-green-700"
                    }
                  `}
                >
                  {event.workType === "office" ? (
                    <MapPin className="h-3 w-3" />
                  ) : (
                    <Home className="h-3 w-3" />
                  )}
                  <span className="truncate font-medium">{event.title}</span>
                </motion.div>
              ))}

              {attendance && (
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gradient-to-r from-gray-100/80 to-gray-50/80 p-1.5 rounded-lg">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">
                    {attendance.attendanceLog?.[0]?.time &&
                      format(new Date(attendance.attendanceLog[0].time), "HH:mm")}
                  </span>
                </div>
              )}

              {tasks.length > 0 && (
                <div className="text-xs font-medium text-purple-700 bg-gradient-to-r from-purple-100/80 to-purple-50/80 p-1.5 rounded-lg">
                  {tasks.length} タスク
                </div>
              )}
            </div>

            {/* 装飾的な背景要素 */}
            {isToday && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-200/20 to-transparent rounded-bl-full" />
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="right" className="p-4 max-w-[300px]">
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-2">
              <h3 className="font-semibold text-lg">{format(date, "M月d日")}</h3>
              <p className="text-sm text-gray-500">{format(date, "EEEE")}</p>
            </div>

            {events.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">スケジュール</h4>
                {events.map((event) => (
                  <div key={event.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      {event.workType === "office" ? (
                        <MapPin className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Home className="h-4 w-4 text-green-500" />
                      )}
                      <span className="font-medium">{event.title}</span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-500 pl-6">{event.description}</p>
                    )}
                    <div className="text-sm text-gray-500 pl-6">
                      {format(new Date(event.startTime), "HH:mm")} - 
                      {format(new Date(event.endTime), "HH:mm")}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">タスク</h4>
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    {task.title}
                  </div>
                ))}
              </div>
            )}

            {attendance && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">勤怠記録</h4>
                {attendance.attendanceLog?.map((log, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{format(new Date(log.time), "HH:mm")}</span>
                    <span className="text-gray-500">
                      {log.type === "check_in" ? "出勤" :
                       log.type === "check_out" ? "退勤" :
                       log.type === "break_start" ? "休憩開始" : "休憩終了"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}