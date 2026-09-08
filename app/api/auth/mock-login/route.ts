import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById } from '@/services/server/vendorServerService';
import { z } from 'zod';

const MockLoginSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid coordinator user ID' }),
});

/**
 * Controller: POST /api/auth/mock-login
 * Sets active session user to the selected mock Ops Coordinator.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = MockLoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', message: validation.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const { userId } = validation.data;
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Ops Coordinator not found' }, { status: 404 });
    }

    const cookieStore = await cookies();
    cookieStore.set('shopee_session_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      message: `Active coordinator switched to ${user.name}`,
      user,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to switch coordinator';
    console.error('[API POST /api/auth/mock-login] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
