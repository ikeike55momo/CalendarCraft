// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  events;
  tasks;
  attendance;
  projects;
  currentId;
  currentEventId;
  currentTaskId;
  currentAttendanceId;
  currentProjectId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.events = /* @__PURE__ */ new Map();
    this.tasks = /* @__PURE__ */ new Map();
    this.attendance = /* @__PURE__ */ new Map();
    this.projects = /* @__PURE__ */ new Map();
    this.currentId = 1;
    this.currentEventId = 1;
    this.currentTaskId = 1;
    this.currentAttendanceId = 1;
    this.currentProjectId = 1;
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  async createUser(insertUser) {
    const id = this.currentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async getUsers() {
    return Array.from(this.users.values());
  }
  async createEvent(insertEvent) {
    const id = `event-${this.currentEventId++}`;
    const now = /* @__PURE__ */ new Date();
    const userId = insertEvent.userId || 1;
    const event = {
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
  async getEvents() {
    return Array.from(this.events.values());
  }
  async createTask(insertTask) {
    const id = `task-${this.currentTaskId++}`;
    const now = /* @__PURE__ */ new Date();
    const userId = insertTask.userId || 1;
    const task = {
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
  async getTasks() {
    return Array.from(this.tasks.values());
  }
  async createAttendance(insertAttendance) {
    const id = `attendance-${this.currentAttendanceId++}`;
    const now = /* @__PURE__ */ new Date();
    const userId = insertAttendance.userId || 1;
    let typedAttendanceLog = [];
    const inputLogs = Array.isArray(insertAttendance.attendanceLog) ? insertAttendance.attendanceLog : [];
    for (const log2 of inputLogs) {
      if (log2 && typeof log2 === "object" && "type" in log2 && "time" in log2) {
        const validType = ["check_in", "check_out", "break_start", "break_end"].includes(log2.type);
        if (validType && typeof log2.time === "string") {
          typedAttendanceLog.push({
            type: log2.type,
            time: log2.time
          });
        }
      }
    }
    console.log("\u30B5\u30FC\u30D0\u30FC\u5074\u3067\u51E6\u7406\u3059\u308B\u52E4\u6020\u30C7\u30FC\u30BF:", {
      date: insertAttendance.date,
      userId,
      attendanceLog: typedAttendanceLog
    });
    const attendance = {
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
  async getAttendance() {
    return Array.from(this.attendance.values());
  }
  async getProjects() {
    return Array.from(this.projects.values());
  }
};
var storage = new MemStorage();

// server/routes.ts
import { google as google2 } from "googleapis";
import webpush from "web-push";

// server/services/sheets.ts
import { google } from "googleapis";
import { format, parse } from "date-fns";
var GoogleSheetsService = class {
  sheets;
  auth;
  useMock = false;
  // モックモードフラグを初期化
  constructor() {
    const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialsJson && !credentialsPath) {
      console.warn("\u8B66\u544A: Google\u8A8D\u8A3C\u60C5\u5831\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002\u30E2\u30C3\u30AF\u30C7\u30FC\u30BF\u3092\u4F7F\u7528\u3057\u307E\u3059\u3002");
      this.useMock = true;
      return;
    }
    try {
      if (credentialsJson) {
        const credentials = JSON.parse(credentialsJson);
        this.auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
        });
      } else if (credentialsPath) {
        this.auth = new google.auth.GoogleAuth({
          keyFile: credentialsPath,
          scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
        });
      }
      this.sheets = google.sheets({ version: "v4", auth: this.auth });
    } catch (error) {
      console.error("Google\u8A8D\u8A3C\u60C5\u5831\u306E\u8A2D\u5B9A\u30A8\u30E9\u30FC:", error);
      this.useMock = true;
    }
  }
  cleanMemberName(name) {
    return name.replace(/\n/g, " ").trim();
  }
  async getScheduleData(spreadsheetId, range) {
    if (this.useMock) {
      console.log("\u30E2\u30C3\u30AF\u30E2\u30FC\u30C9\u3067\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u30C7\u30FC\u30BF\u3092\u8FD4\u3057\u307E\u3059");
      return this.getMockScheduleData();
    }
    try {
      console.log(`\u30B7\u30FC\u30C8\u30C7\u30FC\u30BF\u3092\u53D6\u5F97: ${range}`);
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range
      });
      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log("\u30C7\u30FC\u30BF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
        return [];
      }
      return await this.parseSheetData(rows, range);
    } catch (error) {
      console.error("\u30B7\u30FC\u30C8\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557:", error);
      if (error instanceof Error) {
        throw new Error(`\u30B7\u30FC\u30C8\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557: ${error.message}`);
      }
      throw new Error("\u30B7\u30FC\u30C8\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
    }
  }
  async parseSheetData(rows, range) {
    const events = [];
    const yearMonth = range.split("!")[0];
    const memberIds = /* @__PURE__ */ new Map();
    let nextId = 1;
    for (let i = 1; i < rows.length; i += 3) {
      const memberName = this.cleanMemberName(rows[i][0]);
      if (!memberName) continue;
      if (!memberIds.has(memberName)) {
        memberIds.set(memberName, nextId++);
      }
    }
    for (let day = 1; day <= 31; day++) {
      const columnIndex = 2 + day;
      if (columnIndex >= rows[0].length) break;
      const dateStr = `${yearMonth}${String(day).padStart(2, "0")}`;
      const date = parse(dateStr, "yyyyMMdd", /* @__PURE__ */ new Date());
      const formattedDate = format(date, "yyyy-MM-dd");
      let currentRow = 1;
      while (currentRow < rows.length) {
        const memberName = this.cleanMemberName(rows[currentRow][0]);
        const userId = memberIds.get(memberName);
        const workType = rows[currentRow + 2] ? rows[currentRow + 2][columnIndex] : void 0;
        if (userId && (workType === "\u51FA\u793E" || workType === "\u30C6\u30EC")) {
          const startTime = `${formattedDate}T09:00:00`;
          const endTime = `${formattedDate}T18:00:00`;
          events.push({
            date: formattedDate,
            userId,
            title: workType === "\u51FA\u793E" ? "\u51FA\u52E4" : "\u30C6\u30EC\u30EF\u30FC\u30AF",
            workType: workType === "\u51FA\u793E" ? "office" : "remote",
            startTime,
            endTime
          });
        }
        currentRow += 3;
      }
    }
    return events;
  }
  // シート名一覧の取得
  async getSheetNames(spreadsheetId) {
    if (this.useMock) {
      console.log("\u30E2\u30C3\u30AF\u30E2\u30FC\u30C9\u3067\u30B7\u30FC\u30C8\u540D\u4E00\u89A7\u3092\u8FD4\u3057\u307E\u3059");
      return ["Sheet1", "\u30E1\u30F3\u30D0\u30FC1", "\u30E1\u30F3\u30D0\u30FC2", "\u30E1\u30F3\u30D0\u30FC3"];
    }
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId
      });
      const sheets = response.data.sheets;
      if (!sheets || sheets.length === 0) {
        console.log("\u30B7\u30FC\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
        return [];
      }
      return sheets.map((sheet) => sheet.properties.title);
    } catch (error) {
      console.error("\u30B7\u30FC\u30C8\u540D\u4E00\u89A7\u306E\u53D6\u5F97\u30A8\u30E9\u30FC:", error);
      throw error;
    }
  }
  // イベントデータをInsertEvent形式に変換
  convertToInsertEvents(sheetEvents) {
    return sheetEvents.map((event) => ({
      userId: event.userId,
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      workType: event.workType,
      description: null
    }));
  }
  // モックスケジュールデータの生成
  getMockScheduleData() {
    const today = /* @__PURE__ */ new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return [
      {
        date: today.toISOString().split("T")[0],
        userId: 1,
        title: "\u958B\u767A\u30DF\u30FC\u30C6\u30A3\u30F3\u30B0",
        workType: "office",
        startTime: "10:00",
        endTime: "12:00"
      },
      {
        date: today.toISOString().split("T")[0],
        userId: 2,
        title: "\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8MTG",
        workType: "remote",
        startTime: "14:00",
        endTime: "15:30"
      },
      {
        date: tomorrow.toISOString().split("T")[0],
        userId: 1,
        title: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u8A08\u753B",
        workType: "office",
        startTime: "09:30",
        endTime: "17:00"
      }
    ];
  }
};

