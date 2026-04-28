export interface CoverLetter {
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
}

export interface GenerateCoverLetterRequest {
  resumeId: string;
  jobId?: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  tone?: 'professional' | 'enthusiastic' | 'formal';
  format?: 'markdown' | 'latex';
}

export interface GenerateCoverLetterResponse {
  success: boolean;
  data?: {
    id: string;
    content: string;
    format: string;
  };
  error?: string;
}

export interface CoverLetterListItem {
  id: string;
  job_title: string | null;
  company_name: string | null;
  format: string;
  created_at: string;
}
