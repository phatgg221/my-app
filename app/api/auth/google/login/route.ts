import { NextResponse } from 'next/server';

/**
 * Controller: GET /api/auth/google/login
 * Initiates the real Google OAuth 2.0 Authorization Code flow.
 */
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  if (!clientId) {
    // If not configured, redirect back to home with an explicit error query
    return NextResponse.redirect(`${appUrl}/?auth_error=missing_credentials`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(googleOAuthUrl);
}
