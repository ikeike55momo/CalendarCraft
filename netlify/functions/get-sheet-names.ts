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

    // リクエストボディからスプレッドシートIDを取得
    const { spreadsheetId } = JSON.parse(event.body || '{}');
    
    if (!spreadsheetId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'スプレッドシートIDが必要です',
          debug: envDebug 
        }),
      };
    }
    
    // GoogleSheetsServiceのインスタンスを作成
    const sheetsService = new GoogleSheetsService();
    
    // シート名一覧を取得
    const sheetNames = await sheetsService.getSheetNames(spreadsheetId);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        sheetNames,
        debug: envDebug 
      }),
    };
  } catch (error) {
    console.error('シート名取得エラー:', error);
    
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
        error: 'シート名の取得中にエラーが発生しました',
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