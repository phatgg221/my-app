import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { upsertGoogleUser } from '@/services/server/vendorServerService';

/**
 * Controller: GET /api/auth/callback/google
 * Handles the OAuth 2.0 redirect from Google Accounts, exchanges authorization code for tokens,
 * retrieves user profile, and registers/updates the user in PostgreSQL.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    console.error('[Google OAuth Callback] Error from Google:', error);
    return NextResponse.redirect(`${appUrl}/?auth_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/?auth_error=no_code_provided`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  if (!clientId || !clientSecret) {
    console.error('[Google OAuth Callback] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local');
    return NextResponse.redirect(`${appUrl}/?auth_error=missing_credentials`);
  }

  try {
    // 1. Exchange authorization code for Google access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('[Google OAuth Callback] Token exchange failed:', tokenError);
      return NextResponse.redirect(`${appUrl}/?auth_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch authenticated user profile from Google UserInfo endpoint
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      const userInfoError = await userInfoResponse.text();
      console.error('[Google OAuth Callback] Failed to fetch Google userinfo:', userInfoError);
      return NextResponse.redirect(`${appUrl}/?auth_error=userinfo_failed`);
    }

    const profile = await userInfoResponse.json();
    const name: string = profile.name || profile.email?.split('@')[0] || 'Google User';
    const email: string = profile.email;
    const avatar: string | undefined = profile.picture;

    // 3. Upsert user in database via Server Service
    const user = await upsertGoogleUser({
      name,
      email,
      avatar,
      role: 'Ops Coordinator',
    });

    // 4. Set secure session cookie
    const cookieStore = await cookies();
    cookieStore.set('shopee_session_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.redirect(`${appUrl}/?auth_success=1`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown OAuth error';
    console.error('[Google OAuth Callback] Unhandled error:', message);
    return NextResponse.redirect(`${appUrl}/?auth_error=oauth_internal_error`);
  }
}
