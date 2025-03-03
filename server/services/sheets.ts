import { google } from 'googleapis';
import { format, parse } from 'date-fns';
import { type InsertEvent } from '@shared/schema';

interface SheetEvent {
  date: string;
  userId: number;
  title: string;
  workType: 'office' | 'remote';
  startTime: string;
  endTime: string;
}

export class GoogleSheetsService {
  private sheets: any;

  constructor() {
    // Google Sheets APIの設定
    let auth;
    
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      // 環境変数からJSONを直接読み込む
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // 従来の方法（ファイルパス）
      auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });
    } else {
      throw new Error('Google認証情報が設定されていません。GOOGLE_CREDENTIALS_JSONまたはGOOGLE_APPLICATION_CREDENTIALSを設定してください。');
    }

    this.sheets = google.sheets({ version: "v4", auth });
  }

  private cleanMemberName(name: string): string {
    return name.replace(/\n/g, ' ').trim();
  }

  async getScheduleData(spreadsheetId: string, range: string): Promise<SheetEvent[]> {
    try {
      console.log(`シートデータを取得: ${range}`);
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log('データが見つかりませんでした');
        return [];
      }

      // スプレッドシートのデータを解析
      return await this.parseSheetData(rows, range);
    } catch (error) {
      console.error('シートデータの取得に失敗:', error);
      if (error instanceof Error) {
        throw new Error(`シートデータの取得に失敗: ${error.message}`);
      }
      throw new Error('シートデータの取得に失敗しました');
    }
  }

  private async parseSheetData(rows: any[], range: string): Promise<SheetEvent[]> {
    const events: SheetEvent[] = [];
    const yearMonth = range.split('!')[0]; // "202502" 形式

    // メンバーのIDマップを作成
    const memberIds = new Map<string, number>();
    let nextId = 1;

    // メンバーにIDを割り当て
    for (let i = 1; i < rows.length; i += 3) {
      const memberName = this.cleanMemberName(rows[i][0]);
      if (!memberName) continue;

      if (!memberIds.has(memberName)) {
        memberIds.set(memberName, nextId++);
      }
    }

    // 各日のデータを処理
    for (let day = 1; day <= 31; day++) {
      const columnIndex = 2 + day; // C列（3列目）が1日目
      if (columnIndex >= rows[0].length) break; // シートの範囲外

      const dateStr = `${yearMonth}${String(day).padStart(2, '0')}`; // "20250201" 形式
      const date = parse(dateStr, 'yyyyMMdd', new Date());
      const formattedDate = format(date, 'yyyy-MM-dd');

      // 各メンバーの予定を処理
      let currentRow = 1;
      while (currentRow < rows.length) {
        const memberName = this.cleanMemberName(rows[currentRow][0]);
        const userId = memberIds.get(memberName);
        const workType = rows[currentRow + 2] ? rows[currentRow + 2][columnIndex] : undefined;

        // ユーザーIDが存在し、勤務形態が設定されている場合のみイベントを追加
        if (userId && (workType === '出社' || workType === 'テレ')) {
          // デフォルトの勤務時間を設定（9:00-18:00）
          const startTime = `${formattedDate}T09:00:00`;
          const endTime = `${formattedDate}T18:00:00`;
          
          events.push({
            date: formattedDate,
            userId,
            title: workType === '出社' ? '出勤' : 'テレワーク',
            workType: workType === '出社' ? 'office' : 'remote',
            startTime,
            endTime
          });
        }

        currentRow += 3; // 各メンバーは3行で構成
      }
    }

    return events;
  }

  // シート名の一覧を取得
  async getSheetNames(spreadsheetId: string): Promise<string[]> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });

      return response.data.sheets.map((sheet: any) => sheet.properties.title);
    } catch (error) {
      console.error('シート名の取得に失敗:', error);
      if (error instanceof Error) {
        throw new Error(`シート名の取得に失敗: ${error.message}`);
      }
      throw new Error('シート名の取得に失敗しました');
    }
  }

  // イベントデータをInsertEvent形式に変換
  convertToInsertEvents(sheetEvents: SheetEvent[]): InsertEvent[] {
    return sheetEvents.map(event => ({
      userId: event.userId,
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      workType: event.workType,
      description: null
    }));
  }
} 