export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          google_sub: string
          sheet_name: string
          name: string
          email: string
          role: string
          created_at: string
          updated_at: string
          google_access_token: string | null
          tokens: Json | null
          google_refresh_token: string | null
        }
        Insert: {
          id?: number
          google_sub: string
          sheet_name: string
          name: string
          email: string
          role?: string
          created_at?: string
          updated_at?: string
          google_access_token?: string | null
          tokens?: Json | null
          google_refresh_token?: string | null
        }
        Update: {
          id?: number
          google_sub?: string
          sheet_name?: string
          name?: string
          email?: string
          role?: string
          created_at?: string
          updated_at?: string
          google_access_token?: string | null
          tokens?: Json | null
          google_refresh_token?: string | null
        }
      }
      events: {
        Row: {
          id: string
          user_id: number
          title: string
          description: string | null
          start_time: string
          end_time: string
          work_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: number
          title: string
          description?: string | null
          start_time: string
          end_time: string
          work_type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: number
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          work_type?: string
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          user_id: number
          date: string
          attendance_log: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: number
          date: string
          attendance_log?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: number
          date?: string
          attendance_log?: Json
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: number
          title: string
          project_id: string | null
          tag: string | null
          due_date: string | null
          detail: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: number
          title: string
          project_id?: string | null
          tag?: string | null
          due_date?: string | null
          detail?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: number
          title?: string
          project_id?: string | null
          tag?: string | null
          due_date?: string | null
          detail?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          tag: string | null
          detail: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          tag?: string | null
          detail?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          tag?: string | null
          detail?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
