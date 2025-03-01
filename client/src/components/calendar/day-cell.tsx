import { format } from "date-fns";
import { motion } from "framer-motion";
import { MapPin, Home, Clock, Calendar } from "lucide-react";
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
      <div className="min-h-[120px] bg-white/20 p-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <div className="mt-2 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: 0.98 }}
            onClick={onClick}
            className={`
              min-h-[120px] p-2 cursor-pointer transition-all
              ${isCurrentMonth ? "bg-white/30" : "bg-gray-50/20"}
              ${isToday ? "ring-1 ring-blue-400 ring-offset-1" : ""}
              hover:bg-blue-50/30
            `}
          >
            <div className={`
              font-medium mb-2 text-sm
              ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}
              ${isToday ? "text-blue-500" : ""}
            `}>
              {format(date, "d")}
            </div>

            <div className="space-y-1">
              {events.slice(0, 2).map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    flex items-center gap-1 text-xs p-1 rounded
                    ${event.workType === "office"
                      ? "bg-blue-100/40 text-blue-700"
                      : "bg-green-100/40 text-green-700"
                    }
                  `}
                >
                  {event.workType === "office" ? (
                    <MapPin className="h-3 w-3" />
                  ) : (
                    <Home className="h-3 w-3" />
                  )}
                  <span className="truncate">{event.title}</span>
                </motion.div>
              ))}

              {events.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{events.length - 2} more
                </div>
              )}

              {attendance && (
                <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100/30 p-1 rounded">
                  <Clock className="h-3 w-3" />
                  <span>
                    {attendance.attendanceLog?.[0]?.time &&
                      format(new Date(attendance.attendanceLog[0].time), "HH:mm")}
                  </span>
                </div>
              )}

              {tasks.length > 0 && (
                <div className="text-xs text-purple-700 bg-purple-100/30 p-1 rounded">
                  {tasks.length} task{tasks.length > 1 ? "s" : ""}
                </div>
              )}
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="right" className="p-4 max-w-[300px]">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm">{format(date, "M月d日 (E)")}</h3>
            </div>

            {events.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-500">スケジュール</h4>
                {events.map((event) => (
                  <div key={event.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      {event.workType === "office" ? (
                        <MapPin className="h-3 w-3 text-blue-500" />
                      ) : (
                        <Home className="h-3 w-3 text-green-500" />
                      )}
                      <span className="font-medium text-sm">{event.title}</span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-gray-500 pl-5">{event.description}</p>
                    )}
                    <div className="text-xs text-gray-500 pl-5">
                      {format(new Date(event.startTime), "HH:mm")} - 
                      {format(new Date(event.endTime), "HH:mm")}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-500">タスク</h4>
                {tasks.map((task) => (
                  <div key={task.id} className="text-sm">
                    • {task.title}
                  </div>
                ))}
              </div>
            )}

            {attendance && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-500">勤怠記録</h4>
                {attendance.attendanceLog?.map((log, index) => (
                  <div key={index} className="text-sm flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(log.time), "HH:mm")}</span>
                    <span className="text-xs text-gray-500">
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