import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface CalendarHeaderProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  view: "personal" | "team";
  setView: (view: "personal" | "team") => void;
}

export function CalendarHeader({
  currentMonth,
  setCurrentMonth,
  view,
  setView,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-blue-50/50 rounded-lg p-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-white hover:text-blue-600"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-white hover:text-blue-600"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <motion.h2 
        key={format(currentMonth, "yyyy-MM")}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-xl font-semibold text-gray-800"
      >
        {format(currentMonth, "yyyy年 M月")}
      </motion.h2>

      <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-100">
        <Button
          variant={view === "personal" ? "default" : "ghost"}
          size="sm"
          onClick={() => setView("personal")}
          className={`h-8 gap-1 ${
            view === "personal" 
              ? "bg-blue-500 text-white" 
              : "hover:bg-blue-50 hover:text-blue-600 text-gray-700"
          }`}
        >
          <User className="h-3.5 w-3.5" />
          個人
        </Button>
        <Button
          variant={view === "team" ? "default" : "ghost"}
          size="sm"
          onClick={() => setView("team")}
          className={`h-8 gap-1 ${
            view === "team" 
              ? "bg-blue-500 text-white" 
              : "hover:bg-blue-50 hover:text-blue-600 text-gray-700"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          チーム
        </Button>
      </div>
    </div>
  );
}