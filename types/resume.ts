export interface ResumeContact {
  name: string
  email: string
  phone: string
  location: string
  linkedin: string
  website: string
}

export interface ResumeExperience {
  company: string
  title: string
  location: string
  start_date: string
  end_date: string
  current: boolean
  description: string[]
}

export interface ResumeEducation {
  institution: string
  degree: string
  field: string
  start_date: string
  end_date: string
  gpa: string
}

export interface ResumeCertification {
  name: string
  issuer: string
  date: string
  expiry: string
  url: string
}

export interface ResumeProject {
  name: string
  description: string
  technologies: string[]
  url: string
}

export interface ParsedResume {
  contact: ResumeContact
  summary: string
  experience: ResumeExperience[]
  education: ResumeEducation[]
  skills: string[]
  certifications: ResumeCertification[]
  projects: ResumeProject[]
  languages: string[]
  raw_text: string
}

export interface ResumeUploadPayload {
  file: File
  title: string
}

export interface ResumeWithAnalysis {
  id: string
  title: string
  file_name: string
  file_type: string
  file_size: number
  status: string
  parsed_data: ParsedResume | null
  created_at: string
  updated_at: string
  analyses: {
    id: string
    ats_score: number | null
    job_title: string | null
    company_name: string | null
    status: string
    created_at: string
  }[]
}
