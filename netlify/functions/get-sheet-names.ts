import { Handler } from '@netlify/functions';
import { GoogleSheetsService } from '../../server/services/sheets';

const handler: Handler = async (event) => {
  // POSTリクエストのみ許可
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // リクエストボディからスプレッドシートIDを取得
    const { spreadsheetId } = JSON.parse(event.body || '{}');
    
    if (!spreadsheetId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'スプレッドシートIDが必要です' }),
      };
    }
    
    // GoogleSheetsServiceのインスタンスを作成
    const sheetsService = new GoogleSheetsService();
    
    // シート名一覧を取得
    const sheetNames = await sheetsService.getSheetNames(spreadsheetId);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ sheetNames }),
    };
  } catch (error) {
    console.error('シート名取得エラー:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'シート名の取得中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler }; 