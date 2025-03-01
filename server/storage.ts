import { users, type User, type Event, type InsertEvent } from "@shared/schema";

// InsertUserの型定義
type InsertUser = Omit<User, "id">;

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  createEvent(event: InsertEvent): Promise<Event>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<string, Event>;
  currentId: number;
  currentEventId: number;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.currentId = 1;
    this.currentEventId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
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
    const event: Event = { 
      ...insertEvent, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.events.set(id, event);
    return event;
  }
}

export const storage = new MemStorage();
