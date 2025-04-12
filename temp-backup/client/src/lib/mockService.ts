import { mockUsers, mockEvents, mockAttendance, mockProjects, mockTasks, mockProjectMembers } from './mockData';
import { Database } from '@/types/supabase';

// モックセッションデータ
export const mockSession = {
  user: {
    id: 'user_id_1',
    email: 'yamada@example.com',
    user_metadata: {
      name: '山田太郎',
      role: 'admin'
    }
  },
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  expires_at: Date.now() + 3600
};

// モック認証サービス
export const mockAuthService = {
  // 現在のセッションを取得
  getSession: async () => {
    return { data: { session: mockSession } };
  },
  
  // ユーザー情報を取得
  getUser: async () => {
    return { data: { user: mockSession.user } };
  },
  
  // Googleでログイン
  signInWithOAuth: async ({ provider }: { provider: string }) => {
    console.log(`${provider}でログイン`);
    return { data: {}, error: null };
  },
  
  // ログアウト
  signOut: async () => {
    console.log('ログアウト');
    return { error: null };
  },
  
  // 認証状態の変更を監視
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    // 初期状態で認証済みとする
    setTimeout(() => {
      callback('SIGNED_IN', mockSession);
    }, 100);
    
    return {
      data: {
        subscription: {
          unsubscribe: () => console.log('認証監視を解除')
        }
      }
    };
  }
};

