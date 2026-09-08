import { NextResponse } from 'next/server';
import { upsertGoogleUser } from '@/services/server/vendorServerService';
import { GoogleAuthSchema, formatZodError } from '@/lib/validations';

/**
 * Controller: POST /api/auth/google
 * Authenticates/upserts a user signed in via Google OAuth with strict Zod validation.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validationResult = GoogleAuthSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: formatZodError(validationResult.error),
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, avatar, role } = validationResult.data;

    const user = await upsertGoogleUser({
      name,
      email,
      avatar: avatar || undefined,
      role: role || undefined,
    });

    return NextResponse.json(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Google authentication failed';
    console.error('[API POST /api/auth/google] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
