import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth } from "date-fns";
import { motion } from "framer-motion";
import { DayCell } from "./day-cell";
import type { Event, Task, Attendance } from "@shared/schema";

interface CalendarGridProps {
  view: "personal" | "team";
  currentMonth: Date;
  events: Event[];
  tasks: Task[];
  attendance: Attendance[];
  isLoading: boolean;
  onDateSelect: (date: Date) => void;
}

export function CalendarGrid({
  view,
  currentMonth,
  events,
  tasks,
  attendance,
  isLoading,
  onDateSelect,
}: CalendarGridProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the days array to start on Sunday
  const startDay = monthStart.getDay();
  const paddedDays = Array(startDay).fill(null);

  return (
    <motion.div
      layout
      className="grid grid-cols-7 gap-px bg-blue-50/50"
    >
      {paddedDays.map((_, i) => (
        <div key={`pad-${i}`} className="bg-gray-50/20 h-32" />
      ))}

      {days.map((day) => (
        <DayCell
          key={format(day, "yyyy-MM-dd")}
          date={day}
          isCurrentMonth={isSameMonth(day, currentMonth)}
          events={events.filter(e => format(new Date(e.startTime), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))}
          tasks={tasks.filter(t => t.dueDate && format(new Date(t.dueDate), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))}
          attendance={attendance.find(a => format(new Date(a.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))}
          isLoading={isLoading}
          isTeamView={view === "team"}
          onClick={() => onDateSelect(day)}
        />
      ))}
    </motion.div>
  );
}