// モックデータサービス
export const mockDataService = {
  // ユーザー関連
  users: {
    // 全ユーザーを取得
    getAll: async () => {
      return { data: mockUsers, error: null };
    },
    
    // IDでユーザーを取得
    getById: async (id: number) => {
      const user = mockUsers.find(user => user.id === id);
      return { data: user, error: user ? null : new Error('ユーザーが見つかりません') };
    },
    
    // Google SUBでユーザーを取得
    getByGoogleSub: async (googleSub: string) => {
      const user = mockUsers.find(user => user.google_sub === googleSub);
      return { data: user, error: user ? null : new Error('ユーザーが見つかりません') };
    }
  },
  
  // イベント関連
  events: {
    // 全イベントを取得
    getAll: async () => {
      return { data: mockEvents, error: null };
    },
    
    // ユーザーIDでイベントを取得
    getByUserId: async (userId: number) => {
      const events = mockEvents.filter(event => event.user_id === userId);
      return { data: events, error: null };
    },
    
    // イベントを作成
    create: async (event: Omit<Database['public']['Tables']['events']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
      const newEvent = {
        ...event,
        id: `${mockEvents.length + 1}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockEvents.push(newEvent as any);
      return { data: newEvent, error: null };
    },
    
    // イベントを更新
    update: async (id: string, event: Partial<Database['public']['Tables']['events']['Update']>) => {
      const index = mockEvents.findIndex(e => e.id === id);
      if (index === -1) {
        return { data: null, error: new Error('イベントが見つかりません') };
      }
      
      mockEvents[index] = {
        ...mockEvents[index],
        ...event,
        updated_at: new Date().toISOString()
      };
      
      return { data: mockEvents[index], error: null };
    },
    
    // イベントを削除
    delete: async (id: string) => {
      const index = mockEvents.findIndex(e => e.id === id);
      if (index === -1) {
        return { data: null, error: new Error('イベントが見つかりません') };
      }
      
      const deletedEvent = mockEvents.splice(index, 1)[0];
      return { data: deletedEvent, error: null };
    }
  },
  
  // 勤怠関連
  attendance: {
    // 全勤怠を取得
    getAll: async () => {
      return { data: mockAttendance, error: null };
    },
    
    // ユーザーIDで勤怠を取得
    getByUserId: async (userId: number) => {
      const attendance = mockAttendance.filter(a => a.user_id === userId);
      return { data: attendance, error: null };
    },
    
    // 日付とユーザーIDで勤怠を取得
    getByDateAndUserId: async (date: string, userId: number) => {
      const attendance = mockAttendance.find(a => a.date === date && a.user_id === userId);
      return { data: attendance, error: attendance ? null : new Error('勤怠が見つかりません') };
    },
    
    // 勤怠を作成または更新
    upsert: async (attendance: Omit<Database['public']['Tables']['attendance']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
      const existingIndex = mockAttendance.findIndex(a => a.date === attendance.date && a.user_id === attendance.user_id);
      
      if (existingIndex !== -1) {
        // 更新
        mockAttendance[existingIndex] = {
          ...mockAttendance[existingIndex],
          ...attendance,
          updated_at: new Date().toISOString()
        };
        
        return { data: mockAttendance[existingIndex], error: null };
      } else {
        // 作成
        const newAttendance = {
          ...attendance,
          id: `${mockAttendance.length + 1}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        mockAttendance.push(newAttendance as any);
        return { data: newAttendance, error: null };
      }
    }
  },
  
  // プロジェクト関連
  projects: {
    // 全プロジェクトを取得
    getAll: async () => {
      return { data: mockProjects, error: null };
    },
    
    // IDでプロジェクトを取得
    getById: async (id: string) => {
      const project = mockProjects.find(p => p.id === id);
      return { data: project, error: project ? null : new Error('プロジェクトが見つかりません') };
    },
    
    // プロジェクトを作成
    create: async (project: Omit<Database['public']['Tables']['projects']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
      const newProject = {
        ...project,
        id: `${mockProjects.length + 1}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockProjects.push(newProject as any);
      return { data: newProject, error: null };
    },
    
    // プロジェクトを更新
    update: async (id: string, project: Partial<Database['public']['Tables']['projects']['Update']>) => {
      const index = mockProjects.findIndex(p => p.id === id);
      if (index === -1) {
        return { data: null, error: new Error('プロジェクトが見つかりません') };
      }
      
      mockProjects[index] = {
        ...mockProjects[index],
        ...project,
        updated_at: new Date().toISOString()
      };
      
      return { data: mockProjects[index], error: null };
    },
    
    // プロジェクトを削除
    delete: async (id: string) => {
      const index = mockProjects.findIndex(p => p.id === id);
      if (index === -1) {
        return { data: null, error: new Error('プロジェクトが見つかりません') };
      }
      
      const deletedProject = mockProjects.splice(index, 1)[0];
      return { data: deletedProject, error: null };
    },
    
    // プロジェクトメンバーを取得
    getMembers: async (projectId: string) => {
      const memberIds = mockProjectMembers
        .filter(pm => pm.project_id === projectId)
        .map(pm => pm.user_id);
      
      const members = mockUsers.filter(user => memberIds.includes(user.id));
      return { data: members, error: null };
    },
    
    // ユーザーのプロジェクトを取得
    getUserProjects: async (userId: number) => {
      const projectIds = mockProjectMembers
        .filter(pm => pm.user_id === userId)
        .map(pm => pm.project_id);
      
      const projects = mockProjects.filter(project => projectIds.includes(project.id));
      return { data: projects, error: null };
    }
  },
  
  // タスク関連
  tasks: {
    // 全タスクを取得
    getAll: async () => {
      return { data: mockTasks, error: null };
    },
    
    // ユーザーIDでタスクを取得
    getByUserId: async (userId: number) => {
      const tasks = mockTasks.filter(task => task.user_id === userId);
      return { data: tasks, error: null };
    },
    
    // プロジェクトIDでタスクを取得
    getByProjectId: async (projectId: string) => {
      const tasks = mockTasks.filter(task => task.project_id === projectId);
      return { data: tasks, error: null };
    },
    
    // タスクを作成
    create: async (task: Omit<Database['public']['Tables']['tasks']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
      const newTask = {
        ...task,
        id: `${mockTasks.length + 1}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockTasks.push(newTask as any);
      return { data: newTask, error: null };
    },
    
    // タスクを更新
    update: async (id: string, task: Partial<Database['public']['Tables']['tasks']['Update']>) => {
      const index = mockTasks.findIndex(t => t.id === id);
      if (index === -1) {
        return { data: null, error: new Error('タスクが見つかりません') };
      }
      
      mockTasks[index] = {
        ...mockTasks[index],
        ...task,
        updated_at: new Date().toISOString()
      };
      
      return { data: mockTasks[index], error: null };
    },
    
    // タスクを削除
    delete: async (id: string) => {
      const index = mockTasks.findIndex(t => t.id === id);
      if (index === -1) {
        return { data: null, error: new Error('タスクが見つかりません') };
      }
      
      const deletedTask = mockTasks.splice(index, 1)[0];
      return { data: deletedTask, error: null };
    }
  }
}; 