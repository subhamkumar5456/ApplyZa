import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  HUGGINGFACE_API_KEY: z.string().min(1).optional(),
  LATEX_COMPILE_API_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Email
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_FROM: z.string().optional(),
  
  // Feature Flags
  ENABLE_RESUME_REFINER: z.string().optional(),
  NEXT_PUBLIC_ENABLE_RESUME_REFINER: z.string().optional(),
});

const _env = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
  LATEX_COMPILE_API_URL: process.env.LATEX_COMPILE_API_URL,
  NODE_ENV: process.env.NODE_ENV,
  
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_FROM: process.env.SMTP_FROM,
  
  ENABLE_RESUME_REFINER: process.env.ENABLE_RESUME_REFINER,
  NEXT_PUBLIC_ENABLE_RESUME_REFINER: process.env.NEXT_PUBLIC_ENABLE_RESUME_REFINER,
});

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
