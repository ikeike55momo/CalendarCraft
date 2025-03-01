import { format } from "date-fns";
import { motion } from "framer-motion";
import { MapPin, Home, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
        {events.map((event) => (
          <Tooltip key={event.id}>
            <TooltipTrigger asChild>
              <motion.div
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
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <div className="font-medium">{event.title}</div>
                <div className="text-xs text-gray-500">
                  {format(new Date(event.startTime), "HH:mm")} - 
                  {format(new Date(event.endTime), "HH:mm")}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

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
  );
}