import { Database } from '@/types/supabase';

// ユーザーのモックデータ
export const mockUsers: Database['public']['Tables']['users']['Row'][] = [
  {
    id: 1,
    google_sub: 'google_sub_1',
    sheet_name: 'ユーザー1',
    name: '山田太郎',
    email: 'yamada@example.com',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    google_sub: 'google_sub_2',
    sheet_name: 'ユーザー2',
    name: '佐藤花子',
    email: 'sato@example.com',
    role: 'member',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    google_sub: 'google_sub_3',
    sheet_name: 'ユーザー3',
    name: '鈴木一郎',
    email: 'suzuki@example.com',
    role: 'member',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// イベントのモックデータ
export const mockEvents: Database['public']['Tables']['events']['Row'][] = [
  {
    id: '1',
    user_id: 1,
    title: '会議',
    description: '週次ミーティング',
    start_time: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
    work_type: '出勤',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 1,
    title: 'クライアントMTG',
    description: 'A社との打ち合わせ',
    start_time: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(15, 30, 0, 0)).toISOString(),
    work_type: '出勤',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    user_id: 2,
    title: 'プロジェクトA作業',
    description: 'デザイン作成',
    start_time: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(),
    work_type: 'テレワーク',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// 勤怠のモックデータ
export const mockAttendance: Database['public']['Tables']['attendance']['Row'][] = [
  {
    id: '1',
    user_id: 1,
    date: new Date().toISOString().split('T')[0],
    attendance_log: {
      start: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
      breaks: [
        {
          start: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
          end: new Date(new Date().setHours(13, 0, 0, 0)).toISOString()
        }
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 2,
    date: new Date().toISOString().split('T')[0],
    attendance_log: {
      start: new Date(new Date().setHours(9, 30, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(17, 30, 0, 0)).toISOString(),
      breaks: [
        {
          start: new Date(new Date().setHours(12, 30, 0, 0)).toISOString(),
          end: new Date(new Date().setHours(13, 30, 0, 0)).toISOString()
        }
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// プロジェクトのモックデータ
export const mockProjects: Database['public']['Tables']['projects']['Row'][] = [
  {
    id: '1',
    name: 'プロジェクトA',
    tag: 'デザイン',
    detail: 'Webサイトリニューアル',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'プロジェクトB',
    tag: '開発',
    detail: 'モバイルアプリ開発',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// タスクのモックデータ
export const mockTasks: Database['public']['Tables']['tasks']['Row'][] = [
  {
    id: '1',
    user_id: 1,
    title: 'デザイン作成',
    project_id: '1',
    tag: 'デザイン',
    due_date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0],
    detail: 'トップページのデザイン作成',
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 2,
    title: 'API実装',
    project_id: '2',
    tag: '開発',
    due_date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
    detail: 'ユーザー認証APIの実装',
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    user_id: 1,
    title: 'ミーティング資料作成',
    project_id: null,
    tag: '会議',
    due_date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
    detail: '週次ミーティングの資料作成',
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// プロジェクトメンバーのモックデータ
export const mockProjectMembers: Database['public']['Tables']['project_members']['Row'][] = [
  {
    id: '1',
    project_id: '1',
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    project_id: '1',
    user_id: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    project_id: '2',
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    project_id: '2',
    user_id: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]; 