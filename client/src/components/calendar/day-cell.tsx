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
      <div className="h-32 bg-white p-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <div className="mt-2 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        h-32 bg-white p-2 cursor-pointer transition-colors
        ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}
        hover:bg-blue-50
      `}
    >
      <div className="font-medium">{format(date, "d")}</div>

      <div className="mt-1 space-y-1">
        {events.map((event) => (
          <Tooltip key={event.id}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs">
                {event.workType === "office" ? (
                  <MapPin className="h-3 w-3 text-blue-500" />
                ) : (
                  <Home className="h-3 w-3 text-green-500" />
                )}
                <span className="truncate">{event.title}</span>
              </div>
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
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="h-3 w-3" />
            <span>
              {attendance.attendanceLog?.[0]?.time &&
                format(new Date(attendance.attendanceLog[0].time), "HH:mm")}
            </span>
          </div>
        )}

        {tasks.length > 0 && (
          <div className="text-xs text-gray-600">
            {tasks.length} task{tasks.length > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </motion.div>
  );
}
