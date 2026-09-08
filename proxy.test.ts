import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy, middleware } from './proxy';

describe(' Middleware Auth Interceptor', () => {
  it('should export middleware as an alias to proxy', () => {
    expect(middleware).toBe(proxy);
  });

  it('should return 401 Unauthorized when POST to /api/vendors/[id]/documents without session cookie', async () => {
    const request = new NextRequest('http://localhost:3000/api/vendors/vendor-123/documents', {
      method: 'POST',
    });

    const response = proxy(request);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
    expect(data.message).toContain('Sign in required to upload documents');
  });

  it('should allow POST to /api/vendors/[id]/documents when session cookie is present', () => {
    const request = new NextRequest('http://localhost:3000/api/vendors/vendor-123/documents', {
      method: 'POST',
      headers: {
        cookie: 'shopee_session_user_id=mock-ops-user-1',
      },
    });

    const response = proxy(request);
    // NextResponse.next() returns a response without 401 status
    expect(response.status).toBe(200);
  });

  it('should allow GET to /api/vendors/[id]/documents even when session cookie is absent', () => {
    const request = new NextRequest('http://localhost:3000/api/vendors/vendor-123/documents', {
      method: 'GET',
    });

    const response = proxy(request);
    expect(response.status).toBe(200);
  });

  it('should allow requests to other endpoints without blocking', () => {
    const request = new NextRequest('http://localhost:3000/api/vendors', {
      method: 'GET',
    });

    const response = proxy(request);
    expect(response.status).toBe(200);
  });
});
