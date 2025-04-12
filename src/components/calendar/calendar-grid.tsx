'use client'

import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth } from "date-fns";
import { motion } from "framer-motion";
import { DayCell } from "./day-cell";
import type { Event, Task, Attendance } from "@/types/schema";

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
      className="grid grid-cols-7 divide-x divide-y divide-blue-100/20 bg-gradient-to-br from-white via-blue-50/10 to-indigo-50/10 rounded-lg shadow-sm border border-blue-100/50"
    >
      {paddedDays.map((_, i) => (
        <div key={`pad-${i}`} className="bg-gradient-to-br from-gray-50/30 to-gray-50/10 h-32 md:h-36 lg:h-40" />
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
          onSelect={() => onDateSelect(day)}
          view={view}
        />
      ))}
    </motion.div>
  );
} 