import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Controller: POST /api/auth/logout
 * Destroys user session cookie.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('shopee_session_user_id');
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
