import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById } from '@/services/server/vendorServerService';

/**
 * Controller: GET /api/auth/me
 * Returns current authenticated user from session cookie, along with OAuth configuration status.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('shopee_session_user_id')?.value;
    const isGoogleConfigured = Boolean(
      process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
    );

    if (!sessionUserId) {
      return NextResponse.json({
        user: null,
        isGoogleConfigured,
      });
    }

    const user = await getUserById(sessionUserId);
    return NextResponse.json({
      user: user || null,
      isGoogleConfigured,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve session';
    console.error('[API GET /api/auth/me] Error:', message);
    return NextResponse.json({ user: null, isGoogleConfigured: false, error: message }, { status: 500 });
  }
}
