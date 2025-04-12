import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventModalProps {
  date: Date;
  isOpen: boolean;
  onClose: () => void;
  open: boolean
}

export function EventModal({ date, isOpen, onClose, open }: EventModalProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
  const [timeStart, setTimeStart] = useState<string>("");
  const [timeEnd, setTimeEnd] = useState<string>("");
  const [checkInTime, setCheckInTime] = useState<string>("");
  const [checkOutTime, setCheckOutTime] = useState<string>("");
  const [breakPeriods, setBreakPeriods] = useState<{ start: string; end: string }[]>([]);

  const formattedDate = selectedDate ? format(selectedDate, "yyyy/MM/dd(E)") : "";
  
  useEffect(() => {
    if (date) {
      setSelectedDate(date);
    }
  }, [date]);

  const handleAddBreakPeriod = () => {
    setBreakPeriods([...breakPeriods, { start: "", end: "" }]);
  };

  const handleBreakPeriodChange = (index: number, type: "start" | "end", value: string) => {
    const updatedPeriods = [...breakPeriods];
    updatedPeriods[index][type] = value;
    setBreakPeriods(updatedPeriods);
  };

  const handleRemoveBreakPeriod = (index: number) => {
    const updatedPeriods = [...breakPeriods];
    updatedPeriods.splice(index, 1);
    setBreakPeriods(updatedPeriods);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] overflow-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>イベントの追加・編集</DialogTitle>
          <DialogDescription>
            {formattedDate}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              日付
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] pl-3 text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  {selectedDate ? (
                    format(selectedDate, "yyyy/MM/dd")
                  ) : (
                    <span>日付を選択</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              イベント名
            </Label>
            <Input id="name" placeholder="イベント名" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start-time" className="text-right">
              開始時刻
            </Label>
            <Input type="time" id="start-time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end-time" className="text-right">
              終了時刻
            </Label>
            <Input type="time" id="end-time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="check-in-time" className="text-right">
              出勤時刻
            </Label>
            <Input type="time" id="check-in-time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="check-out-time" className="text-right">
              退勤時刻
            </Label>
            <Input type="time" id="check-out-time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className="col-span-3" />
          </div>

          <div>
            <Label className="mb-2">休憩時間</Label>
            {breakPeriods.map((period, index) => (
              <div key={index} className="grid grid-cols-6 items-center gap-4 mb-2">
                <Label htmlFor={`break-start-${index}`} className="text-right">
                  開始
                </Label>
                <Input type="time" id={`break-start-${index}`} value={period.start} onChange={(e) => handleBreakPeriodChange(index, "start", e.target.value)} className="col-span-2" />
                <Label htmlFor={`break-end-${index}`} className="text-right">
                  終了
                </Label>
                <Input type="time" id={`break-end-${index}`} value={period.end} onChange={(e) => handleBreakPeriodChange(index, "end", e.target.value)} className="col-span-2" />
                <Button variant="outline" size="icon" onClick={() => handleRemoveBreakPeriod(index)} className="w-8 h-8 p-0"><ChevronLeft className="h-5 w-5 rotate-180" /></Button>
              </div>
            ))}
            <Button variant="outline" onClick={handleAddBreakPeriod}>
              休憩時間を追加
            </Button>
          </div>

          <div>
            <Label className="mb-2">勤怠種別</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input type="radio" id="onsite" name="attendance-type" value="onsite" className="peer hidden" />
                <label
                  htmlFor="onsite"
                  className="inline-flex items-center justify-between rounded-md border border-blue-500 bg-white/80 px-4 py-2 text-sm font-medium transition-colors hover:bg-blue-500 hover:text-white peer-checked:bg-blue-500 peer-checked:text-white"
                >
                  出社
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="radio" id="telework" name="attendance-type" value="telework" className="peer hidden" />
                <label
                  htmlFor="telework"
                  className="inline-flex items-center justify-between rounded-md border border-blue-500 bg-white/80 px-4 py-2 text-sm font-medium transition-colors hover:bg-blue-500 hover:text-white peer-checked:bg-blue-500 peer-checked:text-white"
                >
                  テレワーク
                </label>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}