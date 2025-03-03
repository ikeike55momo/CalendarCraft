import { Handler } from '@netlify/functions';
import { GoogleSheetsService } from '../../server/services/sheets';

const handler: Handler = async (event) => {
  // CORSヘッダーを設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONSリクエスト（プリフライトリクエスト）への対応
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // POSTリクエストのみ許可
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // 環境変数のデバッグ情報
    const envDebug = {
      hasGoogleCredentialsJson: !!process.env.GOOGLE_CREDENTIALS_JSON,
      hasGoogleApplicationCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      nodeEnv: process.env.NODE_ENV
    };

    // リクエストボディからパラメータを取得
    const { spreadsheetId, sheetName } = JSON.parse(event.body || '{}');
    
    if (!spreadsheetId || !sheetName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'スプレッドシートIDとシート名が必要です',
          debug: envDebug
        }),
      };
    }
    
    // GoogleSheetsServiceのインスタンスを作成
    const sheetsService = new GoogleSheetsService();
    
    // スプレッドシートからデータを取得
    const range = `${sheetName}!A:G`;  // 範囲を指定（A列からG列まで）
    const events = await sheetsService.getScheduleData(spreadsheetId, range);
    
    // イベントデータをカレンダー用に変換
    const calendarEvents = sheetsService.convertToInsertEvents(events);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        events: calendarEvents,
        count: calendarEvents.length,
        debug: envDebug
      }),
    };
  } catch (error) {
    console.error('スプレッドシートインポートエラー:', error);
    
    // エラー情報を詳細に取得
    const errorDetails = error instanceof Error 
      ? { 
          message: error.message, 
          stack: error.stack,
          name: error.name
        } 
      : 'Unknown error';
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'スプレッドシートのインポート中にエラーが発生しました',
        details: errorDetails,
        debug: {
          hasGoogleCredentialsJson: !!process.env.GOOGLE_CREDENTIALS_JSON,
          hasGoogleApplicationCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
          nodeEnv: process.env.NODE_ENV
        }
      }),
    };
  }
};

export { handler }; 