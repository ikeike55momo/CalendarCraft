import { pgTable, text, serial, timestamp, date, boolean, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  googleSub: text("google_sub").notNull().unique(),
  sheetName: text("sheet_name").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: serial("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),  // Added description field
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  workType: text("work_type").notNull(), // "office" | "remote"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: serial("user_id").references(() => users.id),
  date: date("date").notNull(),
  attendanceLog: jsonb("attendance_log").$type<{
    type: "check_in" | "check_out" | "break_start" | "break_end";
    time: string;
  }[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: serial("user_id").references(() => users.id),
  title: text("title").notNull(),
  projectId: uuid("project_id").references(() => projects.id),
  tag: text("tag"),
  dueDate: date("due_date"),
  detail: text("detail"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  tag: text("tag"),
  detail: text("detail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const projectMembers = pgTable("project_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id),
  userId: serial("user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true 
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type User = typeof users.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Project = typeof projects.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;