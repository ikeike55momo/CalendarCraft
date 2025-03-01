import { supabase } from './supabase';
import { mockDataService } from './mockService';
import { Database } from '@/types/supabase';

// 開発環境かどうかを判定
const isDevelopment = import.meta.env.DEV;
const useSupabaseMock = isDevelopment && (import.meta.env.VITE_SUPABASE_URL === 'https://your-supabase-project-url.supabase.co' || !import.meta.env.VITE_SUPABASE_URL);

// データサービスの作成
export const dataService = useSupabaseMock ? mockDataService : {
  // ユーザー関連
  users: {
    // 全ユーザーを取得
    getAll: async () => {
      return await supabase
        .from('users')
        .select('*');
    },
    
    // IDでユーザーを取得
    getById: async (id: number) => {
      return await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
    },
    
    // Google SUBでユーザーを取得
    getByGoogleSub: async (googleSub: string) => {
      return await supabase
        .from('users')
        .select('*')
        .eq('google_sub', googleSub)
        .single();
    }
  },
  
  // イベント関連
  events: {
    // 全イベントを取得
    getAll: async () => {
      return await supabase
        .from('events')
        .select('*');
    },
    
    // ユーザーIDでイベントを取得
    getByUserId: async (userId: number) => {
      return await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId);
    },
    
    // イベントを作成
    create: async (event: Omit<Database['public']['Tables']['events']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
      return await supabase
        .from('events')
        .insert(event)
        .select()
        .single();
    },
    
    // イベントを更新
    update: async (id: string, event: Partial<Database['public']['Tables']['events']['Update']>) => {
      return await supabase
        .from('events')
        .update(event)
        .eq('id', id)
        .select()
        .single();
    },
    
    // イベントを削除
    delete: async (id: string) => {
      return await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .select()
        .single();
    }
  },
  
  // 勤怠関連
  attendance: {
    // 全勤怠を取得
    getAll: async () => {
      return await supabase
        .from('attendance')
        .select('*');
    },
    
    // ユーザーIDで勤怠を取得
    getByUserId: async (userId: number) => {
      return await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId);
    },
    
    // 日付とユーザーIDで勤怠を取得
    getByDateAndUserId: async (date: string, userId: number) => {
      return await supabase
        .from('attendance')
        .select('*')
        .eq('date', date)
        .eq('user_id', userId)
        .single();
    },
    
    // 勤怠を作成または更新
    upsert: async (attendance: Omit<Database['public']['Tables']['attendance']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
      return await supabase
        .from('attendance')
        .upsert(
          { ...attendance },
          { onConflict: 'user_id,date' }
        )
        .select()
        .single();
    }
  },
  
  // プロジェクト関連
  projects: {
    // 全プロジェクトを取得
    getAll: async () => {
      return await supabase
        .from('projects')
        .select('*');
    },
    
    // IDでプロジェクトを取得
    getById: async (id: string) => {
      return await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
    },
    
    // プロジェクトを作成
    create: async (project: Omit<Database['public']['Tables']['projects']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
      return await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();
    },
    
    // プロジェクトを更新
    update: async (id: string, project: Partial<Database['public']['Tables']['projects']['Update']>) => {
      return await supabase
        .from('projects')
        .update(project)
        .eq('id', id)
        .select()
        .single();
    },
    
    // プロジェクトを削除
    delete: async (id: string) => {
      return await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .select()
        .single();
    },
    
    // プロジェクトメンバーを取得
    getMembers: async (projectId: string) => {
      return await supabase
        .from('project_members')
        .select('users(*)')
        .eq('project_id', projectId);
    },
    
    // ユーザーのプロジェクトを取得
    getUserProjects: async (userId: number) => {
      return await supabase
        .from('project_members')
        .select('projects(*)')
        .eq('user_id', userId);
    }
  },
  
  // タスク関連
  tasks: {
    // 全タスクを取得
    getAll: async () => {
      return await supabase
        .from('tasks')
        .select('*');
    },
    
    // ユーザーIDでタスクを取得
    getByUserId: async (userId: number) => {
      return await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);
    },
    
    // プロジェクトIDでタスクを取得
    getByProjectId: async (projectId: string) => {
      return await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId);
    },
    
    // タスクを作成
    create: async (task: Omit<Database['public']['Tables']['tasks']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
      return await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();
    },
    
    // タスクを更新
    update: async (id: string, task: Partial<Database['public']['Tables']['tasks']['Update']>) => {
      return await supabase
        .from('tasks')
        .update(task)
        .eq('id', id)
        .select()
        .single();
    },
    
    // タスクを削除
    delete: async (id: string) => {
      return await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .select()
        .single();
    }
  }
}; 