// server/routes.ts
var setupGoogleSheetsAPI = () => {
  const auth = new google2.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });
  return google2.sheets({ version: "v4", auth });
};
var setupWebPush = () => {
  const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U",
    privateKey: process.env.VAPID_PRIVATE_KEY || "UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTWKSbtM"
  };
  webpush.setVapidDetails(
    "mailto:admin@example.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  return vapidKeys;
};
var subscriptions = {};
var setupRoutes = (app2) => {
  const server = createServer(app2);
  const sheets = setupGoogleSheetsAPI();
  const vapidKeys = setupWebPush();
  const sheetsService = new GoogleSheetsService();
  app2.post("/api/push/subscribe", (req, res) => {
    const subscription = req.body;
    const userId = req.query.userId;
    if (!userId || !subscription) {
      return res.status(400).json({ error: "\u30E6\u30FC\u30B6\u30FCID\u3068\u8CFC\u8AAD\u60C5\u5831\u304C\u5FC5\u8981\u3067\u3059" });
    }
    subscriptions[userId] = subscription;
    console.log(`\u30E6\u30FC\u30B6\u30FC ${userId} \u304C\u901A\u77E5\u3092\u8CFC\u8AAD\u3057\u307E\u3057\u305F`);
    res.status(201).json({ message: "\u8CFC\u8AAD\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F" });
  });
  app2.delete("/api/push/unsubscribe", (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: "\u30E6\u30FC\u30B6\u30FCID\u304C\u5FC5\u8981\u3067\u3059" });
    }
    if (subscriptions[userId]) {
      delete subscriptions[userId];
      console.log(`\u30E6\u30FC\u30B6\u30FC ${userId} \u304C\u901A\u77E5\u3092\u89E3\u9664\u3057\u307E\u3057\u305F`);
    }
    res.status(200).json({ message: "\u8CFC\u8AAD\u304C\u89E3\u9664\u3055\u308C\u307E\u3057\u305F" });
  });
  app2.post("/api/push/send", async (req, res) => {
    const { userId, title, body, data } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ error: "\u30E6\u30FC\u30B6\u30FCID\u3001\u30BF\u30A4\u30C8\u30EB\u3001\u672C\u6587\u304C\u5FC5\u8981\u3067\u3059" });
    }
    const subscription = subscriptions[userId];
    if (!subscription) {
      return res.status(404).json({ error: "\u6307\u5B9A\u3055\u308C\u305F\u30E6\u30FC\u30B6\u30FC\u306E\u8CFC\u8AAD\u60C5\u5831\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    }
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title,
          body,
          data: data || {}
        })
      );
      console.log(`\u30E6\u30FC\u30B6\u30FC ${userId} \u306B\u901A\u77E5\u3092\u9001\u4FE1\u3057\u307E\u3057\u305F`);
      res.status(200).json({ message: "\u901A\u77E5\u304C\u9001\u4FE1\u3055\u308C\u307E\u3057\u305F" });
    } catch (error) {
      console.error("\u901A\u77E5\u9001\u4FE1\u30A8\u30E9\u30FC:", error);
      res.status(500).json({ error: "\u901A\u77E5\u306E\u9001\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.post("/api/push/notify-admin", async (req, res) => {
    const { adminId, userName, userEmail } = req.body;
    if (!adminId || !userName || !userEmail) {
      return res.status(400).json({ error: "\u7BA1\u7406\u8005ID\u3001\u30E6\u30FC\u30B6\u30FC\u540D\u3001\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u304C\u5FC5\u8981\u3067\u3059" });
    }
    const subscription = subscriptions[adminId];
    if (!subscription) {
      return res.status(404).json({ error: "\u7BA1\u7406\u8005\u306E\u8CFC\u8AAD\u60C5\u5831\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    }
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: "\u65B0\u898F\u30E6\u30FC\u30B6\u30FC\u627F\u8A8D\u5F85\u3061",
          body: `${userName}\uFF08${userEmail}\uFF09\u3055\u3093\u304C\u627F\u8A8D\u3092\u5F85\u3063\u3066\u3044\u307E\u3059`,
          data: {
            url: "/admin?tab=pending"
          }
        })
      );
      console.log(`\u7BA1\u7406\u8005 ${adminId} \u306B\u627F\u8A8D\u5F85\u3061\u901A\u77E5\u3092\u9001\u4FE1\u3057\u307E\u3057\u305F`);
      res.status(200).json({ message: "\u7BA1\u7406\u8005\u306B\u901A\u77E5\u304C\u9001\u4FE1\u3055\u308C\u307E\u3057\u305F" });
    } catch (error) {
      console.error("\u7BA1\u7406\u8005\u901A\u77E5\u9001\u4FE1\u30A8\u30E9\u30FC:", error);
      res.status(500).json({ error: "\u7BA1\u7406\u8005\u3078\u306E\u901A\u77E5\u9001\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F" });
    }
  });
  app2.get("/api/push/vapid-public-key", (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });
  app2.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      return res.status(200).json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      return res.status(500).json({
        error: "\u30A4\u30D9\u30F3\u30C8\u53D6\u5F97\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/events", async (req, res) => {
    try {
      const eventData = req.body;
      const event = await storage.createEvent(eventData);
      return res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      return res.status(500).json({
        error: "\u30A4\u30D9\u30F3\u30C8\u4F5C\u6210\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      return res.status(200).json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return res.status(500).json({
        error: "\u30BF\u30B9\u30AF\u53D6\u5F97\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/tasks", async (req, res) => {
    try {
      const taskData = req.body;
      const task = await storage.createTask(taskData);
      return res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      return res.status(500).json({
        error: "\u30BF\u30B9\u30AF\u4F5C\u6210\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/attendance", async (req, res) => {
    try {
      const attendance = await storage.getAttendance();
      return res.status(200).json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      return res.status(500).json({
        error: "\u52E4\u6020\u60C5\u5831\u53D6\u5F97\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/attendance", async (req, res) => {
    try {
      console.log("\u52E4\u6020\u30C7\u30FC\u30BF\u53D7\u4FE1:", req.body);
      const attendanceData = req.body;
      if (!attendanceData.date) {
        return res.status(400).json({
          error: "\u65E5\u4ED8\u304C\u5FC5\u8981\u3067\u3059"
        });
      }
      if (!Array.isArray(attendanceData.attendanceLog)) {
        attendanceData.attendanceLog = [];
      }
      if (Array.isArray(attendanceData.attendanceLog)) {
        attendanceData.attendanceLog = attendanceData.attendanceLog.filter((log2) => {
          return log2 && typeof log2 === "object" && "type" in log2 && "time" in log2 && ["check_in", "check_out", "break_start", "break_end"].includes(log2.type) && typeof log2.time === "string";
        });
      }
      const attendance = await storage.createAttendance(attendanceData);
      console.log("\u52E4\u6020\u30C7\u30FC\u30BF\u4F5C\u6210\u6210\u529F:", attendance);
      return res.status(201).json(attendance);
    } catch (error) {
      console.error("Error creating attendance:", error);
      return res.status(500).json({
        error: "\u52E4\u6020\u60C5\u5831\u4F5C\u6210\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      return res.status(200).json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      return res.status(500).json({
        error: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u53D6\u5F97\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/admin/import-sheets", async (req, res) => {
    try {
      const { spreadsheetId, range } = req.body;
      if (!spreadsheetId || !range) {
        return res.status(400).json({
          error: "\u30B9\u30D7\u30EC\u30C3\u30C9\u30B7\u30FC\u30C8ID\u3068\u7BC4\u56F2\u304C\u5FC5\u8981\u3067\u3059"
        });
      }
      const sheetEvents = await sheetsService.getScheduleData(spreadsheetId, range);
      if (sheetEvents.length === 0) {
        return res.status(200).json({
          message: "\u30A4\u30F3\u30DD\u30FC\u30C8\u3059\u308B\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093",
          count: 0
        });
      }
      const insertEvents = sheetsService.convertToInsertEvents(sheetEvents);
      let importedCount = 0;
      for (const event of insertEvents) {
        await storage.createEvent(event);
        importedCount++;
      }
      return res.status(200).json({
        message: "\u30B9\u30D7\u30EC\u30C3\u30C9\u30B7\u30FC\u30C8\u304B\u3089\u30C7\u30FC\u30BF\u3092\u30A4\u30F3\u30DD\u30FC\u30C8\u3057\u307E\u3057\u305F",
        count: importedCount
      });
    } catch (error) {
      console.error("Google Sheets import error:", error);
      return res.status(500).json({
        error: "\u30A4\u30F3\u30DD\u30FC\u30C8\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/admin/sheet-names", async (req, res) => {
    try {
      const { spreadsheetId } = req.query;
      if (!spreadsheetId) {
        return res.status(400).json({
          error: "\u30B9\u30D7\u30EC\u30C3\u30C9\u30B7\u30FC\u30C8ID\u304C\u5FC5\u8981\u3067\u3059"
        });
      }
      const sheetNames = await sheetsService.getSheetNames(spreadsheetId);
      return res.status(200).json({
        sheetNames
      });
    } catch (error) {
      console.error("Sheet names fetch error:", error);
      return res.status(500).json({
        error: "\u30B7\u30FC\u30C8\u540D\u306E\u53D6\u5F97\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  return server;
};

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await setupRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 3e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
