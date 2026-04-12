export type { Database } from '@/types/database'

export type Tables<T extends keyof import('@/types/database').Database['public']['Tables']> =
  import('@/types/database').Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof import('@/types/database').Database['public']['Tables']> =
  import('@/types/database').Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof import('@/types/database').Database['public']['Tables']> =
  import('@/types/database').Database['public']['Tables'][T]['Update']
