import { users, type User, type Event, type InsertEvent, type Task, type InsertTask, type Attendance, type InsertAttendance, type Project } from "@shared/schema";

// InsertUserの型定義
type InsertUser = Omit<User, "id">;

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  getEvents(): Promise<Event[]>;
  createTask(task: InsertTask): Promise<Task>;
  getTasks(): Promise<Task[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendance(): Promise<Attendance[]>;
  getProjects(): Promise<Project[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<string, Event>;
  private tasks: Map<string, Task>;
  private attendance: Map<string, Attendance>;
  private projects: Map<string, Project>;
  currentId: number;
  currentEventId: number;
  currentTaskId: number;
  currentAttendanceId: number;
  currentProjectId: number;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.tasks = new Map();
    this.attendance = new Map();
    this.projects = new Map();
    this.currentId = 1;
    this.currentEventId = 1;
    this.currentTaskId = 1;
    this.currentAttendanceId = 1;
    this.currentProjectId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = `event-${this.currentEventId++}`;
    const now = new Date();
    // userIdが必須なので、デフォルト値を設定
    const userId = insertEvent.userId || 1; // デフォルトユーザーID
    const event: Event = { 
      ...insertEvent, 
      userId,
      id,
      description: insertEvent.description || null,
      createdAt: now,
      updatedAt: now
    };
    this.events.set(id, event);
    return event;
  }

  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = `task-${this.currentTaskId++}`;
    const now = new Date();
    // userIdが必須なので、デフォルト値を設定
    const userId = insertTask.userId || 1; // デフォルトユーザーID
    const task: Task = {
      ...insertTask,
      userId,
      id,
      createdAt: now,
      updatedAt: now,
      status: insertTask.status || "open",
      tag: insertTask.tag || null,
      detail: insertTask.detail || null,
      projectId: insertTask.projectId || null,
      dueDate: insertTask.dueDate || null
    };
    this.tasks.set(id, task);
    return task;
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = `attendance-${this.currentAttendanceId++}`;
    const now = new Date();
    // userIdが必須なので、デフォルト値を設定
    const userId = insertAttendance.userId || 1; // デフォルトユーザーID
    
    // attendanceLogの型を正しく変換
    let typedAttendanceLog: { type: "check_in" | "check_out" | "break_start" | "break_end"; time: string }[] = [];
    
    // 必ず配列として扱う
    const inputLogs = Array.isArray(insertAttendance.attendanceLog) ? insertAttendance.attendanceLog : [];
    
    for (const log of inputLogs) {
      if (log && typeof log === 'object' && 'type' in log && 'time' in log) {
        const validType = ["check_in", "check_out", "break_start", "break_end"].includes(log.type as string);
        if (validType && typeof log.time === 'string') {
          typedAttendanceLog.push({
            type: log.type as "check_in" | "check_out" | "break_start" | "break_end",
            time: log.time
          });
        }
      }
    }
    
    console.log("サーバー側で処理する勤怠データ:", {
      date: insertAttendance.date,
      userId,
      attendanceLog: typedAttendanceLog
    });
    
    const attendance: Attendance = {
      date: insertAttendance.date,
      userId,
      id,
      createdAt: now,
      updatedAt: now,
      attendanceLog: typedAttendanceLog
    };
    this.attendance.set(id, attendance);
    return attendance;
  }

  async getAttendance(): Promise<Attendance[]> {
    return Array.from(this.attendance.values());
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
}

export const storage = new MemStorage();
