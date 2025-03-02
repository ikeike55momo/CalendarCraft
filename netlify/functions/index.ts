import { Handler } from '@netlify/functions';
import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import { setupRoutes } from '../../server/routes';

// レスポンスの型定義
interface ServerlessResponse {
  statusCode?: number;
  headers?: { [key: string]: string | number | boolean };
  body?: string;
  isBase64Encoded?: boolean;
}

// Expressアプリケーションの設定
const app = express();
app.use(cors());
app.use(express.json());

// setupRoutesを使用してルートを設定
setupRoutes(app);

// Netlify Functionsのハンドラー
const handler: Handler = async (event, context) => {
  // serverless-httpを使用してExpressアプリをラップ
  const serverlessHandler = serverless(app);
  const response = await serverlessHandler(event, context) as ServerlessResponse;
  
  // HandlerResponseの形式に合わせて返す
  return {
    statusCode: response.statusCode || 200,
    headers: response.headers || {},
    body: response.body || '',
    isBase64Encoded: response.isBase64Encoded || false
  };
};

export { handler }; 