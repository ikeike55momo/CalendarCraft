import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { google } from "googleapis";
import { format } from "date-fns";
import webpush from "web-push";
import { GoogleSheetsService } from "./services/sheets";

// Google Sheets APIの設定
const setupGoogleSheetsAPI = () => {
  // 実際の環境では環境変数から取得するべき
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
};

// Web Push通知の設定
const setupWebPush = () => {
  const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
    privateKey: process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTWKSbtM'
  };

  webpush.setVapidDetails(
    'mailto:admin@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  return vapidKeys;
};

// 購読情報を保存するためのメモリストレージ
// 実際のアプリケーションではデータベースに保存するべき
const subscriptions: { [key: string]: webpush.PushSubscription } = {};

// ルーティングの設定
export const setupRoutes = (app: Express): Server => {
  const server = createServer(app);
  const sheets = setupGoogleSheetsAPI();
  const vapidKeys = setupWebPush();
  const sheetsService = new GoogleSheetsService();

  // 購読エンドポイント
  app.post("/api/push/subscribe", (req: Request, res: Response) => {
    const subscription = req.body;
    const userId = req.query.userId as string;

    if (!userId || !subscription) {
      return res.status(400).json({ error: "ユーザーIDと購読情報が必要です" });
    }

    // 購読情報を保存
    subscriptions[userId] = subscription;
    console.log(`ユーザー ${userId} が通知を購読しました`);

    res.status(201).json({ message: "購読が完了しました" });
  });

  // 購読解除エンドポイント
  app.delete("/api/push/unsubscribe", (req: Request, res: Response) => {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: "ユーザーIDが必要です" });
    }

    // 購読情報を削除
    if (subscriptions[userId]) {
      delete subscriptions[userId];
      console.log(`ユーザー ${userId} が通知を解除しました`);
    }

    res.status(200).json({ message: "購読が解除されました" });
  });

  // 通知送信エンドポイント
  app.post("/api/push/send", async (req: Request, res: Response) => {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ error: "ユーザーID、タイトル、本文が必要です" });
    }

    const subscription = subscriptions[userId];
    if (!subscription) {
      return res.status(404).json({ error: "指定されたユーザーの購読情報が見つかりません" });
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
      console.log(`ユーザー ${userId} に通知を送信しました`);
      res.status(200).json({ message: "通知が送信されました" });
    } catch (error) {
      console.error("通知送信エラー:", error);
      res.status(500).json({ error: "通知の送信に失敗しました" });
    }
  });

  // 管理者向け通知送信エンドポイント（承認待ちユーザー通知）
  app.post("/api/push/notify-admin", async (req: Request, res: Response) => {
    const { adminId, userName, userEmail } = req.body;

    if (!adminId || !userName || !userEmail) {
      return res.status(400).json({ error: "管理者ID、ユーザー名、メールアドレスが必要です" });
    }

    const subscription = subscriptions[adminId];
    if (!subscription) {
      return res.status(404).json({ error: "管理者の購読情報が見つかりません" });
    }

    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: "新規ユーザー承認待ち",
          body: `${userName}（${userEmail}）さんが承認を待っています`,
          data: {
            url: "/admin?tab=pending"
          }
        })
      );
      console.log(`管理者 ${adminId} に承認待ち通知を送信しました`);
      res.status(200).json({ message: "管理者に通知が送信されました" });
    } catch (error) {
      console.error("管理者通知送信エラー:", error);
      res.status(500).json({ error: "管理者への通知送信に失敗しました" });
    }
  });

  // VAPID公開キー取得エンドポイント
  app.get("/api/push/vapid-public-key", (req: Request, res: Response) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  // イベント関連のエンドポイント
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const events = await storage.getEvents();
      return res.status(200).json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      return res.status(500).json({ 
        error: "イベント取得中にエラーが発生しました", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      const eventData = req.body;
      const event = await storage.createEvent(eventData);
      return res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      return res.status(500).json({ 
        error: "イベント作成中にエラーが発生しました", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // タスク関連のエンドポイント
  app.get("/api/tasks", async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasks();
      return res.status(200).json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return res.status(500).json({ 
        error: "タスク取得中にエラーが発生しました", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      const taskData = req.body;
      const task = await storage.createTask(taskData);
      return res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      return res.status(500).json({ 
        error: "タスク作成中にエラーが発生しました", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // 勤怠関連のエンドポイント
  app.get("/api/attendance", async (req: Request, res: Response) => {
    try {
      const attendance = await storage.getAttendance();
      return res.status(200).json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      return res.status(500).json({ 
        error: "勤怠情報取得中にエラーが発生しました", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/attendance", async (req: Request, res: Response) => {
    try {
      console.log("勤怠データ受信:", req.body);
      
      // リクエストデータの検証
      const attendanceData = req.body;
      if (!attendanceData.date) {
        return res.status(400).json({ 
          error: "日付が必要です" 
        });
      }
      
      // attendanceLogが配列であることを確認
      if (!Array.isArray(attendanceData.attendanceLog)) {
        attendanceData.attendanceLog = [];
      }
      
      // 各ログエントリの検証
      if (Array.isArray(attendanceData.attendanceLog)) {
        attendanceData.attendanceLog = attendanceData.attendanceLog.filter(log => {
          return log && 
                 typeof log === 'object' && 
                 'type' in log && 
                 'time' in log &&
                 ["check_in", "check_out", "break_start", "break_end"].includes(log.type) &&
                 typeof log.time === 'string';
        });
      }
      
      const attendance = await storage.createAttendance(attendanceData);
      console.log("勤怠データ作成成功:", attendance);
      return res.status(201).json(attendance);
    } catch (error) {
      console.error("Error creating attendance:", error);
      return res.status(500).json({ 
        error: "勤怠情報作成中にエラーが発生しました", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // プロジェクト関連のエンドポイント
  app.get("/api/projects", async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      return res.status(200).json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      return res.status(500).json({ 
        error: "プロジェクト取得中にエラーが発生しました", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Google Sheetsからのインポート
  app.post("/api/admin/import-sheets", async (req: Request, res: Response) => {
    try {
      // 管理者権限チェック（実際の実装では認証情報から確認）
      // if (!req.user || req.user.role !== "admin") {
      //   return res.status(403).json({ error: "管理者権限が必要です" });
      // }
      
      const { spreadsheetId, range } = req.body;
      
      if (!spreadsheetId || !range) {
        return res.status(400).json({ 
          error: "スプレッドシートIDと範囲が必要です" 
        });
      }
      
      // スプレッドシートからデータを取得
      const sheetEvents = await sheetsService.getScheduleData(spreadsheetId, range);
      
      if (sheetEvents.length === 0) {
        return res.status(200).json({ 
          message: "インポートするデータがありません", 
          count: 0 
        });
      }
      
      // シートイベントをInsertEvent形式に変換
      const insertEvents = sheetsService.convertToInsertEvents(sheetEvents);
      
      // インポートしたデータをDBに保存
      let importedCount = 0;
      for (const event of insertEvents) {
        await storage.createEvent(event);
        importedCount++;
      }
      
      return res.status(200).json({ 
        message: "スプレッドシートからデータをインポートしました", 
        count: importedCount 
      });
    } catch (error) {
      console.error("Google Sheets import error:", error);
      return res.status(500).json({ 
        error: "インポート中にエラーが発生しました", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // シート名一覧を取得するエンドポイント
  app.get("/api/admin/sheet-names", async (req: Request, res: Response) => {
    try {
      const { spreadsheetId } = req.query;
      
      if (!spreadsheetId) {
        return res.status(400).json({ 
          error: "スプレッドシートIDが必要です" 
        });
      }
      
      const sheetNames = await sheetsService.getSheetNames(spreadsheetId as string);
      
      return res.status(200).json({ 
        sheetNames 
      });
    } catch (error) {
      console.error("Sheet names fetch error:", error);
      return res.status(500).json({ 
        error: "シート名の取得中にエラーが発生しました", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  return server;
};
