import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { google } from "googleapis";
import { format } from "date-fns";

// Google Sheets APIの設定
const setupGoogleSheetsAPI = () => {
  // 実際の環境では環境変数から取得するべき
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Google Sheetsからのインポート
  app.post("/api/admin/import-sheets", async (req: Request, res: Response) => {
    try {
      // 管理者権限チェック（実際の実装では認証情報から確認）
      // if (!req.user || req.user.role !== "admin") {
      //   return res.status(403).json({ error: "管理者権限が必要です" });
      // }

      const sheets = setupGoogleSheetsAPI();
      
      // スプレッドシートIDと範囲（実際の環境では環境変数から取得）
      const spreadsheetId = process.env.SPREADSHEET_ID || "your-spreadsheet-id";
      const range = "Sheet1!A2:E"; // ヘッダーを除く範囲
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      
      const rows = response.data.values || [];
      
      if (rows.length === 0) {
        return res.status(200).json({ message: "インポートするデータがありません", count: 0 });
      }
      
      // インポートしたデータをDBに保存
      const importedCount = await importSheetsData(rows);
      
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

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}

// スプレッドシートのデータをインポートする関数
async function importSheetsData(rows: any[]): Promise<number> {
  let importedCount = 0;
  
  try {
    // ユーザー情報をキャッシュ
    const users = await storage.getUsers();
    const userMap = new Map(users.map(user => [user.sheetName, user.id]));
    
    for (const row of rows) {
      // スプレッドシートの列に合わせて調整
      const [name, date, startTime, endTime, workType] = row;
      
      // ユーザーIDを取得
      const userId = userMap.get(name);
      if (!userId) {
        console.warn(`User not found for name: ${name}`);
        continue;
      }
      
      // 日付と時間を結合してDateオブジェクトに変換
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);
      
      // イベントを作成
      await storage.createEvent({
        userId,
        title: workType === "office" ? "出勤" : "テレワーク",
        startTime: startDateTime,
        endTime: endDateTime,
        workType: workType === "office" ? "office" : "remote",
      });
      
      importedCount++;
    }
    
    return importedCount;
  } catch (error) {
    console.error("Error importing data:", error);
    throw error;
  }
}
