import { NextResponse } from 'next/server';
import { upsertGoogleUser } from '@/services/server/vendorServerService';

/**
 * Controller: POST /api/auth/google
 * Authenticates/upserts a user signed in via Google OAuth.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, avatar, role } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required for Google authentication.' },
        { status: 400 }
      );
    }

    const user = await upsertGoogleUser({
      name,
      email,
      avatar,
      role,
    });

    return NextResponse.json(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Google authentication failed';
    console.error('[API POST /api/auth/google] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
