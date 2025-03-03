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
  private auth: any;
  private useMock: boolean = false; // モックモードフラグを初期化

  constructor() {
    // 環境変数からGoogle認証情報を取得
    const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!credentialsJson && !credentialsPath) {
      // 開発環境用: 認証情報がない場合はモックモードで動作
      console.warn('警告: Google認証情報が設定されていません。モックデータを使用します。');
      this.useMock = true;
      return;
    }

    // 認証情報の設定
    try {
      if (credentialsJson) {
        // JSON文字列から認証情報を設定
        const credentials = JSON.parse(credentialsJson);
        this.auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
      } else if (credentialsPath) {
        // ファイルパスから認証情報を設定
        this.auth = new google.auth.GoogleAuth({
          keyFile: credentialsPath,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
      }
      this.sheets = google.sheets({ version: "v4", auth: this.auth });
    } catch (error) {
      console.error('Google認証情報の設定エラー:', error);
      this.useMock = true;
    }
  }

  private cleanMemberName(name: string): string {
    return name.replace(/\n/g, ' ').trim();
  }

  async getScheduleData(spreadsheetId: string, range: string): Promise<SheetEvent[]> {
    // モックモードの場合はダミーデータを返す
    if (this.useMock) {
      console.log('モックモードでスケジュールデータを返します');
      return this.getMockScheduleData();
    }

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

  // シート名一覧の取得
  async getSheetNames(spreadsheetId: string): Promise<string[]> {
    // モックモードの場合はダミーデータを返す
    if (this.useMock) {
      console.log('モックモードでシート名一覧を返します');
      return ['Sheet1', 'メンバー1', 'メンバー2', 'メンバー3'];
    }

    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });

      const sheets = response.data.sheets;
      if (!sheets || sheets.length === 0) {
        console.log('シートが見つかりませんでした');
        return [];
      }

      return sheets.map((sheet: any) => sheet.properties.title);
    } catch (error) {
      console.error('シート名一覧の取得エラー:', error);
      throw error;
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

  // モックスケジュールデータの生成
  private getMockScheduleData(): SheetEvent[] {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    return [
      {
        date: today.toISOString().split('T')[0],
        userId: 1,
        title: '開発ミーティング',
        workType: 'office',
        startTime: '10:00',
        endTime: '12:00'
      },
      {
        date: today.toISOString().split('T')[0],
        userId: 2,
        title: 'クライアントMTG',
        workType: 'remote',
        startTime: '14:00',
        endTime: '15:30'
      },
      {
        date: tomorrow.toISOString().split('T')[0],
        userId: 1,
        title: 'プロジェクト計画',
        workType: 'office',
        startTime: '09:30',
        endTime: '17:00'
      }
    ];
  }
} 