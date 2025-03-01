import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface CalendarHeaderProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  view: "personal" | "team";
  onViewChange: (view: "personal" | "team") => void;
}

export function CalendarHeader({
  currentMonth,
  onMonthChange,
  view,
  onViewChange,
}: CalendarHeaderProps) {
  return (
    <div className="p-6 border-b border-blue-100/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-blue-50"
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-blue-50"
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-gray-100/50 rounded-lg p-1">
          <Button
            variant={view === "personal" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange("personal")}
            className="gap-2"
          >
            <User className="h-4 w-4" />
            Personal
          </Button>
          <Button
            variant={view === "team" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange("team")}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Team
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}