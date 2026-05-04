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
        Relationships: []
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
          last_analysis_id: string | null // FK → analyses.id (most recent analysis)
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
          last_analysis_id?: string | null // FK → analyses.id (most recent analysis)
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
          last_analysis_id?: string | null // FK → analyses.id (most recent analysis)
          updated_at?: string
        }
        Relationships: []
      }
      analyses: {
        Row: {
          id: string
          resume_id: string
          user_id: string
          job_id: string | null
          job_title: string | null
          job_description: string | null
          company_name: string | null
          status: 'pending' | 'processing' | 'completed' | 'error'
          ats_score: number | null
          keyword_score: number | null
          format_score: number | null
          experience_score: number | null
          skills_match: Json | null
          matched_skills: Json | null
          missing_keywords: Json | null
          suggestions: Json | null
          strengths: Json | null
          weaknesses: Json | null
          summary: string | null
          result: Json | null
          error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resume_id: string
          user_id: string
          job_id?: string | null
          job_title?: string | null
          job_description?: string | null
          company_name?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'error'
          ats_score?: number | null
          keyword_score?: number | null
          format_score?: number | null
          experience_score?: number | null
          skills_match?: Json | null
          matched_skills?: Json | null
          missing_keywords?: Json | null
          suggestions?: Json | null
          strengths?: Json | null
          weaknesses?: Json | null
          summary?: string | null
          result?: Json | null
          error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          job_id?: string | null
          job_title?: string | null
          job_description?: string | null
          company_name?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'error'
          ats_score?: number | null
          keyword_score?: number | null
          format_score?: number | null
          experience_score?: number | null
          skills_match?: Json | null
          matched_skills?: Json | null
          missing_keywords?: Json | null
          suggestions?: Json | null
          strengths?: Json | null
          weaknesses?: Json | null
          summary?: string | null
          result?: Json | null
          error?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resume_versions: {
        Row: {
          id: string
          user_id: string
          resume_id: string
          analysis_id: string | null
          version_type: 'original' | 'refined' | 'manual'
          latex_content: string
          modifications: Json
          version_label: string | null
          source: 'manual' | 'ai_refined' | 'ai_generated' | 'template'
          job_title: string | null
          company: string | null
          ats_score: number | null
          diff_summary: string | null
          is_favorite: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          resume_id: string
          analysis_id?: string | null
          version_type: 'original' | 'refined' | 'manual'
          latex_content: string
          modifications?: Json
          version_label?: string | null
          source?: 'manual' | 'ai_refined' | 'ai_generated' | 'template'
          job_title?: string | null
          company?: string | null
          ats_score?: number | null
          diff_summary?: string | null
          is_favorite?: boolean
          created_at?: string
        }
        Update: {
          version_type?: 'original' | 'refined' | 'manual'
          latex_content?: string
          modifications?: Json
          version_label?: string | null
          source?: 'manual' | 'ai_refined' | 'ai_generated' | 'template'
          job_title?: string | null
          company?: string | null
          ats_score?: number | null
          diff_summary?: string | null
          is_favorite?: boolean
        }
        Relationships: []
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
        Relationships: []
      }
      cover_letters: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string;
          job_id: string | null;
          content: string;
          job_title: string | null;
          company_name: string | null;
          format: 'markdown' | 'latex';
          tone: 'professional' | 'enthusiastic' | 'formal';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id: string;
          job_id?: string | null;
          content: string;
          job_title?: string | null;
          company_name?: string | null;
          format?: 'markdown' | 'latex';
          tone?: 'professional' | 'enthusiastic' | 'formal';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_id?: string;
          job_id?: string | null;
          content?: string;
          job_title?: string | null;
          company_name?: string | null;
          format?: 'markdown' | 'latex';
          tone?: 'professional' | 'enthusiastic' | 'formal';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: []
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
