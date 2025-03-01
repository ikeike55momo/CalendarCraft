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
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
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
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <h1 className="text-3xl font-bold text-gray-900">
              {format(currentMonth, "MMMM")}
              <span className="text-gray-500 ml-2">{format(currentMonth, "yyyy")}</span>
            </h1>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search events..."
                className="pl-10 bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-lg p-1">
              <Button
                variant={viewMode === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("month")}
              >
                Month
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("week")}
              >
                Week
              </Button>
              <Button
                variant={viewMode === "day" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("day")}
              >
                Day
              </Button>
            </div>

            <Button onClick={() => setSelectedDate(new Date())} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border border-blue-100/50 shadow-xl shadow-blue-100/20 bg-white/50 backdrop-blur-sm">
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