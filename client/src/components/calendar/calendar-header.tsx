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
    <div className="px-6 pt-6 pb-4 border-b border-blue-100/30">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-blue-50/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-blue-100/50 hover:text-blue-600 transition-colors"
              onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-blue-100/50 hover:text-blue-600 transition-colors"
              onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 bg-blue-50/50 rounded-lg p-1">
            <Button
              variant={view === "personal" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange("personal")}
              className={`gap-2 transition-all duration-300 ${
                view === "personal" 
                  ? "bg-white shadow-md" 
                  : "hover:bg-blue-100/50 hover:text-blue-600"
              }`}
            >
              <User className="h-4 w-4" />
              個人
            </Button>
            <Button
              variant={view === "team" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange("team")}
              className={`gap-2 transition-all duration-300 ${
                view === "team" 
                  ? "bg-white shadow-md" 
                  : "hover:bg-blue-100/50 hover:text-blue-600"
              }`}
            >
              <Users className="h-4 w-4" />
              チーム
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center">
        {["日", "月", "火", "水", "木", "金", "土"].map((day, i) => (
          <div
            key={day}
            className={`text-sm font-medium py-2 ${
              i === 0 ? "text-red-500" : 
              i === 6 ? "text-blue-500" : 
              "text-gray-600"
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}