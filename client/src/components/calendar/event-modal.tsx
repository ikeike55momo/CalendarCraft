import { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertEventSchema, type InsertEvent } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EventModalProps {
  date: Date;
  onClose: () => void;
}

export function EventModal({ date, onClose }: EventModalProps) {
  const [tab, setTab] = useState<"schedule" | "attendance" | "task">("schedule");
  const { toast } = useToast();

  const form = useForm<InsertEvent>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      startTime: format(date, "yyyy-MM-dd'T'09:00"),
      endTime: format(date, "yyyy-MM-dd'T'17:00"),
      workType: "office",
    },
  });

  const createEvent = useMutation({
    mutationFn: async (data: InsertEvent) => {
      await apiRequest("POST", "/api/events", data);
    },
    onSuccess: () => {
      toast({
        title: "Event created",
        description: "Your event has been successfully created.",
      });
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Entry</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="task">Task</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === "schedule" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createEvent.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={createEvent.isPending}>
                  {createEvent.isPending ? "Creating..." : "Create Event"}
                </Button>
              </form>
            </Form>
          </motion.div>
        )}

        {/* Attendance and Task forms would go here */}
      </DialogContent>
    </Dialog>
  );
}
