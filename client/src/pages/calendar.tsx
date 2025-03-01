import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { EventModal } from "@/components/calendar/event-modal";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <Tabs value={view} onValueChange={(v) => setView(v as "personal" | "team")}>
            <TabsList>
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card className="overflow-hidden border-t border-blue-100 shadow-lg">
          <CalendarHeader
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
          <CalendarGrid
            view={view}
            currentMonth={currentMonth}
            events={events || []}
            tasks={tasks || []}
            attendance={attendance || []}
            isLoading={isLoading}
            onDateSelect={setSelectedDate}
          />
        </Card>

        <AnimatePresence>
          {selectedDate && (
            <EventModal
              date={selectedDate}
              onClose={() => setSelectedDate(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
