import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(1, 'Please enter your full name'),
})

export const resumeUploadSchema = z.object({
  title: z.string().min(1, 'Please provide a title for your resume'),
  file: z.custom<File>((val) => val instanceof File, 'Please select a file')
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      'File size must be less than 10MB'
    )
    .refine(
      (file) => ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type),
      'Only PDF and DOCX files are accepted'
    ),
})

export const analysisRequestSchema = z.object({
  resume_id: z.string().uuid('Invalid resume ID'),
  job_title: z.string().min(1, 'Please enter the job title'),
  job_description: z.string().min(50, 'Job description must be at least 50 characters'),
  company_name: z.string().min(1, 'Please enter the company name'),
})

export const profileUpdateSchema = z.object({
  full_name: z.string().min(1, 'Please enter your full name'),
  avatar_url: z.string().url().optional().or(z.literal('')),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ResumeUploadInput = z.infer<typeof resumeUploadSchema>
export type AnalysisRequestInput = z.infer<typeof analysisRequestSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
