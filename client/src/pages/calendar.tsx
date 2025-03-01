import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { EventModal } from "@/components/calendar/event-modal";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/30 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <motion.h1 
              key={format(currentMonth, "MMMM")}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent"
            >
              {format(currentMonth, "MMMM")}
              <span className="text-gray-400 ml-2 text-3xl">{format(currentMonth, "yyyy")}</span>
            </motion.h1>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="予定を検索..."
                className="pl-10 bg-white/80 backdrop-blur-sm border-blue-100 focus:border-blue-300 transition-colors"
              />
            </div>

            <Button 
              onClick={() => setSelectedDate(new Date())} 
              className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-blue-500/20"
            >
              <Plus className="h-4 w-4" />
              予定を追加
            </Button>
          </div>
        </div>

        <motion.div
          layout
          className="rounded-xl overflow-hidden shadow-2xl shadow-blue-200/50 backdrop-blur-sm"
        >
          <Card className="overflow-hidden border-none bg-white/80">
            <CalendarHeader
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              view={view}
              onViewChange={setView}
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
        </motion.div>

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