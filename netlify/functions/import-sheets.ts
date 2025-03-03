import { Handler } from '@netlify/functions';
import { GoogleSheetsService } from '../../server/services/sheets';
import { supabase } from '../../client/src/lib/supabase';

const handler: Handler = async (event) => {
  // POSTリクエストのみ許可
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // リクエストボディからスプレッドシートIDと範囲を取得
    const { spreadsheetId, range } = JSON.parse(event.body || '{}');
    
    if (!spreadsheetId || !range) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'スプレッドシートIDと範囲が必要です' }),
      };
    }
    
    // GoogleSheetsServiceのインスタンスを作成
    const sheetsService = new GoogleSheetsService();
    
    // スプレッドシートからデータを取得
    const sheetEvents = await sheetsService.getScheduleData(spreadsheetId, range);
    
    if (sheetEvents.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'インポートするデータがありません', 
          count: 0 
        }),
      };
    }
    
    // シートイベントをInsertEvent形式に変換
    const insertEvents = sheetsService.convertToInsertEvents(sheetEvents);
    
    // インポートしたデータをDBに保存
    let importedCount = 0;
    
    for (const event of insertEvents) {
      // Supabaseにイベントを挿入
      const { error } = await supabase
        .from('events')
        .insert([{
          user_id: event.userId,
          title: event.title,
          start_time: event.startTime,
          end_time: event.endTime,
          work_type: event.workType
        }]);
      
      if (error) {
        console.error('Event insert error:', error);
        continue;
      }
      
      importedCount++;
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'スプレッドシートからデータをインポートしました', 
        count: importedCount 
      }),
    };
  } catch (error) {
    console.error('スプレッドシートインポートエラー:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'インポート中にエラーが発生しました', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler }; 