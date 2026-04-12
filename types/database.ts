export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    PostgrestVersion: "12"
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          title: string
          file_url: string
          file_name: string
          file_type: string
          file_size: number
          parsed_text: string | null
          parsed_data: Json | null
          embedding: number[] | null
          status: 'uploaded' | 'parsing' | 'parsed' | 'error'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          file_url: string
          file_name: string
          file_type: string
          file_size: number
          parsed_text?: string | null
          parsed_data?: Json | null
          embedding?: number[] | null
          status?: 'uploaded' | 'parsing' | 'parsed' | 'error'
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          file_url?: string
          file_name?: string
          file_type?: string
          file_size?: number
          parsed_text?: string | null
          parsed_data?: Json | null
          embedding?: number[] | null
          status?: 'uploaded' | 'parsing' | 'parsed' | 'error'
          updated_at?: string
        }
      }
      analyses: {
        Row: {
          id: string
          resume_id: string
          user_id: string
          job_title: string | null
          job_description: string | null
          company_name: string | null
          ats_score: number | null
          keyword_score: number | null
          format_score: number | null
          experience_score: number | null
          skills_match: Json | null
          missing_keywords: string[] | null
          suggestions: Json | null
          matched_skills: string[] | null
          status: 'pending' | 'processing' | 'completed' | 'error'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resume_id: string
          user_id: string
          job_title?: string | null
          job_description?: string | null
          company_name?: string | null
          ats_score?: number | null
          keyword_score?: number | null
          format_score?: number | null
          experience_score?: number | null
          skills_match?: Json | null
          missing_keywords?: string[] | null
          suggestions?: Json | null
          matched_skills?: string[] | null
          status?: 'pending' | 'processing' | 'completed' | 'error'
          created_at?: string
          updated_at?: string
        }
        Update: {
          job_title?: string | null
          job_description?: string | null
          company_name?: string | null
          ats_score?: number | null
          keyword_score?: number | null
          format_score?: number | null
          experience_score?: number | null
          skills_match?: Json | null
          missing_keywords?: string[] | null
          suggestions?: Json | null
          matched_skills?: string[] | null
          status?: 'pending' | 'processing' | 'completed' | 'error'
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          user_id: string
          type: 'parse_resume' | 'analyze_match'
          status: 'pending' | 'processing' | 'completed' | 'failed'
          payload: Json
          result: Json | null
          error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'parse_resume' | 'analyze_match'
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          payload: Json
          result?: Json | null
          error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          result?: Json | null
          error?: string | null
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
