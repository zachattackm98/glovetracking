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
      assets: {
        Row: {
          id: string
          org_id: string
          serial_number: string
          asset_class: string
          glove_size: string | null
          glove_color: string | null
          issue_date: string
          last_certification_date: string
          next_certification_date: string
          status: string
          failure_date: string | null
          failure_reason: string | null
          testing_start_date: string | null
          assigned_user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          serial_number: string
          asset_class: string
          glove_size?: string | null
          glove_color?: string | null
          issue_date: string
          last_certification_date: string
          next_certification_date: string
          status: string
          failure_date?: string | null
          failure_reason?: string | null
          testing_start_date?: string | null
          assigned_user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          serial_number?: string
          asset_class?: string
          glove_size?: string | null
          glove_color?: string | null
          issue_date?: string
          last_certification_date?: string
          next_certification_date?: string
          status?: string
          failure_date?: string | null
          failure_reason?: string | null
          testing_start_date?: string | null
          assigned_user_id?: string | null
          created_at?: string
        }
      }
      certification_documents: {
        Row: {
          id: string
          asset_id: string
          file_name: string
          file_url: string
          upload_date: string
          uploaded_by: string
          org_id: string
          created_at: string
        }
        Insert: {
          id?: string
          asset_id: string
          file_name: string
          file_url: string
          upload_date?: string
          uploaded_by: string
          org_id: string
          created_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          file_name?: string
          file_url?: string
          upload_date?: string
          uploaded_by?: string
          org_id?: string
          created_at?: string
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