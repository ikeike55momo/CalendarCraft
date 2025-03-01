import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { EventModal } from "@/components/calendar/event-modal";
import { GoogleCalendarExportButton } from "@/components/calendar/export-button";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Event, Task, Attendance } from "@shared/schema";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<"personal" | "team">("personal");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", format(currentMonth, "yyyy-MM")],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", format(currentMonth, "yyyy-MM")],
  });

  const { data: attendance, isLoading: attendanceLoading } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance", format(currentMonth, "yyyy-MM")],
  });

  const isLoading = eventsLoading || tasksLoading || attendanceLoading;

  // 選択された日付のイベントをフィルタリング
  const selectedDateEvents = selectedDate && events 
    ? events.filter(e => format(new Date(e.startTime), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")) 
    : [];

  return (
    <div className="w-full transition-all duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full mx-auto space-y-6"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <motion.h2 
            key={format(currentMonth, "MMMM yyyy")}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-gray-900"
          >
            {format(currentMonth, "MMMM")}
            <span className="text-gray-500 ml-2">{format(currentMonth, "yyyy")}</span>
          </motion.h2>

          <div className="flex items-center gap-3">
            <CalendarHeader
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              view={view}
              setView={setView}
            />
            <GoogleCalendarExportButton />
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" />
              予定追加
            </Button>
          </div>
        </div>

        <CalendarGrid
          view={view}
          currentMonth={currentMonth}
          events={events || []}
          tasks={tasks || []}
          attendance={attendance || []}
          isLoading={isLoading}
          onDateSelect={setSelectedDate}
        />

        <AnimatePresence>
          {selectedDate && (
            <EventModal
              date={selectedDate}
              onClose={() => setSelectedDate(null)}
              events={selectedDateEvents}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}