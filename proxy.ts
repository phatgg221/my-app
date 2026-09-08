import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16 Proxy (formerly Middleware)
 * Intercepts requests before reaching route handlers.
 * Enforces session authentication on protected mutation routes like document uploads.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { method } = request;

  // Protect document uploads: POST /api/vendors/[id]/documents
  if (method === 'POST' && pathname.match(/^\/api\/vendors\/[^/]+\/documents$/)) {
    const sessionUserId = request.cookies.get('shopee_session_user_id')?.value;

    if (!sessionUserId) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Sign in required to upload documents. Please authenticate with Google first.',
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

// Aliases for backward/cross-compatibility
export const middleware = proxy;
export default proxy;

export const config = {
  matcher: ['/api/vendors/:path*'],
};
