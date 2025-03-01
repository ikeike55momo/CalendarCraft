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
    <div className="px-6 pt-8 pb-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-white hover:text-blue-600 transition-all duration-300 rounded-lg"
              onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-white hover:text-blue-600 transition-all duration-300 rounded-lg"
              onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-md">
            <Button
              variant={view === "personal" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange("personal")}
              className={`gap-2 transition-all duration-300 rounded-lg ${
                view === "personal" 
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-200/50" 
                  : "hover:bg-blue-50 hover:text-blue-600 text-gray-700"
              }`}
            >
              <User className="h-4 w-4" />
              個人
            </Button>
            <Button
              variant={view === "team" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange("team")}
              className={`gap-2 transition-all duration-300 rounded-lg ${
                view === "team" 
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-200/50" 
                  : "hover:bg-blue-50 hover:text-blue-600 text-gray-700"
              }`}
            >
              <Users className="h-4 w-4" />
              チーム
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center border-b border-indigo-100/30">
        {["日", "月", "火", "水", "木", "金", "土"].map((day, i) => (
          <div
            key={day}
            className={`text-sm font-medium py-3 ${
              i === 0 ? "text-rose-500" : 
              i === 6 ? "text-indigo-500" : 
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