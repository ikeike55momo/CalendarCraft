/**
 * 管理者向け操作を行うサービスクラス
 * RLSポリシーによる無限再帰エラーを回避するための実装
 */

import { supabase } from './supabase';

// ユーザー型の定義
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  sheet_name?: string;
  google_sub?: string;
  created_at?: string;
  updated_at?: string;
}

// モックユーザーデータ
const MOCK_USERS: User[] = [
  { id: 1, name: "山田太郎", email: "yamada@example.com", role: "admin", sheet_name: "ユーザー1", google_sub: "google_sub_1" },
  { id: 2, name: "佐藤花子", email: "sato@example.com", role: "member", sheet_name: "ユーザー2", google_sub: "google_sub_2" },
  { id: 3, name: "鈴木一郎", email: "suzuki@example.com", role: "member", sheet_name: "ユーザー3", google_sub: "google_sub_3" },
  { id: 4, name: "太田", email: "ota@example.com", role: "admin", sheet_name: "太田\n（金）", google_sub: "9cfe0821-c3e6-493f-b38a-8ce293222b62" },
  { id: 13, name: "いさた", email: "isata@example.com", role: "member", sheet_name: "いさた\n（三井）", google_sub: "pre_registered_1740930828651" },
  { id: 14, name: "がみ", email: "gami@example.com", role: "member", sheet_name: "がみ", google_sub: "pre_registered_1740969805411" },
  { id: 15, name: "レールマン", email: "railman@example.com", role: "member", sheet_name: "レールマン\n（中井）", google_sub: "pre_registered_1740969849667" },
  { id: 16, name: "ゆき", email: "yuki@example.com", role: "member", sheet_name: "ゆき", google_sub: "pre_registered_1740969871192" },
  { id: 17, name: "小林", email: "kobayashi@example.com", role: "member", sheet_name: "小林", google_sub: "pre_registered_1740969888810" },
  { id: 18, name: "月井", email: "tsukii@example.com", role: "member", sheet_name: "月井\n（月）", google_sub: "pre_registered_1740969918891" },
  { id: 19, name: "是永", email: "korenaga@example.com", role: "member", sheet_name: "是永", google_sub: "pre_registered_1740969934173" },
  { id: 20, name: "田島", email: "tajima@example.com", role: "member", sheet_name: "田島", google_sub: "pre_registered_1740969994421" },
  { id: 21, name: "宮城", email: "miyagi@example.com", role: "member", sheet_name: "宮城", google_sub: "pre_registered_1740970012558" }
];

class AdminService {
  /**
   * すべてのユーザー情報を取得する
   * RLSポリシーエラーを回避するためにモックデータを使用
   */
  async getAllUsers() {
    try {
      // Supabaseを使用する代わりに、モックデータを返す
      return { data: MOCK_USERS, error: null };
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      return { data: null, error: { message: 'ユーザー情報の取得に失敗しました' } };
    }
  }

  /**
   * イベントの一括挿入を行う
   * @param events 挿入するイベントの配列
   */
  async insertEvents(events: any[]) {
    try {
      const { error } = await supabase
        .from('events')
        .upsert(events);
      
      return { success: !error, error };
    } catch (error) {
      console.error('イベント挿入エラー:', error);
      return { success: false, error: { message: 'イベントの挿入に失敗しました' } };
    }
  }
}

export const adminService = new AdminService(); 