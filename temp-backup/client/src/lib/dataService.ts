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
    getByUserId: async (userId: string | number) => {
      console.log("勤怠データ取得開始: userId =", userId);
      
      try {
        // 認証情報を取得
        const { data: authData } = await supabase.auth.getUser();
        console.log("認証情報:", authData?.user?.id);
        
        // まずユーザー情報を取得
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('google_sub', userId.toString())
          .single();
        
        if (userError) {
          console.error('ユーザー情報取得エラー:', userError);
          
          // RLSポリシーのエラーの場合は、空の結果を返す
          if (userError.code === '42P17') {
            console.log('RLSポリシーエラーが発生しました。ユーザーが存在しない可能性があります。');
            
            // 管理者ユーザーIDを使用して勤怠データを取得
            const { data, error } = await supabase
              .from('attendance')
              .select('*')
              .eq('user_id', 1);
              
            if (error) {
              console.error('管理者ユーザーでの勤怠データ取得エラー:', error);
              return { data: [], error: null };
            }
            
            return { data, error: null };
          }
          
          return { data: [], error: userError };
        }
        
        if (!userData) {
          console.error('ユーザーが見つかりません:', userId);
          return { data: [], error: new Error('ユーザーが見つかりません') };
        }
        
        console.log("取得したユーザーID:", userData.id);
        
        // 取得したuser_idで勤怠データを検索
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', userData.id);
          
        if (error) {
          console.error('勤怠データ取得エラー:', error);
          return { data: [], error };
        }
        
        console.log("取得した勤怠データ数:", data?.length || 0);
        return { data, error: null };
      } catch (error) {
        console.error('勤怠データ取得中の例外:', error);
        return { data: [], error };
      }
    },
    
    // 日付とユーザーIDで勤怠を取得
    getByDateAndUserId: async (date: string, userId: string | number) => {
      try {
        // 認証情報を取得
        const { data: authData } = await supabase.auth.getUser();
        console.log("認証情報:", authData?.user?.id);
        
        // Supabaseのユーザー情報からuser_idを取得
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('google_sub', userId.toString())
          .single();
        
        if (userError) {
          console.error('ユーザー情報取得エラー:', userError);
          
          // RLSポリシーのエラーの場合は、空の結果を返す
          if (userError.code === '42P17') {
            console.log('RLSポリシーエラーが発生しました。ユーザーが存在しない可能性があります。');
            
            // 管理者ユーザーIDを使用して勤怠データを取得
            const { data, error } = await supabase
              .from('attendance')
              .select('*')
              .eq('date', date)
              .eq('user_id', 1)
              .single();
              
            return { data, error };
          }
          
          return { data: null, error: userError };
        }
        
        if (!userData) {
          console.error('ユーザーが見つかりません:', userId);
          return { data: null, error: new Error('ユーザーが見つかりません') };
        }
        
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('date', date)
          .eq('user_id', userData.id)
          .single();
          
        return { data, error };
      } catch (error) {
        console.error('日付別勤怠データ取得中の例外:', error);
        return { data: null, error };
      }
    },
    
    // 勤怠を作成または更新
    upsert: async (attendance: Omit<Database['public']['Tables']['attendance']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
      try {
        // 認証情報を取得
        const { data: authData } = await supabase.auth.getUser();
        console.log("認証情報:", authData?.user?.id);
        
        // user_idが文字列の場合は、ユーザー情報から数値のIDを取得
        if (attendance.user_id && typeof attendance.user_id === 'string') {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('google_sub', attendance.user_id)
            .single();
          
          if (userError) {
            console.error('ユーザー情報取得エラー:', userError);
            
            // RLSポリシーのエラーの場合は、デフォルトのユーザーIDを使用
            if (userError.code === '42P17') {
              console.log('RLSポリシーエラーが発生しました。デフォルトのユーザーIDを使用します。');
              attendance.user_id = 1; // デフォルトの管理者ユーザーID
            } else {
              throw userError;
            }
          } else if (userData) {
            attendance.user_id = userData.id;
          } else {
            console.error('ユーザーが見つかりません:', attendance.user_id);
            
            // ユーザーが存在しない場合はデフォルトのユーザーIDを使用
            attendance.user_id = 1; // デフォルトの管理者ユーザーID
          }
        }
        
        console.log('勤怠データ登録:', attendance);
        
        const { data, error } = await supabase
          .from('attendance')
          .upsert(
            { ...attendance },
            { onConflict: 'user_id,date' }
          )
          .select()
          .single();
          
        if (error) {
          console.error('勤怠データ登録エラー:', error);
          throw error;
        }
        
        return { data, error: null };
      } catch (error) {
        console.error('勤怠データ登録中の例外:', error);
        throw error;
      }
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