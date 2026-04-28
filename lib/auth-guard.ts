import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from './supabase/server';
import { AuthError } from './errors';

type RouteHandler = (req: NextRequest, userId: string, ...args: any[]) => Promise<NextResponse> | NextResponse;

export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      const supabase = createServerSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !session.user) {
        throw new AuthError('Unauthorized: No active session');
      }

      return await handler(req, session.user.id, ...args);
    } catch (error: any) {
      if (error instanceof AuthError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }
      console.error('[AuthGuard] Error checking authentication:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
