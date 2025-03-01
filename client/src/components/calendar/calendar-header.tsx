import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface CalendarHeaderProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function CalendarHeader({ currentMonth, onMonthChange }: CalendarHeaderProps) {
  return (
    <div className="p-4 bg-white border-b border-blue-100">
      <div className="flex items-center justify-between">
        <motion.h2 
          key={format(currentMonth, "MMMM yyyy")}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-semibold text-gray-900"
        >
          {format(currentMonth, "MMMM yyyy")}
        </motion.h2>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 mt-6 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}
